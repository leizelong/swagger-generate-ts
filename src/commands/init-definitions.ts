import * as vscode from "vscode";
import { getOpenApiData, quickPickOpenApiJsonUrl } from "../utils/common";
import { genTotalDefinitions } from "../utils/genDefinition";

/**
 * 生成一份完整的类型定义声明文件
 *
 */
export async function initDefinitions() {
  try {
    const openApiJsonUrl = await quickPickOpenApiJsonUrl();
    if (!openApiJsonUrl) {
      return;
    }
    const openApiData = await getOpenApiData(openApiJsonUrl);
    await genTotalDefinitions(openApiData.openApiAst);
    vscode.window.showInformationMessage('生成Definitions文件成功');
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
}
