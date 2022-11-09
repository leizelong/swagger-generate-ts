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

async function getApiUrl() {
  const url = await vscode.window.showInputBox({
    title: "Swagger url",
    prompt: "Swagger api 文档地址",
    value:
      "http://un-api.test.bbmall.xyb2b.com.cn/admin/doc.html#/default/%E5%88%86%E7%B1%BB%E7%AE%A1%E7%90%86/addChildUsingPOST",
  });
  if (!url) {
    throw new Error("请输入Swagger api 地址");
  }
  return url;
}

function loadWebView(onReceiveMessage: (message: ChannelData) => void) {
  const panel = vscode.window.createWebviewPanel(
    "SwaggerGen",
    "SwaggerGen",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    },
  );
  panel.webview.html = html;
  panel.webview.onDidReceiveMessage(onReceiveMessage);
  return panel;
}

/**
 * 输入swagger api url，生成Definitions文件
 * webView 通过api，生成definition和request文件模板
 * 最终目的是生成 get 文件
 */
export async function generateDefinitions() {
  try {
    const openApiData = await getOpenApiData();
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
        } catch (error) {
          console.log("error", error);
        }

        panel.webview.postMessage({ msg: "success", success: true });
      };
      const panel = loadWebView(onReceiveMessage);
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
}
