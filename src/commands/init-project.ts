import * as vscode from "vscode";
import {
  generateTsFiles,
  getOpenApiData,
  quickPickOpenApiJsonUrl,
} from "../utils/common";

/**
 * 适用于初始化项目，生成一份完整的类型定义声明文件 + services调用
 *
 */
export async function initProject() {
  try {
    const openApiJsonUrl = await quickPickOpenApiJsonUrl();
    if (!openApiJsonUrl) {
      return;
    }
    const { openApiJson } = await getOpenApiData(openApiJsonUrl);
    const { basePath, paths } = openApiJson;

    let totalRoutes = [];
    for (const [path, methodEntry] of Object.entries(paths)) {
      const url = basePath + path;
      for (const method of Object.keys(methodEntry)) {
        totalRoutes.push({ url, method } as Route);
      }
    }

    const errMessages = [];
    // todo collect errMessages and write
    generateTsFiles({ openApiJsonUrl, routes: totalRoutes });
    vscode.window.showInformationMessage("初始化项目成功");
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
}