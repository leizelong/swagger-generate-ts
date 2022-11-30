import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Form,
  Select,
  Button,
  Row,
  Col,
  Space,
  message,
  AutoComplete,
} from "antd";
import type { SelectProps } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import "antd/dist/reset.css";
import { debounce } from "lodash";

import "./App.css";

interface ChannelData {
  routes?: {
    method: string;
    url: string;
    methodsOptions?: SelectProps["options"];
  }[];
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
    routesOptions?: SelectProps["options"] & { methods: string[] };
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
  return Object.assign({}, data, {
    source: "webview",
    type: options.type || "info",
  });
}

function App() {
  const [form] = Form.useForm<Partial<ChannelData>>();

  const [openApiJsonUrlOptions, setOpenApiJsonUrlOptions] = useState<
    SelectProps["options"]
  >([]);
  const [curOpenUrl, setCurOpenUrl] = useState("");

  const [routesOptions, setRoutesOptions] = useState<SelectProps["options"]>(
    [],
  );
  const routeMethodsMap = useRef<Map<string | number, string[]>>(new Map());

  async function onSubmit() {
    await form.validateFields();
    console.log("form", form.getFieldsValue());
    const data = form.getFieldsValue();
    data.routes = data.routes?.map(({ method, url }) => ({ method, url }));
    vscode.postMessage(encodeMessageData(data, { type: "submit" }));
  }

  function handleOpenJsonUrlSelect(url: string) {
    if (url === curOpenUrl) return;
    setCurOpenUrl(url);
    setRoutesOptions([]);
    routeMethodsMap.current.clear();
    vscode.postMessage(
      encodeMessageData({ openApiJsonUrl: url }, { type: "info" }),
    );
  }

  const handleUrlChange = useCallback(
    (fieldKey: any) => {
      return debounce(value => {
        if (!value) {
          return;
        }
        const curRouteMethods = routeMethodsMap.current.get(value);
        const nextRoutes = [...form.getFieldValue("routes")];

        if (!curRouteMethods?.length) {
          // 没有匹配上
          nextRoutes[fieldKey].methodsOptions = methodsOptions;
          form.setFieldValue("routes", nextRoutes);
          return;
        }

        if (curRouteMethods.length === 1) {
          nextRoutes[fieldKey].method = curRouteMethods[0];
        }
        const options = methodsOptions.map(option => {
          const exist = curRouteMethods.includes(option.value);
          return { ...option, disabled: !exist };
        });

        nextRoutes[fieldKey].methodsOptions = options;

        form.setFieldValue("routes", nextRoutes);
      }, 300);
    },
    [form],
  );

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
          setRoutesOptions(routesOptions);
          for (const { value, methods } of routesOptions) {
            routeMethodsMap.current.set(value, methods);
          }
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

  const routes = Form.useWatch("routes", form);

  return (
    <div className="App">
      <Row justify="center">
        <Col span={16}>
          <h2 className="title">Swagger Api Generate Service File</h2>
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
              <Select
                showSearch
                allowClear
                options={openApiJsonUrlOptions}
                onSelect={handleOpenJsonUrlSelect}
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
                          {...field}
                          name={[field.name, "method"]}
                          rules={[{ required: true }]}
                          initialValue="post"
                        >
                          <Select
                            style={{ width: 100 }}
                            options={
                              (routes?.[field.key].url &&
                                routes?.[field.key]?.methodsOptions) ||
                              methodsOptions
                            }
                          ></Select>
                        </Form.Item>
                        <Form.Item
                          {...field}
                          style={{ flex: 1 }}
                          className="route-item"
                          name={[field.name, "url"]}
                          rules={[{ required: true }]}
                        >
                          <AutoComplete
                            placeholder="接口请求路径: /admin/media/xx"
                            options={routesOptions}
                            allowClear
                            filterOption
                            optionFilterProp="value"
                            onChange={handleUrlChange(field.key)}
                          ></AutoComplete>
                        </Form.Item>
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
