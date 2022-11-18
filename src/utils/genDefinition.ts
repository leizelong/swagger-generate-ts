import * as fs from "fs";
import { print, types, prettyPrint } from "recast";
import * as path from "path";
import type { TSPropertySignature, File as TsAst } from "@babel/types";
import {
  getApiDefinitionKeys,
  getDefinitionPathByUrl,
  getExportNamedDeclaration,
  getMethodOperationId,
  getProjectRoot,
  getTargetAst,
  OpenApiData,
  transformDefinitionKey,
} from "./common";

function getDefinitionsByKeys(
  definitionsDeclaration: ReturnType<typeof getExportNamedDeclaration>,
  definitionKeys: (string | undefined)[],
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
    if (definitionKey) {
      const data = findDefinitionByKey(definitionsDeclaration, definitionKey);
      data && result.push(data);
    }
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
  filePath: string,
  definitions: ReturnType<typeof getDefinitionsByKeys>,
) {
  const dirPath = path.dirname(filePath);

  // step1. get targetAst
  const { targetAst, fileExist } = await getTargetAst(filePath);

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

    // todo 递归寻找definitions
    function recursiveDefinition(
      ast: TsAst,
      definition: TSPropertySignature,
      definitionKeySet: Set<string>,
    ) {
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
            if (!definitionKeySet.has(definitionKey)) {
              /** 
               *   
    QueryChannelCategoryResponse
  QueryChannelCategoryResponse: {
    categories?: definitions["QueryChannelCategoryResponse"][];
               *  避免这种情况
               */
              definitionKeySet.add(definitionKey);
              recursiveDefinition(ast, innerDefinition, definitionKeySet);
            }
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
      return transformDefinitionKey(name);
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
      let definitionKeySet = new Set<string>();

      for (const definition of definitions) {
        recursiveDefinition(ast, definition, definitionKeySet);
      }
    }
    insertDefinitions(ast, definitions);
  }
  builderAstBody(targetAst);

  // step3. write file
  async function generateFile(dirPath: string, ast: TsAst) {
    if (!fileExist) {
      try {
        await fs.promises.mkdir(dirPath, { recursive: true });
      } catch (error) {
        console.log("generateFile dirPath error", dirPath, error);
        throw error;
      }
    }
    const code = print(ast).code;
    await fs.promises.writeFile(filePath, code, { encoding: "utf-8" });
  }

  await generateFile(dirPath, targetAst);
}

export async function writeDefinitionFile(
  tsAst: TsAst,
  operationId: string,
  url: string,
) {
  const operationsDeclaration = getExportNamedDeclaration(tsAst, "operations");
  const dtoKeys = getApiDefinitionKeys(operationsDeclaration, operationId);
  const definitionsDeclaration = getExportNamedDeclaration(
    tsAst,
    "definitions",
  );
  const definitions = getDefinitionsByKeys(definitionsDeclaration, dtoKeys);

  const filePath = getDefinitionPathByUrl(url);

  await writeDefinitions(definitionsDeclaration, filePath, definitions);
}

export async function genDefinitions(
  routes: ChannelData["routes"],
  openApiData: OpenApiData,
) {
  const { openApiJson, openApiAst } = openApiData;

  async function genDefinitionByRoute(route: ChannelData["routes"][0]) {
    /**
     * {
          url: "/admin/media/refluxCategory/addCategoryBinding",
          method: "post",
        }
     */
    const { method, url } = route;
    const operationId = getMethodOperationId(openApiJson, url, method);
    await writeDefinitionFile(openApiAst, operationId, url);
  }

  for (const route of routes) {
    await genDefinitionByRoute(route);
  }
}

export async function initDefinitions(ast: TsAst) {
  const source = print(ast);
  const projectRoot = getProjectRoot();
  const filePath = path.resolve(projectRoot, "openApi.d.ts");
  console.log("source", source);

  await fs.promises.writeFile(filePath, source.code, { encoding: "utf-8" });
}
