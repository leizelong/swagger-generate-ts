/**
 * 如何生成Service文件
 */
import * as path from "path";
import * as fs from "fs";
import * as vscode from "vscode";
import { print, types } from "recast";
import {
  TSInterfaceDeclaration,
  File as TsAst,
  ImportDeclaration,
} from "@babel/types";
import * as Sentry from "@sentry/node";
import { namedTypes } from "ast-types";

import {
  formatFunctionName,
  formatTemplateUrl,
  getApiDefinitionKeys,
  getExportNamedDeclaration,
  getMethodOperationId,
  getProjectRoot,
  getRelativeDefinitionPathByUrl,
  getServicePathByUrl,
  getTargetAst,
  OpenApiData,
  protectKey,
  transformDefinitionKey,
} from "./common";

/**
 * 初始化 import { post, get } from '@/utils/request';
 */
function initAstRequestImport(ast: TsAst, method: Methods) {
  const { identifier, importDeclaration, importSpecifier, stringLiteral } =
    types.builders;
  const requestImportPath: string =
    vscode.workspace
      .getConfiguration("swagger-generate-ts")
      .get("requestImportPath") || "@/utils/request";
  const { targetImportNode, lastImportNodeIdx } = getImportNodes(
    ast,
    requestImportPath,
  );

  if (targetImportNode) {
    const specifierKeys = getSpecifierKeys(targetImportNode);
    if (!specifierKeys.includes(method)) {
      const methodSpecifier = importSpecifier(identifier(protectKey(method)));
      targetImportNode.specifiers.push(methodSpecifier as any);
    }
  } else {
    const specifiers = [importSpecifier(identifier(protectKey(method)))];
    const requestDeclaration = importDeclaration(
      specifiers,
      stringLiteral(requestImportPath),
    );
    ast.program.body.splice(
      lastImportNodeIdx + 1,
      0,
      requestDeclaration as any,
    );
    // ast.program.body.push(requestDeclaration as any);
  }
}

function getImportNodes(ast: TsAst, importPath?: string) {
  const body = ast.program.body;
  const importNodes: ImportDeclaration[] = [];
  let lastImportNodeIdx = 0;
  let targetImportNode: ImportDeclaration | undefined;
  for (let index = 0; index < body.length; index++) {
    const node = body[index];
    if (node.type === "ImportDeclaration") {
      importNodes.push(node);
      lastImportNodeIdx = index;
      const nodeSource = node.source.value;
      if (importPath && nodeSource === importPath) {
        targetImportNode = node;
      }
    } else if (node.type === "ExportNamedDeclaration") {
      break;
    }
  }
  return { importNodes, lastImportNodeIdx, targetImportNode };
}

function getSpecifierKeys(importNode: ImportDeclaration) {
  const specifierKeys = importNode.specifiers
    .map(item => {
      if (namedTypes.ImportSpecifier.assert(item)) {
        return item.imported.name;
      }
    })
    .filter(item => !!item);
  return specifierKeys;
}

function addDefinitionImportDeclaration(
  ast: TsAst,
  importPath: string,
  definitionKeys: string[],
) {
  const { identifier, importDeclaration, importSpecifier, stringLiteral } =
    types.builders;

  const { lastImportNodeIdx, targetImportNode } = getImportNodes(
    ast,
    importPath,
  );

  if (!targetImportNode) {
    // 构造 ImportDeclaration
    const specifiers = definitionKeys
      .filter(item => !!item)
      .map(key => importSpecifier(identifier(key)));
    if (specifiers.length) {
      const dtoImportDeclaration = importDeclaration(
        specifiers,
        stringLiteral(importPath),
      );
      ast.program.body.splice(
        lastImportNodeIdx + 1,
        0,
        dtoImportDeclaration as any,
      );
    }
  } else {
    const specifierKeys = getSpecifierKeys(targetImportNode);
    for (const definitionKey of definitionKeys) {
      if (definitionKey && !specifierKeys.includes(definitionKey)) {
        targetImportNode.specifiers.push(
          importSpecifier(identifier(definitionKey)) as any,
        );
      }
    }
  }
}

