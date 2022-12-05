///<reference types="@babel/types" />

declare module "*.html";

type Methods = "get" | "post" | "delete" | "put";

declare interface SendData {
  errorMessage?: string;
  success?: boolean;
  type?: "init-config";
  config?: {
    openApiJsonUrlOptions?: Array<{ label: string; value: string }>;
    routesOptions?: Array<{ label: string; value: string; methods: string[] }>;
    formData?: Partial<ReceiveData>;
  };
  source: "vscode";
}
declare interface Route {
  method: Methods;
  url: string;
}
declare interface ReceiveData {
  servicePath?: string;
  openApiJsonUrl: string;
  routes: Route[];
  type?: "submit" | "info";
  // source?: "webview";
}

/** webView 通信数据源 */
declare type ChannelData = SendData & Omit<ReceiveData, "source" | "type">;

type RouteEntry = Record<
  string,
  {
    [K in Methods]: {
      operationId: string;
    };
  }
>;
declare interface OpenApiJson {
  openapi?: string;
  swagger: string;
  basePath: string;
  paths: RouteEntry;
}

declare interface Config {
  debug: boolean;
}

declare interface PackageJson {
  version: string;
  name: string;
}
