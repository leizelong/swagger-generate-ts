import * as fs from "fs";
import * as tsParser from "recast/parsers/typescript.js";
import { parse, types } from "recast";
import * as path from "path";
import * as vscode from "vscode";
import type {
  TSInterfaceDeclaration,
  TSPropertySignature,
  File as TsAst,
} from "@babel/types";
import openapiTS from "openapi-typescript";
import { genDefinitions } from "./genDefinition";
import { genServices } from "./genService";
import { jsKeyWordBlackList } from "../constants";
//@ts-ignore
import json5 from "json5";

const axios = require("axios");
const _last = require("lodash/last");
const camelCase = require("lodash/camelCase");

export async function generateTsFiles(receiveData: ReceiveData) {
  const { openApiJsonUrl } = receiveData;
  const openApiData = await getOpenApiData(openApiJsonUrl);
  await genDefinitions(receiveData.routes, openApiData);
  await genServices(receiveData, openApiData);
}

export function getOpenApiJsonUrlOptions(): Array<{
  label: string;
  value: string;
}> {
  const openApiJsonUrlOptions: any =
    vscode.workspace
      .getConfiguration("swagger-generate-ts")
      .get("openApiJsonUrlOptions") || [];
  return openApiJsonUrlOptions;
}

export async function loadWebView(
  onReceiveMessage: (message: ReceiveData) => void,
  extensionPath: string,
) {
  const panel = vscode.window.createWebviewPanel(
    "SwaggerGen",
    "SwaggerGen",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      // 只允许webview加载我们插件的`media`目录下的资源
      // localResourceRoots: [
      //   vscode.Uri.file(path.join(extensionPath, "web-app/build")),
      // ],
    },
  );
  const config = getConfig(extensionPath);
  const isDebug = config.debug;

  async function loadRemoteHtml() {
    const { data: html } = await axios.get("http://localhost:3000/$root");
    panel.webview.html = html.replace(
      /\/\$root/g,
      "http://localhost:3000/$root",
    );
  }

  async function loadLocalHtml() {
    const htmlPath = path.resolve(extensionPath, "web-app/build/index.html");
    const webAppHtml = await fs.promises.readFile(htmlPath, {
      encoding: "utf-8",
    });
    const rootPath = vscode.Uri.file(path.join(extensionPath, "web-app/build"));
    const baseUri = panel.webview.asWebviewUri(rootPath);
    panel.webview.html = webAppHtml.replace(/\/\$root/g, baseUri.toString());
  }

  if (isDebug) {
    await loadRemoteHtml();
  } else {
    await loadLocalHtml();
  }

  panel.webview.onDidReceiveMessage(onReceiveMessage);

  return panel;
}

export function getConfig(extensionPath: string): Config {
  try {
    const configFilePath = path.resolve(extensionPath, ".config.json");
    const fileStr = fs.readFileSync(configFilePath, { encoding: "utf-8" });
    return JSON.parse(fileStr);
  } catch (error) {
    return { debug: false };
  }
}

export function getProjectRoot() {
  if (!vscode.workspace.workspaceFolders?.length) {
    return __dirname;
  }
  return vscode.workspace.workspaceFolders[0].uri.fsPath;
}

export async function getTargetAst(
  filePath: string,
): Promise<{ targetAst: TsAst; fileExist: boolean }> {
  let targetAst: TsAst = parse("");
  let fileExist = false;
  try {
    const fileStat = await fs.promises.stat(filePath);
    if (fileStat.isFile()) {
      fileExist = true;
      const code = await fs.promises.readFile(filePath, {
        encoding: "utf-8",
      });
      targetAst = parse(code, {
        parser: tsParser,
      });
    }
  } catch (error) {
    console.log("getTargetAst-error", error);
  }
  return { targetAst, fileExist };
}

export function safeParse(data: string | Record<string, any>) {
  if (typeof data === "string") {
    try {
      const dataObj = json5.parse(data);
      return dataObj;
    } catch (error) {
      return {};
    }
  }
  return data;
}

