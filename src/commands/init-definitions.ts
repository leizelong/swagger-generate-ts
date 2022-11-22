import * as vscode from "vscode";
import * as Sentry from "@sentry/node";

import { getOpenApiData, quickPickOpenApiJsonUrl } from "../utils/common";
import { genTotalDefinitions } from "../utils/genDefinition";

/**
 * 生成一份完整的类型定义声明文件
 *
 */
export async function initDefinitions() {
  const transaction = Sentry.startTransaction({
    op: "init-definitions",
    name: "initDefinitionsTransaction",
  });
  try {
    const openApiJsonUrl = await quickPickOpenApiJsonUrl();
    if (!openApiJsonUrl) {
      return;
    }
    const openApiData = await getOpenApiData(openApiJsonUrl);
    await genTotalDefinitions(openApiData.openApiAst);
    vscode.window.showInformationMessage("生成Definitions文件成功");
    Sentry.captureMessage("init-definitions success", {
      level: "info",
    });
  } catch (error: any) {
    Sentry.captureException(error);
    vscode.window.showErrorMessage(error.message);
  } finally {
    transaction.finish();
  }
}
