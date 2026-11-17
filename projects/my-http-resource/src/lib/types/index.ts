import { HttpClient } from '@angular/common/http';

export type TQueryParams = {
  [key: string]: string | number | boolean;
}

export type TUrlParams = {
  [key: string]: string | number;
}

export type TMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';
export type TMethodWithBody = 'post' | 'put' | 'patch';

/**
 * Options of the matching HttpClient method. For post/put/patch they are the
 * third parameter (the second one is the body), for get/delete the second.
 */
export type HttpOptions<M extends TMethod> = M extends TMethodWithBody
  ? Parameters<HttpClient[M]>[2]
  : Parameters<HttpClient[M]>[1];

/**
 * Keeps a property from being used to infer T, so that `initialValue: []`
 * does not turn T into never[]. Same job as the built-in NoInfer, which needs TS 5.4+.
 */
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