function transformOpenApiJson(openApiJson: OpenApiJson) {
  if (!openApiJson.basePath || openApiJson.basePath === "/") {
    openApiJson.basePath = "";
  }
  return openApiJson;
}

export async function fetchOpenApiJson(url: string): Promise<OpenApiJson> {
  // let openApiUrl =
  //   url ||
  //   vscode.workspace
  //     .getConfiguration("swagger-generate-ts")
  //     .get("settingOpenApiJsonUrl");
  // console.log("openApiUrl", openApiUrl);
  // if (!openApiUrl) {
  //   throw new Error("请在Setting中配置settingOpenApiJsonUrl");
  // }
  // openApiUrl += `?timestamp=${new Date().getTime()}`;
  try {
    const res = await axios.get(url);
    let openApiJson = safeParse(res.data);
    if (!(openApiJson.swagger || openApiJson.openapi)) {
      throw new Error("不是标准的openApiJson");
    }
    openApiJson = transformOpenApiJson(openApiJson);
    return openApiJson;
  } catch (error: any) {
    throw new Error(`fetch openApiJsonUrl: ${url} failed: ${error.message}`);
  }
}

export function getMethodOperationId(
  openApiJson: OpenApiJson,
  url: string,
  method: Methods,
) {
  const swaggerBasePath = openApiJson.basePath;
  const relativePath = url.replace(swaggerBasePath, "");
  const pathsEntry = openApiJson.paths;
  const methodEntry = pathsEntry?.[relativePath]?.[method];
  if (!methodEntry) {
    throw new Error(`没有找到route：${url},对应的请求方式：${method}`);
  }
  const { operationId } = methodEntry;
  return operationId;
}
function equalNamePath(
  sourceName: OperationNamePath,
  targetName: string | number,
) {
  if (Object.prototype.toString.call(sourceName) === "[object RegExp]") {
    return (sourceName as RegExp).test(targetName as string);
  }
  return sourceName === targetName;
}

type OperationNamePath = string | number | RegExp;

function findOperationsDefinitionsKey(
  node: TSPropertySignature,
  paths: OperationNamePath[],
) {
  function findOneAnnotation(
    node: TSPropertySignature,
    name: OperationNamePath,
  ) {
    if (node?.typeAnnotation?.typeAnnotation.type === "TSTypeLiteral") {
      const members = node.typeAnnotation.typeAnnotation.members;
      for (const member of members) {
        if (member.type === "TSPropertySignature") {
          if (
            member.key.type === "Identifier" &&
            equalNamePath(name, member.key.name)
          ) {
            return member;
          }

          if (
            member.key.type === "NumericLiteral" &&
            equalNamePath(name, member.key.value)
          ) {
            return member;
          }
        }
      }
    }
  }

  function findDefinitionsKey(node: TSPropertySignature) {
    const typeAnnotation = node?.typeAnnotation?.typeAnnotation;
    if (
      typeAnnotation?.type === "TSIndexedAccessType" &&
      typeAnnotation.indexType.type === "TSLiteralType" &&
      typeAnnotation.indexType.literal.type === "StringLiteral"
    ) {
      // DefinitionsKey
      return typeAnnotation.indexType.literal.value;
    }
  }

  let root: any = node;
  for (const path of paths) {
    root = findOneAnnotation(root, path);
    if (!root) {
      return;
    }
  }
  const result: TSPropertySignature = root === node ? undefined : root;
  if (!result) {
    return;
  }

  const definitionsKey = findDefinitionsKey(result);
  return { definitionsKey, tSPropertySignature: result };
}

