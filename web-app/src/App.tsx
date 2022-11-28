import React, { useEffect, useState } from "react";
import { Form, Select, Input, Button, Row, Col, Space, message } from "antd";
import type { SelectProps } from "antd";

import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import "./App.css";
import "antd/dist/antd.css";

interface ChannelData {
  routes?: { method: string; url: string }[];
  openApiJsonUrl: string;
  source: "webview";
  type: "submit" | "info";
}
interface VsCodeMessage {
  errorMessage?: string;
  success?: boolean;
  source: string;
  type: "init-config";
  config: {
    openApiJsonUrlOptions: SelectProps["options"];
    routesOptions?: SelectProps["options"];
    formData?: ChannelData;
  };
}
const methods = ["get", "post", "put", "delete", "options", "head", "patch"];
const methodsOptions = methods.map(method => ({
  label: method.toUpperCase(),
  value: method,
}));

let vscode: any;
try {
  // @ts-ignore
  vscode = acquireVsCodeApi && acquireVsCodeApi();
} catch (error) {
  console.log("acquireVsCodeApiError");
}

function encodeMessageData(
  data: any,
  options?: { type: ChannelData["type"] },
): ChannelData {
  return Object.assign(data || {}, {
    source: "webview",
    type: options.type || "info",
  });
}

function App() {
  const [form] = Form.useForm<Partial<ChannelData>>();
  const [openApiJsonUrlOptions, setOpenApiJsonUrlOptions] = useState<
    SelectProps["options"]
  >([]);

  // const [routesOptions, setRoutesOptions] = useState<SelectProps["options"]>(
  //   [],
  // );

  async function onSubmit() {
    await form.validateFields();
    console.log("form", form.getFieldsValue());
    const data = form.getFieldsValue();
    data.routes = data.routes?.map(({ method, url }) => ({ method, url }));
    vscode.postMessage(encodeMessageData(data, { type: "submit" }));
  }

  useEffect(() => {
    function onMessage(event: { data: VsCodeMessage }) {
      const data = event.data; // The JSON data our extension sent
      if (data.source !== "vscode") return;
      if (data.type === "init-config") {
        const { openApiJsonUrlOptions, routesOptions, formData } = data.config;
        if (openApiJsonUrlOptions) {
          setOpenApiJsonUrlOptions(openApiJsonUrlOptions);
        }
        if (routesOptions) {
          // setRoutesOptions(routesOptions);
        }
        if (formData) {
          form.setFieldsValue(formData);
        }
        console.log("init-config", data);
        return;
      }
      if (data.success) {
        message.success("成功");
      } else {
        message.error("失败原因：" + data.errorMessage);
      }
      console.log("vscode => message", data);
    }
    window.addEventListener("message", onMessage);
    return () => {
      window.removeEventListener("message", onMessage);
    };
  }, [form]);

  // function handleOpenJsonUrlSelect(url: string) {
  //   vscode.postMessage(
  //     encodeMessageData({ openApiJsonUrl: url }, { type: "info" }),
  //   );
  // }

  return (
    <div className="App">
      <Row justify="center">
        <Col span={16}>
          <h2>Swagger Api Generate Service File</h2>
          <Form
            form={form}
            title="生成路由"
            labelCol={{ span: 8 }}
            wrapperCol={{ span: 16 }}
            initialValues={{ routes: [{}] }}
          >
            <Form.Item
              name="openApiJsonUrl"
              label="openApiJsonUrl"
              rules={[{ required: true, message: "openApiJsonUrl必填" }]}
            >
              {/* <Input></Input> */}
              <Select
                showSearch
                allowClear
                options={openApiJsonUrlOptions}
                // onSelect={handleOpenJsonUrlSelect}
              ></Select>
            </Form.Item>

            <Form.Item label="填写路由方法和路径">
              <Form.List name="routes">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(field => (
                      <Space.Compact
                        style={{ display: "flex" }}
                        key={field.key}
                      >
                        <Form.Item
                          // noStyle
                          {...field}
                          name={[field.name, "method"]}
                          rules={[{ required: true }]}
                          initialValue="post"
                        >
                          <Select
                            style={{ width: 100 }}
                            options={methodsOptions}
                          ></Select>
                        </Form.Item>
                        <Form.Item
                          {...field}
                          // noStyle
                          name={[field.name, "url"]}
                          // label="url"
                          rules={[{ required: true }]}
                        >
                          {/* <Select
                            showSearch
                            allowClear
                            options={routesOptions}
                            placeholder="接口请求路径: /admin/media/refluxCategory/addPropertyBinding"
                          ></Select> */}
                          <Input
                            style={{ width: 400 }}
                            placeholder="接口请求路径: /admin/media/refluxCategory/addPropertyBinding"
                          />
                        </Form.Item>
                        {/* </div> */}

                        {/* <MinusCircleOutlined
                          onClick={() => remove(field.name)}
                        /> */}
                        <Button
                          type="text"
                          danger
                          onClick={() => remove(field.name)}
                          icon={<DeleteOutlined />}
                        ></Button>
                      </Space.Compact>
                    ))}
                    <Form.Item>
                      <Button
                        type="dashed"
                        onClick={add}
                        block
                        icon={<PlusOutlined />}
                      >
                        添加路由
                      </Button>
                    </Form.Item>
                  </>
                )}
              </Form.List>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" onClick={onSubmit}>
                提交
              </Button>
            </Form.Item>
          </Form>
        </Col>
      </Row>
    </div>
  );
}

export default App;
