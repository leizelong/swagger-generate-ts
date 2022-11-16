import * as fs from "fs";
import * as tsParser from "recast/parsers/typescript.js";
import { parse, print, types, prettyPrint } from "recast";
import * as path from "path";
import * as vscode from "vscode";
import type {
  TSInterfaceDeclaration,
  TSPropertySignature,
  File as TsAst,
} from "@babel/types";
import openapiTS from "openapi-typescript";
const axios = require("axios");

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
    const { data: html } = await axios.get("http://localhost:3000");
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


interface Config {
  debug: boolean;
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
  return vscode.workspace.workspaceFolders[0].uri.path;
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
    const openApiJson = res.data;
    if (!openApiJson.swagger) {
      throw new Error("不是标准的openApiJson");
    }
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

function findOperationsDefinitionsKey(
  node: TSPropertySignature,
  paths: (string | number)[],
) {
  function findOneAnnotation(node: TSPropertySignature, name: string | number) {
    if (node?.typeAnnotation?.typeAnnotation.type === "TSTypeLiteral") {
      const members = node.typeAnnotation.typeAnnotation.members;
      for (const member of members) {
        if (member.type === "TSPropertySignature") {
          if (member.key.type === "Identifier" && name === member.key.name) {
            return member;
          }

          if (
            member.key.type === "NumericLiteral" &&
            name === member.key.value
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
  const result = root === node ? undefined : root;
  if (!result) {
    return;
  }

  const definitionsKey = findDefinitionsKey(result);
  return definitionsKey;
}

export function getApiDefinitionKeys(
  operationsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
  operationId: string,
) {
  for (const node of operationsDeclaration.body.body) {
    if (node.type === "TSPropertySignature") {
      if (node.key.type === "Identifier") {
        const { name } = node.key;
        if (operationId === name) {
          // todo hit; reqDto; resDto
          const reqDtoKey = findOperationsDefinitionsKey(node, [
            "parameters",
            "body",
            "request",
          ]);
          const resDtoKey = findOperationsDefinitionsKey(node, [
            "responses",
            200,
            "schema",
          ]);
          return [reqDtoKey, resDtoKey];
        }
      }
    }
  }
  throw new Error(`${operationId} 没有找到reqDtoKey或者resDtoKey`);
}

type TargetNames = "paths" | "definitions" | "operations" | "external";

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

export async function getOpenApiData(url: string): Promise<OpenApiData> {
  const openApiJson = await fetchOpenApiJson(url);
  const swaggerVersion = Number(openApiJson.swagger);
  const tsSourceCode = await openapiTS(openApiJson, {
    version: swaggerVersion,
  });
  const openApiAst: TsAst = parse(tsSourceCode, {
    parser: tsParser,
  });
  return { openApiJson, openApiAst };
}
/** ApiResult«List«EnumResponse»»  -> ApiResult«List«EnumResponse»»  */
export function transformDefinitionKey(key: string | undefined) {
  if (!key) {
    return "";
  }
  return key.replace(/«/g, "").replace(/»/g, "");
}

function getPath(url: string, prefix: string, suffix: string) {
  const projectRoot = getProjectRoot();
  const packagePath = url.replace(/\/(.*)\/.*/, "$1");
  return path.resolve(projectRoot, prefix, packagePath, suffix);
}

export function getDefinitionPathByUrl(url: string) {
  return getPath(url, "definitions", "index.d.ts");
}

export function getRelativeDefinitionPathByUrl(url: string) {
  const packagePath = url.replace(/\/(.*)\/.*/, "$1");
  return path.join("@definitions", packagePath);
}

// url: /admin/media/refluxCategory/addCategoryBinding
export function getServicePathByUrl(url: string) {
  return getPath(url, "src/services", "index.ts");
}