export function getApiDefinitionKeys(
  operationsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
  operationId: string,
) {
  const postBodyDtoRegexpStr = getConfiguration("postBodyDtoRegexp");
  const postBodyDtoRegexp = new RegExp(postBodyDtoRegexpStr, "i");

  for (const node of operationsDeclaration.body.body) {
    if (node.type === "TSPropertySignature") {
      if (node.key.type === "Identifier") {
        const { name } = node.key;
        if (operationId === name) {
          const queryDto = findOperationsDefinitionsKey(node, [
            "parameters",
            "path",
          ]);
          // todo 优化，只有一条的时候，别匹配，烦死了
          // post body: parameters.body.xxRequest
          // get body: parameters.query
          const postBodyDto = findOperationsDefinitionsKey(node, [
            "parameters",
            "body",
            // "request",
            // todo 配置化，简直受不了
            postBodyDtoRegexp, // 乱七八糟的key
          ]);

          const getBodyDto = findOperationsDefinitionsKey(node, [
            "parameters",
            "query",
          ]);

          const bodyDto = postBodyDto || getBodyDto;

          // parameters.path
          const resDto = findOperationsDefinitionsKey(node, [
            "responses",
            200,
            /.*(schema)|(content)\b/i, // 乱七八糟的key
          ]);

          return [queryDto, bodyDto, resDto];
        }
      }
    }
  }
  throw new Error(`${operationId} 没有找到reqDtoKey或者resDtoKey`);
}

type TargetNames =
  | "paths"
  | "definitions"
  | "operations"
  | "external"
  | "components";

export function getExportNamedDeclaration(
  ast: TsAst,
  targetName: TargetNames,
): TSInterfaceDeclaration {
  for (const node of ast.program.body) {
    if (
      node.type === "ExportNamedDeclaration" &&
      node?.declaration?.type === "TSInterfaceDeclaration"
    ) {
      const name = node.declaration.id.name;
      if (targetName === name) {
        return node.declaration;
      }
    }
  }
  throw new Error(`没有找到Declaration ${targetName}`);
}
export interface OpenApiData {
  openApiJson: OpenApiJson;
  openApiAst: TsAst;
}

function getSwaggerVersion(openApiJson: OpenApiJson) {
  const version = openApiJson.swagger || openApiJson.openapi || "";
  return Number(version[0]);
}

export async function getOpenApiData(url: string): Promise<OpenApiData> {
  const openApiJson = await fetchOpenApiJson(url);
  const swaggerVersion = getSwaggerVersion(openApiJson);
  const tsSourceCode = await openapiTS(openApiJson, {
    version: swaggerVersion,
  });
  let openApiAst: TsAst = parse(tsSourceCode, {
    parser: tsParser,
  });
  // OpenAPI3 构造definitions export
  if (swaggerVersion === 3) {
    const {
      exportNamedDeclaration,
      tsInterfaceDeclaration,
      identifier,
      tsInterfaceBody,
    } = types.builders;

    const componentsDefinitions = getExportNamedDeclaration(
      openApiAst,
      "components",
    );
    const body = componentsDefinitions.body.body;
    for (const node of body) {
      if (
        node.type === "TSPropertySignature" &&
        node.key.type === "Identifier"
      ) {
        const name = node.key.name;
        if (name === "schemas") {
          const members: types.namedTypes.TSPropertySignature[] =
            // @ts-ignore
            node.typeAnnotation?.typeAnnotation?.members;

          const customDefinitions = exportNamedDeclaration(
            tsInterfaceDeclaration(
              identifier("definitions"),
              tsInterfaceBody(members),
            ),
          );
          openApiAst.program.body.push(customDefinitions as any);
        }
      }
    }
  }
  return { openApiJson, openApiAst };
}

export function protectKey(key: string) {
  // 与js关键字冲突,增加下划线
  if (jsKeyWordBlackList.includes(key)) {
    return `_${key}`;
  }
  return key;
}
/** ApiResult«List«EnumResponse»»  -> ApiResult«List«EnumResponse»»  */
export function transformDefinitionKey(key: string | undefined) {
  if (!key) {
    return "";
  }
  // 标识符的无效字符集
  const charReg = /[^\u4E00-\u9FA5A-Za-z0-9_$]/g;
  key = protectKey(key);
  return key.replace(charReg, "");
}

