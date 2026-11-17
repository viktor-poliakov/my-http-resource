import { HttpClient } from '@angular/common/http';

export type TQueryParams = {
  [key: string]: string | number | boolean;
}

export type TUrlParams = {
  [key: string]: string | number;
}

export type TMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type TMethodWithBody = 'post' | 'put' | 'patch';

export type HttpOptions<M extends TMethod> = M extends TMethodWithBody
  ? Parameters<HttpClient[M]>[2]
  : Parameters<HttpClient[M]>[1];

export type TNoInfer<T> = [T][T extends any ? 0 : never];

export type TFetchData<M extends TMethod> = {
  urlParams?: TUrlParams,
  mergeValues?: boolean;
  options?: HttpOptions<M>;
}

export type Get = {
  queryParams?: TQueryParams,
} & TFetchData<'get'>;

export type Delete = {
  queryParams?: TQueryParams,
  body?: object;
} & TFetchData<'delete'>;

export type Post = {
  body?: object;
} & TFetchData<'post'>;

export type Patch = {
  body?: object;
} & TFetchData<'patch'>;

export type Put = {
  body?: object;
} & TFetchData<'put'>;

export type TypeMethod = Get | Patch | Put | Post | Delete;