function insertMethod(
  ast: TsAst,
  url: string,
  method: Methods,
  methods: string[],
  operationsDeclaration: TSInterfaceDeclaration,
  openApiJson: OpenApiJson,
) {
  const {
    exportNamedDeclaration,
    identifier,
    tsTypeReference,
    functionDeclaration,
    blockStatement,
    returnStatement,
    callExpression,
    templateLiteral,
    templateElement,
    tsTypeAnnotation,
    tsTypeParameterInstantiation,
  } = types.builders;

  const operationId = getMethodOperationId(openApiJson, url, method);
  const [queryDto, bodyDto, resDto] = getApiDefinitionKeys(
    operationsDeclaration,
    operationId,
  );
  const importKeys = [bodyDto, resDto].map(item => item?.definitionsKey);
  const [bodyDefinitionKey, resDefinitionKey] = importKeys.map(
    transformDefinitionKey,
  );
  const importPath = getRelativeDefinitionPathByUrl(url);
  addDefinitionImportDeclaration(ast, importPath, [
    bodyDefinitionKey,
    resDefinitionKey,
  ]);

  const bodyKey = "data";
  const queryKey = "query";
  const [exportFunctionName, queryPaths] = formatFunctionName(
    url,
    method,
    methods,
  );
  let templateUrl = formatTemplateUrl(url, queryKey, !!queryPaths?.length);
  const tempNode = templateElement(
    { cooked: templateUrl, raw: templateUrl },
    true,
  );
  const argsNodes: any[] = [templateLiteral([tempNode], [])];

  if (bodyDto) {
    argsNodes.push(identifier(bodyKey));
  }
  const returnNode = returnStatement(
    callExpression(identifier(protectKey(method)), argsNodes),
  );
  const fnNode = blockStatement([returnNode]);

  const fnParamsNodes: any[] = [];
  if (queryDto) {
    const queryParamNode = identifier(queryKey);
    queryParamNode.typeAnnotation = queryDto.tSPropertySignature
      .typeAnnotation as any;
    fnParamsNodes.push(queryParamNode);
  }

  if (bodyDto) {
    const dataParamNode = identifier(bodyKey);
    if (bodyDto.definitionsKey) {
      dataParamNode.typeAnnotation = tsTypeAnnotation(
        tsTypeReference(identifier(bodyDefinitionKey)),
      );
    } else {
      dataParamNode.typeAnnotation = bodyDto.tSPropertySignature
        .typeAnnotation as any;
    }

    fnParamsNodes.push(dataParamNode);
  }

  const fnDeclaration = functionDeclaration(
    identifier(protectKey(exportFunctionName)),
    fnParamsNodes,
    fnNode,
  );

  if (resDto) {
    let resTypeAnnotation:
      | types.namedTypes.TSTypeReference
      | types.namedTypes.TSTypeLiteral;
    if (resDto.definitionsKey) {
      resTypeAnnotation = tsTypeReference(identifier(resDefinitionKey));
    } else {
      resTypeAnnotation = resDto.tSPropertySignature.typeAnnotation
        ?.typeAnnotation as types.namedTypes.TSTypeLiteral;
    }

    fnDeclaration.returnType = tsTypeAnnotation(
      tsTypeReference(
        identifier("Promise"),
        tsTypeParameterInstantiation([resTypeAnnotation]),
      ),
    );
  }

  const exportMethodDeclaration = exportNamedDeclaration(fnDeclaration);
  const astBody = ast.program.body;
  const targetExportIdx = astBody.findIndex(node => {
    if (
      node.type === "ExportNamedDeclaration" &&
      node.declaration?.type === "FunctionDeclaration" &&
      node.declaration.id?.type === "Identifier" &&
      node.declaration.id.name === exportFunctionName
    ) {
      return true;
    }
    return false;
  });
  if (targetExportIdx !== -1) {
    ast.program.body.splice(targetExportIdx, 1, exportMethodDeclaration as any);
  } else {
    ast.program.body.push(exportMethodDeclaration as any);
  }
}

async function generateFileByAst(ast: TsAst, filePath: string) {
  const dirPath = path.dirname(filePath);
  if (!fs.existsSync(dirPath)) {
    await fs.promises.mkdir(dirPath, { recursive: true });
  }

  const code = print(ast).code;
  Sentry.setExtra(`genService => ${filePath}`, code);
  await fs.promises.writeFile(filePath, code, { encoding: "utf-8" });
}

function getRouteMethods(url: string, openApiJson: OpenApiJson): string[] {
  const swaggerBasePath = openApiJson.basePath;
  const relativePath = url.replace(swaggerBasePath, "");
  const urlPathInfo = openApiJson?.paths?.[relativePath];
  if (!urlPathInfo) {
    return [];
  }
  const methods = Object.keys(urlPathInfo);
  return methods;
}

async function genService(
  route: ReceiveData["routes"][0],
  servicePath: ReceiveData["servicePath"],
  operationsDeclaration: TSInterfaceDeclaration,
  openApiJson: OpenApiJson,
) {
  const { url, method } = route;
  const serviceFilePath = servicePath || getServicePathByUrl(route.url);
  const { targetAst, fileExist } = await getTargetAst(serviceFilePath);

  initAstRequestImport(targetAst, method);

  const methods = getRouteMethods(url, openApiJson);
  insertMethod(
    targetAst,
    url,
    method,
    methods,
    operationsDeclaration,
    openApiJson,
  );

  await generateFileByAst(targetAst, serviceFilePath);
}

export async function genServices(
  receiveData: ReceiveData,
  openApiData: OpenApiData,
) {
  const { openApiJson, openApiAst } = openApiData;
  const { servicePath, routes } = receiveData;

  // const projectRoot = getProjectRoot();
  // const { targetAst: testAst } = await getTargetAst(
  //   path.resolve(projectRoot, "src/services/test.ts"),
  // );
  // console.log("test.ts", testAst.program.body);

  const operationsDeclaration = getExportNamedDeclaration(
    openApiAst,
    "operations",
  );

  for (const route of routes) {
    await genService(route, servicePath, operationsDeclaration, openApiJson);
  }
}
