// import * as axios from "axios";
import * as fs from "fs";
import openapiTS from "openapi-typescript";
import * as vscode from "vscode";
import { parse, print, types, prettyPrint } from "recast";
import * as tsParser from "recast/parsers/typescript.js";
import { writeDefinitionFile } from "../utils";

const axios = require("axios");

type TsAst = import("@babel/types").File;

async function fetchOpenApiJson() {
  const openApiUrl = vscode.workspace
    .getConfiguration("swagger-generate-ts")
    .get("settingOpenApiJsonUrl");
  console.log("openApiUrl", openApiUrl);
  if (!openApiUrl) {
    throw new Error("请在Setting中配置settingOpenApiJsonUrl");
  }
  try {
    const res = await axios.get(openApiUrl);
    const openApiJson = res.data;
    if (!openApiJson.swagger) {
      throw new Error("不是标准的openApiJson");
    }
    return openApiJson;
  } catch (error: any) {
    throw new Error(`get openApiJson failed: ${error.message}`);
  }
}

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

/**
 * 输入swagger api url，生成Definitions文件
 */
export async function generateDefinitions() {
  try {
    const openApiJson = await fetchOpenApiJson();
    const swaggerVersion = Number(openApiJson.swagger);
    const tsSourceCode = await openapiTS(openApiJson, {
      version: swaggerVersion,
    });
    const tsAst: TsAst = parse(tsSourceCode, {
      parser: tsParser,
    });
    const apiUrl = await getApiUrl();
    await writeDefinitionFile(tsAst, apiUrl);
  } catch (error: any) {
    vscode.window.showErrorMessage(error.message);
  }
}
