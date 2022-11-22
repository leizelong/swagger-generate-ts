# Welcome to your Swagger Generate Ts

## Description
* We can use this plugin to generate Ts declarations and Ts request files through Swagger Api Json

## 所有的Commands
* `SwaggerGenerateTs:生成Ts声明和Service请求` 打开WebView 自定义添加需要的路由
* `SwaggerGenerateTs:初始化Definitions` 生成一份完整的definitions.d.ts文件
* `SwaggerGenerateTs:初始化整个项目，生成Definitions+Services` 根据openJson初始化整个项目用到的路由接口类型和请求文件

## How to use it？

### step1: Configure the openApiJson List

* `Cmd+,` 打开用户设置，搜索`swagger-generate-ts.openApiJsonUrlOptions`
![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step1-setting.jpg?raw=true)
* 配置项格式 value 是一个标准的openApiJson的get资源,可参考 https://editor.swagger.io 可在我们的SwaggerApiDocs平台上F12查看有没有类似的`api-docs`请求
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

![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step1-openApiUrl.jpeg?raw=true)

* 配置项 `swagger-generate-ts.requestImportPath` 作用于 
``` js 
import { get, post } from '${requestImportPath}'
```

### step2: Open WebView
* `Cmp+shift+P`  and typing `SwaggerGenerateTs`.

![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-webview.jpeg?raw=true)

* 从SwaggerApiDocs拿到我们想要转换的接口路由

![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-swagger-docs.jpeg?raw=true)

* 填写表单

![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-form.jpeg?raw=true)

* 生成的文件

![](https://github.com/leizelong/swagger-generate-ts/blob/main/media/step2-result.jpeg?raw=true)

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
