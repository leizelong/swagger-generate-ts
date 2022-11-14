# Welcome to your Swagger Generate Ts
[![Current Version](https://vsmarketplacebadge.apphb.com/version/leizl.swagger-generate-ts.svg)](https://marketplace.visualstudio.com/items?itemName=leizl.swagger-generate-ts)
[![Install Count](https://vsmarketplacebadge.apphb.com/installs/leizl.swagger-generate-ts.svg)](https://marketplace.visualstudio.com/items?itemName=leizl.swagger-generate-ts)
[![Open Issues](https://vsmarketplacebadge.apphb.com/rating/leizl.swagger-generate-ts.svg)](https://marketplace.visualstudio.com/items?itemName=leizl.swagger-generate-ts)

## Description
* We can use this plugin to generate Ts declarations and Ts request files through Swagger Api Json

## How to use it？

### step1: Configure the openApiJson List

* `Cmd+,` 打开用户设置，搜索`swagger-generate-ts.openApiJsonUrlOptions`
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step1-setting.jpg?raw=true)
* 配置项格式 value 是一个标准的openApiJson的get资源,可参考 https://editor.swagger.io/。可在我们的SwaggerApiDocs平台上F12查看有没有类似的`api-docs`请求
``` json
[
    {
      "label": "admin",
      "value": "http://xxx/admin/v2/api-docs"
    },
    {
      "label": "gmp-product-library-portal",
      "value": "http://xxx/gmp-product-library-portal/v2/api-docs"
    },
  ]
```
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step1-options.jpg?raw=true)

![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step1-openApiUrl?raw=true)

* 配置项 `swagger-generate-ts.requestImportPath` 作用于 
``` js 
import { get, post } from '${requestImportPath}'
```

### step2: Open WebView
* `Cmp+shift+P`  and typing `SwaggerGenerateTs`.
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-webview.jpg?raw=true)
* 从SwaggerApiDocs拿到我们想要转换的接口路由
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-swagger-docs.jpg?raw=true)

* 填写表单
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-form.jpg?raw=true)

* 生成的文件
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-result.jpg?raw=true)

* 生成路径的规则：声明文件是放在根目录definitions/xx；api文件是放在src/services/xx

* 遇到`@definitions` `@/utils` 等无法找到文件路径tsLint报错问题，请配置tsconfig.json 和 webpack resolve.alias 配置项

``` json 
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@definitions/*": ["definitions/*"],
      "@/*": ["src/*"]
    }
  }
}
```