// import * as axios from "axios";
import * as fs from "fs";
import openapiTS from "openapi-typescript";
import * as vscode from "vscode";
import { parse, print, types, prettyPrint } from "recast";
import * as tsParser from "recast/parsers/typescript.js";
import { genDefinitions, writeDefinitionFile } from "../utils/genDefinition";
import html from "../webview/index.html";
import { genServices } from "../utils/genService";
import { getOpenApiData } from "../utils/common";
import * as path from "path";

async function loadWebView(
  onReceiveMessage: (message: ChannelData) => void,
  extensionPath: string,
) {
  const panel = vscode.window.createWebviewPanel(
    "SwaggerGen",
    "SwaggerGen",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      // 只允许webview加载我们插件的`media`目录下的资源
      // localResourceRoots: [
      //   vscode.Uri.file(path.join(extensionPath, "web-app/build")),
      // ],
    },
  );
  const htmlPath = path.resolve(extensionPath, "web-app/build/index.html");
  const webAppHtml = await fs.promises.readFile(htmlPath, {
    encoding: "utf-8",
  });
  const rootPath = vscode.Uri.file(path.join(extensionPath, "web-app/build"));
  const baseUri = panel.webview.asWebviewUri(rootPath);
  panel.webview.html = webAppHtml.replace(/\/\$root/g, baseUri.toString());
  panel.webview.onDidReceiveMessage(onReceiveMessage);
  return panel;
}

/**
 * 输入swagger api url，生成Definitions文件
 * webView 通过api，生成definition和request文件模板
 * 最终目的是生成 get 文件
 */
export const generateDefinitions = (extensionPath: string) =>
  async function generateDefinitions() {
    try {
      const openApiData = await getOpenApiData();
      // const openApiData = {} as any;
      // mock Test
      const receiveData: ChannelData = {
        // servicePath: '/src/service/'
        routes: [
          {
            url: "/admin/media/refluxCategory/queryChannelCategory",
            method: "get",
          },
          {
            url: "/admin/media/refluxCategory/addCategoryBinding",
            method: "post",
          },
        ],
      };

      // await genDefinitions(receiveData.routes, openApiData);
      // await genServices(receiveData, openApiData);

      const onReceiveMessage = async (channelData: ChannelData) => {
        console.log("webview => message", channelData);
        try {
          await genDefinitions(channelData.routes, openApiData);
          await genServices(channelData, openApiData);
          panel.webview.postMessage({
            success: true,
            source: "vscode",
          });
        } catch (error: any) {
          console.log("error", error);
          panel.webview.postMessage({
            errorMessage: error.message,
            success: false,
            source: "vscode",
          });
        }

        // panel.webview.postMessage({
        //   msg: "success",
        //   success: true,
        //   source: "vscode",
        // });
      };
      const panel = await loadWebView(onReceiveMessage, extensionPath);
    } catch (error: any) {
      vscode.window.showErrorMessage(error.message);
    }
  };
