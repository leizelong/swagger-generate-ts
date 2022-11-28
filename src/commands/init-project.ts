import * as vscode from "vscode";
import * as Sentry from "@sentry/node";

import {
  generateTsFiles,
  getTotalRoutesByUrl,
  quickPickOpenApiJsonUrl,
} from "../utils/common";

/**
 * 适用于初始化项目，生成一份完整的类型定义声明文件 + services调用
 *
 */
export async function initProject() {
  const transaction = Sentry.startTransaction({
    op: "init-project",
    name: "initProjectTransaction",
  });
  try {
    const openApiJsonUrl = await quickPickOpenApiJsonUrl();
    if (!openApiJsonUrl) {
      return;
    }

    const totalRoutes = await getTotalRoutesByUrl(openApiJsonUrl);

    const errMessages = [];
    // todo collect errMessages and write
    generateTsFiles({ openApiJsonUrl, routes: totalRoutes });
    Sentry.captureMessage("init-project success", {
      level: "info",
    });
    vscode.window.showInformationMessage("初始化项目成功");
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  } finally {
    transaction.finish();
  }
}
