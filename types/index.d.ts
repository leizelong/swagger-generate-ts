///<reference types="@babel/types" />

declare module "*.html";

type Methods = "get" | "post" | "delete" | "put";

declare interface SendData {
  errorMessage?: string;
  success?: boolean;
  type?: "init-config";
  config?: {
    openApiJsonUrlOptions: Array<{ label: string; value: string }>;
  };
  source: "vscode";
}
declare interface ReceiveData {
  servicePath?: string;
  openApiJsonUrl: string;
  routes: Array<{ method: Methods; url: string }>;
}
/** webView 通信数据源 */
declare type ChannelData = SendData & ReceiveData;

type RouteEntry = Record<
  string,
  {
    [key in Methods]: {
      operationId: string;
    };
  }
>;
declare interface OpenApiJson {
  swagger: string;
  basePath: string;
  paths: RouteEntry;
}
