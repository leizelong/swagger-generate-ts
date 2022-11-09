///<reference types="@babel/types" />

declare module "*.html";

type Methods = "get" | "post" | "delete" | "put";
/** webView 通信数据源 */
declare interface ChannelData {
  // methods: string[];
  // template: string;
  /** 默认路径  */
  servicePath?: string;
  routes: Array<{ method: Methods; url: string }>;

  errorMessage?: string;
  success?: boolean;
}
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
