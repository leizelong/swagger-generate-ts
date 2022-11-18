// import * as axios from "axios";
import * as fs from "fs";
import * as vscode from "vscode";
import { genDefinitions } from "../utils/genDefinition";
import { genServices } from "../utils/genService";
import { getOpenApiData, loadWebView } from "../utils/common";

/**
 * 输入swagger api url，生成Definitions文件
 * webView 通过api，生成definition和request文件模板
 * 最终目的是生成 get 文件
 */
export const generateDefinitions = (extensionPath: string) =>
  async function generateDefinitions() {
    const openApiJsonUrlOptions: any = vscode.workspace
      .getConfiguration("swagger-generate-ts")
      .get("openApiJsonUrlOptions");
    try {
      let panel: any = {};

      function postMessage(data: SendData) {
        console.log("vscode => webview data", data);
        panel?.webview?.postMessage?.(data);
      }

      const onReceiveMessage = async (channelData: ReceiveData) => {
        console.log("webview => message", channelData);
        const { openApiJsonUrl } = channelData;
        try {
          const openApiData = await getOpenApiData(openApiJsonUrl);
          await genDefinitions(channelData.routes, openApiData);
          await genServices(channelData, openApiData);
          postMessage({
            success: true,
            source: "vscode",
          });
        } catch (error: any) {
          console.log("error", error);
          postMessage({
            errorMessage: error.message,
            success: false,
            source: "vscode",
          });
        }
      };
      // todo test Data
      const formData: ReceiveData = {
        routes: [
          {
            url: "/admin/corporation/corporationList",
            method: "post",
          },
        ],
        openApiJsonUrl:
          "http://un-api.test.bbmall.xyb2b.com.cn/admin/v2/api-docs",
      };
      onReceiveMessage(formData);
      return;

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
      vscode.window.showErrorMessage(error.message);
    }
  };