/** 考虑 /a/b/{c}/ => /a/b/  */
export function formatFunctionName(
  url: string,
  method: string,
  methods: string[],
): [string, string[] | undefined] {
  const queryPaths = url
    .match(/\{[^\/]*\}/g)
    ?.map(query => query.replace(/\{(.*)\}/, "$1"));
  const formattedUrl = formatUrl(url);
  const paths = formattedUrl.split("/").filter(item => !!item);
  // todo 考虑 restful api 加上 method
  let fnName = _last(paths);
  if (methods.length > 1) {
    // restful api add method
    fnName = camelCase(`${method} ${fnName}`);
  }
  return [fnName, queryPaths];
}

/** url: /a/b/{c} => `/a/b/${c}` */
export function formatTemplateUrl(
  url: string,
  queryKey: string,
  needFormat: boolean = false,
) {
  if (!needFormat) {
    return url;
  }
  let res = "";
  const len = url.length;
  for (let index = 0; index < len; index++) {
    const char = url[index];
    const isStart = char === "{";
    if (isStart) {
      res += "$";
    }
    res += char;
    if (isStart) {
      res += `${queryKey}.`;
    }
  }
  return res;
}

/** 考虑 /a/b/{c} => /a/b */
function formatUrl(url: string) {
  return url.replace(/\/\{[^\/]*\}/g, "");
}

function getPath(url: string, prefix: string, suffix: string) {
  const projectRoot = getProjectRoot();
  const formattedUrl = formatUrl(url);
  return path.join(projectRoot, prefix, path.dirname(formattedUrl), suffix);
}

export function getDefinitionPathByUrl(url: string) {
  return getPath(url, "definitions", "index.d.ts");
}

export function getRelativeDefinitionPathByUrl(url: string) {
  const formattedUrl = formatUrl(url);
  return "@definitions" + path.dirname(formattedUrl);
}

// url: /admin/media/refluxCategory/addCategoryBinding
export function getServicePathByUrl(url: string) {
  return getPath(url, "src/services", "index.ts");
}

export async function quickPickOpenApiJsonUrl() {
  const openApiJsonUrlOptions = getOpenApiJsonUrlOptions();
  const items = openApiJsonUrlOptions.map(({ label, value }) => ({
    label,
    value,
    detail: value,
  }));
  const data = await vscode.window.showQuickPick(items, {
    title: "please select openApiJsonUrl",
    placeHolder: "select openApiJsonUrl",
  });
  return data?.value;
}

export function getPackageJson(): PackageJson {
  try {
    const fileStr = fs.readFileSync(
      path.join(path.dirname(__dirname), "package.json"),
      {
        encoding: "utf8",
      },
    );
    return JSON.parse(fileStr);
  } catch (error) {
    return {} as PackageJson;
  }
}

export async function getTotalRoutesByUrl(openApiJsonUrl: string) {
  const openApiJson = await fetchOpenApiJson(openApiJsonUrl);
  const { basePath, paths } = openApiJson;

  const totalRoutes: Route[] = [];
  const urlRoutes: { url: string; methods: string[] }[] = [];

  for (const [path, methodEntry] of Object.entries(paths)) {
    const url = basePath + path;
    const methods = Object.keys(methodEntry);
    urlRoutes.push({ url, methods });
    for (const method of Object.keys(methodEntry)) {
      totalRoutes.push({ url, method } as Route);
    }
  }
  return { totalRoutes, urlRoutes };
}

type ConfigurationKeys =
  | "requestImportPath"
  | "postBodyDtoRegexp"
  | "openApiJsonUrlOptions";

export function getConfiguration(configKey: ConfigurationKeys): string {
  const configValue = vscode.workspace
    .getConfiguration("swagger-generate-ts")
    .get<string>(configKey);
  if (!configValue) {
    throw new Error(`配置项${configKey}无效`);
  }
  return configValue;
}
