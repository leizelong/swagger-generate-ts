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

// type TsAst = import("@babel/types").File;

type TargetNames = "paths" | "definitions" | "operations" | "external";

function getExportNamedDeclaration(
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

/**
 *
 *
 * @param {string} url
 * @return {*}  addUsingPOST
 */
function getControllerMethodByUrl(url: string) {
  const parts = url.split("/");
  const operationKey = parts[parts.length - 1];
  return operationKey;
}

function getControllerRouteByPathsDeclaration(
  declaration: ReturnType<typeof getExportNamedDeclaration>,
  method: string,
) {
  const methodName = method.replace(/(.*)Using.*/, "$1");

  for (const node of declaration?.body?.body) {
    if (node.type === "TSPropertySignature") {
      let route: string = "";
      if (node.key.type === "StringLiteral") {
        route = node.key.value;
      }
      // todo 通过method 相似性匹配，过滤不符合的画像
      if (!route.includes(methodName)) {
        continue;
      }
      if (node?.typeAnnotation?.typeAnnotation.type === "TSTypeLiteral") {
        const members = node.typeAnnotation.typeAnnotation.members;

        for (const member of members) {
          if (
            member?.typeAnnotation?.typeAnnotation.type ===
            "TSIndexedAccessType"
          ) {
            const indexType = member?.typeAnnotation?.typeAnnotation.indexType;
            if (
              indexType.type === "TSLiteralType" &&
              indexType.literal.type === "StringLiteral"
            ) {
              const { value: operationKey } = indexType.literal;
              if (method === operationKey) {
                // todo hit it
                return route;
              }
            }
          }
        }
      }
    }
  }

  throw new Error(`通过method获取路由失败: ${method}`);
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

  let root: any = node;
  for (const path of paths) {
    root = findOneAnnotation(root, path);
    if (!root) {
      return;
    }
  }
  const result = root === node ? undefined : root;
  if (!result) {
    return "";
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
  const definitionsKey = findDefinitionsKey(result);
  return definitionsKey;
}

function getApiDefinitionKeys(
  operationsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
  method: string,
) {
  for (const node of operationsDeclaration.body.body) {
    if (node.type === "TSPropertySignature") {
      if (node.key.type === "Identifier") {
        const { name } = node.key;
        if (method === name) {
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
          return [reqDtoKey, resDtoKey].filter(item => !!item) as string[];
        }
      }
    }
  }
  return [];
}

function getDefinitionsByKeys(
  definitionsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
  definitionKeys: string[],
): TSPropertySignature[] {
  function findDefinitionByKey(
    definitionsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
    definitionKey: string,
  ) {
    for (const node of definitionsDeclaration.body.body) {
      if (node.type === "TSPropertySignature") {
        switch (node.key.type) {
          case "Identifier":
            if (node.key.name === definitionKey) {
              return node;
            }
            break;
          case "StringLiteral":
            if (node.key.value === definitionKey) {
              return node;
            }
            break;
          default:
            break;
        }
      }
    }
  }

  let result: TSPropertySignature[] = [];
  for (const definitionKey of definitionKeys) {
    const data = findDefinitionByKey(definitionsDeclaration, definitionKey);
    data && result.push(data);
  }
  return result;
}
/**
 * 1. 判断文件路径，有则读取，无则生成。获取到 targetAst
 * 2. builder Ast Node
 * 3. combine
 * 4. write
 *
 * @param {string} filePath
 * @param {ReturnType<typeof getDefinitionsByKeys>} definitions
 */
async function writeDefinitions(
  definitionsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
  dirPath: string,
  definitions: ReturnType<typeof getDefinitionsByKeys>,
) {
  const fileName = "index.d.ts";

  const filePath = path.resolve(dirPath, fileName);
  let fileExist = false;

  async function getTargetAst(): Promise<TsAst> {
    let targetAst: TsAst = parse("");

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
    return targetAst;
  }

  // step1. get targetAst
  const targetAst = await getTargetAst();

  // step2. builderBody

  function builderAstBody(ast: TsAst) {
    // todo 递归寻找definitions
    const {
      exportNamedDeclaration,
      tsInterfaceDeclaration,
      identifier,
      tsInterfaceBody,
      tsTypeReference,
      tsArrayType,
    } = types.builders;

    insertDefinitions(ast, definitions);

    // todo 递归寻找definitions
    function recursiveDefinition(ast: TsAst, definition: TSPropertySignature) {
      if (definition?.typeAnnotation?.typeAnnotation.type === "TSTypeLiteral") {
        const interfaceName = getInterfaceName(definition);
        const members = definition.typeAnnotation.typeAnnotation.members;
        const memberLen = members.length;

        const body: any[] = [...members];

        for (let idx = 0; idx < memberLen; idx++) {
          const member = members[idx];

          let memberValue = member?.typeAnnotation?.typeAnnotation;
          let isArrayType = false;
          if (memberValue?.type === "TSArrayType") {
            memberValue = memberValue.elementType;
            isArrayType = true;
          }
          if (
            memberValue?.type === "TSIndexedAccessType" &&
            memberValue.indexType.type === "TSLiteralType" &&
            memberValue.indexType.literal.type === "StringLiteral"
          ) {
            // todo search recursive insert into ast
            const definitionKey = memberValue.indexType.literal.value;
            const [innerDefinition] = getDefinitionsByKeys(
              definitionsDeclaration,
              [definitionKey],
            );
            const innerName = getInterfaceName(innerDefinition);
            let nextTypeAnnotation: any = tsTypeReference(
              identifier(innerName),
            );
            if (isArrayType) {
              nextTypeAnnotation = tsArrayType(nextTypeAnnotation);
            }
            const item = {
              ...member,
              typeAnnotation: {
                ...member.typeAnnotation,
                typeAnnotation: nextTypeAnnotation,
              },
            };
            body[idx] = item;

            recursiveDefinition(ast, innerDefinition);
            // todo insert action
          }
        }
        const tsDeclaration = tsInterfaceDeclaration(
          identifier(interfaceName),
          tsInterfaceBody(body),
        );
        const exportDeclaration = exportNamedDeclaration(tsDeclaration);
        insertIntoAst(ast, interfaceName, exportDeclaration);
      }
    }
    /** ApiResult«List«EnumResponse»»  -> ApiResult«List«EnumResponse»»  */
    function getInterfaceName(definition: TSPropertySignature) {
      let name: string = "";
      switch (definition.key.type) {
        case "Identifier":
          name = definition.key.name;
          break;
        case "StringLiteral":
          name = definition.key.value;
          break;
        default:
          break;
      }
      if (!name) {
        throw new Error("获取InterfaceName失败");
      }
      const replaceName = name.replace("«", "_").replace("»", "");
      return replaceName;
    }

    function insertIntoAst(
      ast: TsAst,
      interfaceName: string,
      exportDeclaration: any,
    ) {
      const len = ast.program.body.length;
      for (let idx = 0; idx < len; idx++) {
        const node = ast.program.body[idx];
        if (
          node.type === "ExportNamedDeclaration" &&
          node.declaration?.type === "TSInterfaceDeclaration"
        ) {
          const name = node.declaration.id.name;
          if (name === interfaceName) {
            ast.program.body[idx] = exportDeclaration;
            return;
          }
        }
      }
      ast.program.body.push(exportDeclaration);
    }

    function insertDefinitions(ast: TsAst, definitions: TSPropertySignature[]) {
      for (const definition of definitions) {
        recursiveDefinition(ast, definition);
      }
    }
  }
  builderAstBody(targetAst);

  // step3. write file
  async function generateFile(dirPath: string, ast: TsAst) {
    if (!fileExist) {
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
      } catch (error) {
        console.log("generateFile dirPath error", dirPath, error);
      }
    }
    const code = print(ast).code;
    console.log("code", code);
    await fs.promises.writeFile(filePath, code, { encoding: "utf-8" });
  }

  await generateFile(dirPath, targetAst);
}

function getProjectRoot() {
  if (!vscode.workspace.workspaceFolders?.length) {
    return __dirname;
  }
  return vscode.workspace.workspaceFolders[0].uri.path;
}

function getDirPath(routePath: string) {
  const baseDir = "definitions";
  const projectRoot = getProjectRoot();
  const dirPath = path.resolve(
    projectRoot,
    baseDir,
    routePath.replace(/\/(.*)\/.*/, "$1"),
  );
  console.log("dirPath", dirPath);
  return dirPath;
}

export async function writeDefinitionFile(tsAst: TsAst, apiUrl: string) {
  const pathsDeclaration = getExportNamedDeclaration(tsAst, "paths");

  const controllerMethod = getControllerMethodByUrl(apiUrl);
  const controllerRoute = getControllerRouteByPathsDeclaration(
    pathsDeclaration,
    controllerMethod,
  );

  const operationsDeclaration = getExportNamedDeclaration(tsAst, "operations");
  const dtoKeys = getApiDefinitionKeys(operationsDeclaration, controllerMethod);
  const definitionsDeclaration = getExportNamedDeclaration(
    tsAst,
    "definitions",
  );
  const definitions = getDefinitionsByKeys(definitionsDeclaration, dtoKeys);
  const dirPath = getDirPath(controllerRoute);

  await writeDefinitions(definitionsDeclaration, dirPath, definitions);
}
