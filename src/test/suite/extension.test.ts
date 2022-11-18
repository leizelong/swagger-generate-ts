import * as assert from "assert";
// import { generateTsFiles } from "src/utils/common";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { generateTsFiles} from "../../utils/common";

suite("Extension Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");
  const formData: ReceiveData = {
    routes: [
      {
        url: "/admin/corporation/corporationList",
        method: "post",
      },
    ],
    openApiJsonUrl: "http://un-api.test.bbmall.xyb2b.com.cn/admin/v2/api-docs",
  };

  test("generateTsFiles", () => {
    console.log('generateTsFiles', generateTsFiles)
    // myExtensions.generateTsFiles(formData);
  });
});
