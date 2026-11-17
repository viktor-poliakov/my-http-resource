import { Signal, WritableSignal } from '@angular/core';
import { Observable, UnaryFunction } from 'rxjs';
import { HttpOptions, TMethod, TNoInfer, TQueryParams, TUrlParams } from '../types';
import { HttpErrorResponse } from '@angular/common/http';

export interface IHttpResource<Method, T = any, V = T> {
  loading: Signal<boolean>,
  value: WritableSignal<V>,
  error: WritableSignal<unknown>,
  fetch: (fetchData?: Method) => void,
  request$: (fetchData?: Method) => Observable<T>,
}

export interface IBaseRequestData<T, M extends TMethod> {
  url: string;
  afterSuccess?: (data: T) => void;
  afterError?: (error: HttpErrorResponse) => void;
  headers?: Record<string, string | number>
  initialValue?: TNoInfer<T>;
  manual?: boolean;
  mergeValues?: boolean;
  cancelPrevious?: boolean;
  pipe?: UnaryFunction<Observable<any>, Observable<T>>;
  urlParams?: TUrlParams;
  options?: HttpOptions<M>;
}

export interface IGetRequest<T> extends IBaseRequestData<T, 'get'> {
  queryParams?: TQueryParams;
}

export interface IPostRequest<T> extends IBaseRequestData<T, 'post'> {
  body?: object;
}

export interface IPatchRequest<T> extends IBaseRequestData<T, 'patch'> {
  body?: object;
}

export interface IPutRequest<T> extends IBaseRequestData<T, 'put'> {
  body?: object;
}

export interface IDeleteRequest<T> extends IBaseRequestData<T, 'delete'> {
  body?: object;
  queryParams?: TQueryParams;
}

export type IRequest<T> =
  | IGetRequest<T>
  | IPostRequest<T>
  | IPatchRequest<T>
  | IPutRequest<T>
  | IDeleteRequest<T>
