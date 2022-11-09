// @ts-nocheck

import { post, get } from "@/utils/request";
import {
  增加属性绑定关系Request,
  ApiResultListQueryChannelCategoryResponse,
  ApiResultboolean,
} from "@definitions/media/refluxCategory";

export function queryChannelCategory(): Promise<ApiResultListQueryChannelCategoryResponse> {
  return get(`/admin/media/refluxCategory/queryChannelCategory`);
}

export async function addCategoryBinding(
  data: 增加属性绑定关系Request,
): Promise<ApiResultboolean> {
  return post(`/admin/media/refluxCategory/addCategoryBinding`, data);
}
