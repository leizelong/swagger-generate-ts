import * as vscode from "vscode";
import { getOpenApiData, getOpenApiJsonUrlOptions } from "../utils/common";
import { genTotalDefinitions } from "../utils/genDefinition";

async function getOpenApiJsonUrl() {
  const openApiJsonUrlOptions = getOpenApiJsonUrlOptions();
  const items = openApiJsonUrlOptions.map(({ label, value }) => ({
    label,
    value,
    detail: value,
  }));
  const data = await vscode.window.showQuickPick(items, {
    title: 'please select openApiJsonUrl',
    placeHolder: 'input openApiJsonUrl'
  });
  if (!data) {
    throw new Error("please select openApiJsonUrl");
  }
  return data.value;
}

/**
 * 生成一份完整的类型定义声明文件
 *
 */
export async function initDefinitions() {
  try {
    const openApiJsonUrl = await getOpenApiJsonUrl();
    const openApiData = await getOpenApiData(openApiJsonUrl);
    await genTotalDefinitions(openApiData.openApiAst);
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
}
