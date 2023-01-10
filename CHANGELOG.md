# 更新历史 


### [0.0.10](https://github.com/leizelong/swagger-generate-ts/compare/v0.0.9...v0.0.10) (2023-01-10)


### ✨ Features | 新功能

* 增加配置项returnData：是否返回Promise<ResDto[data]> ([299ba45](https://github.com/leizelong/swagger-generate-ts/commit/299ba45f9d10df0d72654b69a2d6cc120c6370d0))

### [0.0.9](https://github.com/leizelong/swagger-generate-ts/compare/v0.0.8...v0.0.9) (2023-01-06)


### ✨ Features | 新功能

* 增加配置项,弥补寻找postBody路径问题,postBodyDtoRegexp ([61d1e88](https://github.com/leizelong/swagger-generate-ts/commit/61d1e88149f2d3341b478709d938144628081eb5))


### 🐛 Bug Fixes | Bug 修复

* 修复只有一种请求方式,请求方法名称不带上method ([eb72bee](https://github.com/leizelong/swagger-generate-ts/commit/eb72beeb34b66bd55eaa990d63b54aff2750c741))


### 📝 Documentation | 文档

* add .npmrc ([ca81501](https://github.com/leizelong/swagger-generate-ts/commit/ca81501e7c20cd27c46f2c75bab36a3afc17da06))


### 📦 Chores | 其他更新

* 修改postBodyDtoRegexp默认值 ([0f6acd5](https://github.com/leizelong/swagger-generate-ts/commit/0f6acd579a5c06fc93813fe0798aadd2e471be69))

### [0.0.8](https://github.com/leizelong/swagger-generate-ts/compare/v0.0.7...v0.0.8) (2022-12-05)


### ✨ Features | 新功能

* 1. 优化restful api函数命名; 2. 支持部分OpenApiV3 ([3fd5762](https://github.com/leizelong/swagger-generate-ts/commit/3fd5762876ba0c2d4dc7696d7a5df068b06a770d))

### [0.0.7](https://github.com/leizelong/swagger-generate-ts/compare/v0.0.6...v0.0.7) (2022-11-30)


### 📦 Chores | 其他更新

* 修改yarn.lock ([832cff3](https://github.com/leizelong/swagger-generate-ts/commit/832cff30a4b38af5ee8623367e5d4f66158d2e29))
* sentry字段优化 ([5ed9b57](https://github.com/leizelong/swagger-generate-ts/commit/5ed9b574d2c61e23b106e48703583729bc7905c7))
* upgrade antd@5.x ([9e85252](https://github.com/leizelong/swagger-generate-ts/commit/9e85252103414296d1e63b0f16ba3006b2a227d4))


### ✨ Features | 新功能

* 提供路由url自动提示 ([3d5c797](https://github.com/leizelong/swagger-generate-ts/commit/3d5c7978ceca9149560d0ad9e942ddf54df37d2c))
* 优化url query /a/b/{id}类型 ([ccda80c](https://github.com/leizelong/swagger-generate-ts/commit/ccda80c584f00d3d89e7b5e9b2577beb8b39135a))
* 增加选择路由url自动提示功能 ([be0c30a](https://github.com/leizelong/swagger-generate-ts/commit/be0c30a06a33946e39ebe0993ef317fd79896775))

### [0.0.6](https://github.com/leizelong/swagger-generate-ts/compare/v0.0.5...v0.0.6) (2022-11-25)


### 🐛 Bug Fixes | Bug 修复

* 修复DefinitionKey 存在空白字符的问题 ([b580888](https://github.com/leizelong/swagger-generate-ts/commit/b580888401dea508a8b651abdbc0f84d8f662e00))
* 修复openApi url返回为字符串的情况; 修复openApiJson basePath: / 的异常情况 ([bd5c348](https://github.com/leizelong/swagger-generate-ts/commit/bd5c348b8296aa401b6413ac438bce7ac9fca670))


### 📦 Chores | 其他更新

* 调整开发环境上报sentry日志 ([c9c03ff](https://github.com/leizelong/swagger-generate-ts/commit/c9c03ffac1d210aad30cff5f75ea5a391e1ce25e))
* 添加环境变量 ([fb26ac6](https://github.com/leizelong/swagger-generate-ts/commit/fb26ac6eb3932345aa55b439a914cdd79321dfb4))

### 0.0.5 (2022-11-22)


### ✨ Features | 新功能

* 0.0.4 ([8502a4b](https://github.com/leizelong/swagger-generate-ts/commit/8502a4b1f99326ca0a536e308cf7ead359d3f65c))
* 尝试增加test脚本 ([8f64eb5](https://github.com/leizelong/swagger-generate-ts/commit/8f64eb59965c4dfe946604bbc1cb8e625e6ce40c))
* 大功告成,数据通信ok ([d744250](https://github.com/leizelong/swagger-generate-ts/commit/d744250a601e8ebfbbcc31dca3b0ee0ae41e7c79))
* 根据Url生成definitions文件 ([9e58206](https://github.com/leizelong/swagger-generate-ts/commit/9e58206e0804005cdf6b3e4129c72ed53f06cffa))
* 加载本地html ([691e751](https://github.com/leizelong/swagger-generate-ts/commit/691e75110ccb74f71404fe19239d4088d5dcfb7b))
* 接入webView ([49270f5](https://github.com/leizelong/swagger-generate-ts/commit/49270f5f93a2b15e9c9b04330a44b99c8c8d0e82))
* 配置task ([b9410fd](https://github.com/leizelong/swagger-generate-ts/commit/b9410fd718d2c535aaf70af1f320c2904468b1b8))
* 增加icon ([2197de0](https://github.com/leizelong/swagger-generate-ts/commit/2197de0d25fa05b857fe1858084a89797448f0b8))
* 增加initDefinitions 命令 ([f5500b6](https://github.com/leizelong/swagger-generate-ts/commit/f5500b6d4ec8119ccdd62254a2451f70705d6d3e))
* 增加js关键字保护 ([60b890f](https://github.com/leizelong/swagger-generate-ts/commit/60b890f3bbe6b48ac09f0d47a7742967579f07de))
* 增加sentry埋点 ([fb84a1a](https://github.com/leizelong/swagger-generate-ts/commit/fb84a1ac1b94db70e78093e50e95add08dc0f3ec))
* add test ([14ae89b](https://github.com/leizelong/swagger-generate-ts/commit/14ae89b6d35508e81207f0f3c598b8fdbb4f08e4))
* add web-app ([5598d4d](https://github.com/leizelong/swagger-generate-ts/commit/5598d4df01ab94c6e8cbb3a8da16c659d66c64fc))
* debug webview  mode ([c451bee](https://github.com/leizelong/swagger-generate-ts/commit/c451beee4f9aa37083d2589fe99e273c30ceb49c))
* genDefinition => genServices ([1a0739b](https://github.com/leizelong/swagger-generate-ts/commit/1a0739b3f61287c84a5b943aa1f7ea022a53698f))
* genDefinition 和 genService 跑通 ([b9d8780](https://github.com/leizelong/swagger-generate-ts/commit/b9d878045733c54102f1f4c323df5d5dea7af5ec))
* init ([5eef59d](https://github.com/leizelong/swagger-generate-ts/commit/5eef59db2c54014862890e6625b1156967138ca9))
* init Project ([315965d](https://github.com/leizelong/swagger-generate-ts/commit/315965de69dbcf64d49f0ead3e29ad106859676f))
* local antd css ([714f9f4](https://github.com/leizelong/swagger-generate-ts/commit/714f9f44caa7a7495dfe4153ecfa3186948cfced))
* openApiJson可配置 ([1ce7636](https://github.com/leizelong/swagger-generate-ts/commit/1ce7636674c85f368555d46d780b754fb46df29c))
* publisher ([c034bee](https://github.com/leizelong/swagger-generate-ts/commit/c034bee861bd5b038e6c0259332f415590f9c778))
* watch:web-view ([b4cb3a6](https://github.com/leizelong/swagger-generate-ts/commit/b4cb3a65664cb054b5b3f7dc6657a5ef76c7e84d))
* web-app 按需加载 ([f0d8168](https://github.com/leizelong/swagger-generate-ts/commit/f0d8168d87846a344957bda5fabca0eccc135a6b))
* webView init ([a5f5cac](https://github.com/leizelong/swagger-generate-ts/commit/a5f5caca6b7f3b48c2bf859fbe79559fd3691086))


### 🔧 Continuous Integration | CI 配置

* standard version ([376b255](https://github.com/leizelong/swagger-generate-ts/commit/376b25596ac18f93b63b95002a52f482c310609e))


### 🐛 Bug Fixes | Bug 修复

* 修复没有definition类型时,异常导出情况 ([6049088](https://github.com/leizelong/swagger-generate-ts/commit/6049088ef3b069ccf6910aff4cb1867b1d7d9d88))
* 修复重复添加问题 ([f683831](https://github.com/leizelong/swagger-generate-ts/commit/f683831c014388bedef36d744e8c7333c43e8a78))
* 优化找不到method ([b7e053b](https://github.com/leizelong/swagger-generate-ts/commit/b7e053b924536597919335c290877b71c3d0348b))
* parameters.body.xxrequest 问题 ([c9f511d](https://github.com/leizelong/swagger-generate-ts/commit/c9f511d592d98588e4e7d4da3e9174accdf9f712))
* request import location ([a7f9ec5](https://github.com/leizelong/swagger-generate-ts/commit/a7f9ec54000f9177dba7ba464825acd130dff342))
* windows definitions path ([796cc55](https://github.com/leizelong/swagger-generate-ts/commit/796cc555845cbe931949ab0c98d27444992d1a88))
* windows definitions path\\ ([7371af3](https://github.com/leizelong/swagger-generate-ts/commit/7371af3cbee0333cb535d7dde4355f0cadcd8dd3))
* windows project root path f:// ([8c13364](https://github.com/leizelong/swagger-generate-ts/commit/8c13364d7fb4a9f74432f0bfa7a5e0e091de0972))
* windows project root path vscode.workspace.workspaceFolders[0].uri.fsPath ([a1c8414](https://github.com/leizelong/swagger-generate-ts/commit/a1c841445c5a2fa821e84853e776565a535b61a5))


### 📝 Documentation | 文档

* 增加两个command ([9096054](https://github.com/leizelong/swagger-generate-ts/commit/90960541f4ce1521a28608d4e5d7c50b1465cb83))
* husky ([0d18367](https://github.com/leizelong/swagger-generate-ts/commit/0d18367cc96f9219cca1cd237f5b5bdb78555b87))
* ignore lock ([6c42b27](https://github.com/leizelong/swagger-generate-ts/commit/6c42b27f336da3f55ec102c708508212ee55510f))
* jpeg ([07ecce0](https://github.com/leizelong/swagger-generate-ts/commit/07ecce072b9eef53ec528253e07d71491fbac161))
* jpeg ([589ed3d](https://github.com/leizelong/swagger-generate-ts/commit/589ed3d13dc262c20b7ffa9216548976f5a889a2))
* readme ([b2aa567](https://github.com/leizelong/swagger-generate-ts/commit/b2aa5679f62632f4078d211a1a4d46f586c7e0ef))
* readme ([6120dab](https://github.com/leizelong/swagger-generate-ts/commit/6120dab38a3fb8036b7d45c1c0c0ac6e52d02422))

## 0.0.4 (2022-11-22)


### Bug Fixes

* 修复重复添加问题 ([f683831](https://github.com/leizelong/swagger-generate-ts/commit/f683831c014388bedef36d744e8c7333c43e8a78))
* 优化找不到method ([b7e053b](https://github.com/leizelong/swagger-generate-ts/commit/b7e053b924536597919335c290877b71c3d0348b))
* parameters.body.xxrequest 问题 ([c9f511d](https://github.com/leizelong/swagger-generate-ts/commit/c9f511d592d98588e4e7d4da3e9174accdf9f712))
* request import location ([a7f9ec5](https://github.com/leizelong/swagger-generate-ts/commit/a7f9ec54000f9177dba7ba464825acd130dff342))
* windows definitions path ([796cc55](https://github.com/leizelong/swagger-generate-ts/commit/796cc555845cbe931949ab0c98d27444992d1a88))
* windows definitions path\\ ([7371af3](https://github.com/leizelong/swagger-generate-ts/commit/7371af3cbee0333cb535d7dde4355f0cadcd8dd3))
* windows project root path f:// ([8c13364](https://github.com/leizelong/swagger-generate-ts/commit/8c13364d7fb4a9f74432f0bfa7a5e0e091de0972))
* windows project root path vscode.workspace.workspaceFolders[0].uri.fsPath ([a1c8414](https://github.com/leizelong/swagger-generate-ts/commit/a1c841445c5a2fa821e84853e776565a535b61a5))


### Features

* 0.0.4 ([8502a4b](https://github.com/leizelong/swagger-generate-ts/commit/8502a4b1f99326ca0a536e308cf7ead359d3f65c))
* 尝试增加test脚本 ([8f64eb5](https://github.com/leizelong/swagger-generate-ts/commit/8f64eb59965c4dfe946604bbc1cb8e625e6ce40c))
* 大功告成,数据通信ok ([d744250](https://github.com/leizelong/swagger-generate-ts/commit/d744250a601e8ebfbbcc31dca3b0ee0ae41e7c79))
* 根据Url生成definitions文件 ([9e58206](https://github.com/leizelong/swagger-generate-ts/commit/9e58206e0804005cdf6b3e4129c72ed53f06cffa))
* 加载本地html ([691e751](https://github.com/leizelong/swagger-generate-ts/commit/691e75110ccb74f71404fe19239d4088d5dcfb7b))
* 接入webView ([49270f5](https://github.com/leizelong/swagger-generate-ts/commit/49270f5f93a2b15e9c9b04330a44b99c8c8d0e82))
* 配置task ([b9410fd](https://github.com/leizelong/swagger-generate-ts/commit/b9410fd718d2c535aaf70af1f320c2904468b1b8))
* 增加icon ([2197de0](https://github.com/leizelong/swagger-generate-ts/commit/2197de0d25fa05b857fe1858084a89797448f0b8))
* 增加initDefinitions 命令 ([f5500b6](https://github.com/leizelong/swagger-generate-ts/commit/f5500b6d4ec8119ccdd62254a2451f70705d6d3e))
* 增加js关键字保护 ([60b890f](https://github.com/leizelong/swagger-generate-ts/commit/60b890f3bbe6b48ac09f0d47a7742967579f07de))
* 增加sentry埋点 ([fb84a1a](https://github.com/leizelong/swagger-generate-ts/commit/fb84a1ac1b94db70e78093e50e95add08dc0f3ec))
* add test ([14ae89b](https://github.com/leizelong/swagger-generate-ts/commit/14ae89b6d35508e81207f0f3c598b8fdbb4f08e4))
* add web-app ([5598d4d](https://github.com/leizelong/swagger-generate-ts/commit/5598d4df01ab94c6e8cbb3a8da16c659d66c64fc))
* debug webview  mode ([c451bee](https://github.com/leizelong/swagger-generate-ts/commit/c451beee4f9aa37083d2589fe99e273c30ceb49c))
* genDefinition => genServices ([1a0739b](https://github.com/leizelong/swagger-generate-ts/commit/1a0739b3f61287c84a5b943aa1f7ea022a53698f))
* genDefinition 和 genService 跑通 ([b9d8780](https://github.com/leizelong/swagger-generate-ts/commit/b9d878045733c54102f1f4c323df5d5dea7af5ec))
* init ([5eef59d](https://github.com/leizelong/swagger-generate-ts/commit/5eef59db2c54014862890e6625b1156967138ca9))
* init Project ([315965d](https://github.com/leizelong/swagger-generate-ts/commit/315965de69dbcf64d49f0ead3e29ad106859676f))
* local antd css ([714f9f4](https://github.com/leizelong/swagger-generate-ts/commit/714f9f44caa7a7495dfe4153ecfa3186948cfced))
* openApiJson可配置 ([1ce7636](https://github.com/leizelong/swagger-generate-ts/commit/1ce7636674c85f368555d46d780b754fb46df29c))
* publisher ([c034bee](https://github.com/leizelong/swagger-generate-ts/commit/c034bee861bd5b038e6c0259332f415590f9c778))
* watch:web-view ([b4cb3a6](https://github.com/leizelong/swagger-generate-ts/commit/b4cb3a65664cb054b5b3f7dc6657a5ef76c7e84d))
* web-app 按需加载 ([f0d8168](https://github.com/leizelong/swagger-generate-ts/commit/f0d8168d87846a344957bda5fabca0eccc135a6b))
* webView init ([a5f5cac](https://github.com/leizelong/swagger-generate-ts/commit/a5f5caca6b7f3b48c2bf859fbe79559fd3691086))
