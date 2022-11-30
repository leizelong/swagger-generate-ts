import * as vscode from "vscode";
import * as Sentry from "@sentry/node";

import {
  generateTsFiles,
  getOpenApiJsonUrlOptions,
  getTotalRoutesByUrl,
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
    const chatMessages: any = [];
    const openApiJsonUrlOptions: any = getOpenApiJsonUrlOptions();
    const vscodeMsgKey = "vscode => webview data";
    const webviewMsgKey = "webview => webview data";
    try {
      let panel: any;

      function postMessage(originSendData: Omit<SendData, "source">) {
        const sendData = Object.assign({}, originSendData, {
          source: "vscode",
        });
        console.log(vscodeMsgKey, sendData);
        chatMessages.push(sendData);
        Sentry.setExtra("chatMessages", chatMessages);
        panel?.webview?.postMessage?.(sendData);
      }

      async function onOpenJsonUrlChange(openApiJsonUrl: string) {
        const { urlRoutes } = await getTotalRoutesByUrl(openApiJsonUrl);
        const routesOptions = urlRoutes.map(({ url, methods }) => {
          return {
            label: url,
            value: url,
            methods,
          };
        });

        postMessage({
          type: "init-config",
          config: { routesOptions },
        });
      }

      const onReceiveMessage = async (receiveData: ReceiveData) => {
        console.log(webviewMsgKey, receiveData);
        chatMessages.push(receiveData);

        Sentry.setExtra("chatMessages", chatMessages);

        try {
          if (receiveData.type === "submit") {
            await generateTsFiles(receiveData);
          } else if (receiveData.type === "info") {
            await onOpenJsonUrlChange(receiveData.openApiJsonUrl);
          }

          Sentry.captureMessage("gen-services success", {
            level: "info",
          });

          if (receiveData.type === "submit") {
            postMessage({
              success: true,
            });
          }
        } catch (error: any) {
          Sentry.captureException(error);
          postMessage({
            errorMessage: error.message,
            success: false,
          });
        }
      };
      // todo test Data
      // const formData: ReceiveData = {
      //   routes: [
      //     {
      //       url: "/library/manage/item/{platform}/{channel}/itemList",
      //       method: "post",
      //     },
      //   ],
      //   openApiJsonUrl:
      //     "http://api.test.bbmall.xyb2b.com.cn/gmp-product-library-portal/v2/api-docs",
      //   type: "submit",
      // };
      // onReceiveMessage(formData);
      // return;

      panel = await loadWebView(onReceiveMessage, extensionPath);

      postMessage({
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
