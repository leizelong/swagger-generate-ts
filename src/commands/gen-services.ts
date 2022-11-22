import * as vscode from "vscode";
import * as Sentry from "@sentry/node";

import {
  generateTsFiles,
  getOpenApiJsonUrlOptions,
  loadWebView,
} from "../utils/common";

/**
 * 输入swagger api url，生成Definitions文件
 * webView 通过api，生成definition和request文件模板
 * 最终目的是生成 get 文件
 */
export const generateServices = (extensionPath: string) =>
  async function _generateServices() {
    const transaction = Sentry.startTransaction({
      op: "gen-services",
      name: "genServicesTransaction",
    });
    const openApiJsonUrlOptions: any = getOpenApiJsonUrlOptions();
    try {
      let panel: any;

      function postMessage(data: SendData) {
        console.log("vscode => webview data", data);
        Sentry.setExtra(
          "vscode => webview data",
          JSON.stringify(data, undefined, 2),
        );
        panel?.webview?.postMessage?.(data);
      }

      const onReceiveMessage = async (receiveData: ReceiveData) => {
        console.log("webview => message data", receiveData);
        Sentry.setExtra(
          "webview => message data",
          JSON.stringify(receiveData, undefined, 2),
        );
        try {
          await generateTsFiles(receiveData);
          Sentry.captureMessage("gen-services success", {
            level: "info",
          });
          postMessage({
            success: true,
            source: "vscode",
          });
        } catch (error: any) {
          Sentry.captureException(error);
          postMessage({
            errorMessage: error.message,
            success: false,
            source: "vscode",
          });
        }
      };
      // todo test Data
      // const formData: ReceiveData = {
      //   routes: [
      //     {
      //       url: "/gmp-product-library-portal/library/manage/region/listV2",
      //       method: "post",
      //     },
      //   ],
      //   openApiJsonUrl:
      //     "http://api.test.bbmall.xyb2b.com.cn/gmp-product-library-portal/v2/api-docs",
      // };
      // onReceiveMessage(formData);
      // return;

      panel = await loadWebView(onReceiveMessage, extensionPath);

      postMessage({
        source: "vscode",
        type: "init-config",
        config: {
          openApiJsonUrlOptions,
          // formData: formData,
        },
      });
    } catch (error: any) {
      Sentry.captureException(error);
      vscode.window.showErrorMessage(error.message);
    } finally {
      transaction.finish();
    }
  };
