import { DestroyRef, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Observable, Subscription } from 'rxjs';

import {
  IBaseRequestData,
  IDeleteRequest,
  IGetRequest,
  IHttpResource,
  IPatchRequest,
  IPostRequest,
  IPutRequest,
} from '../interfaces';
import { ReactiveHttpModel } from '../model/reactive.http.model';
import {
  Delete,
  Get,
  Patch,
  Post,
  Put,
  TFetchData,
  TMethod,
  TNoInfer,
  TQueryParams,
  TUrlParams,
  TypeMethod
} from '../types';

type TRequestConfig<T> = IBaseRequestData<T, TMethod> & { body?: object; queryParams?: TQueryParams };
type TFetchConfig = TFetchData<TMethod> & { body?: object; queryParams?: TQueryParams };

type TWithInitialValue<T> = { initialValue: TNoInfer<T> };
type THeadersSource = HttpHeaders | Record<string, string | number | (string | number)[]> | undefined;

export class MyHttpService {
  private http: HttpClient = inject(HttpClient);
  private destroyRef: DestroyRef = inject(DestroyRef);

  private mergeResult<T>(result: T, currentValue: T | null): T {
    if (!result || !currentValue || typeof result !== typeof currentValue ) {
      return result;
    }

    if (Array.isArray(result) && Array.isArray(currentValue)) {
      return [...currentValue, ...result] as T;
    }

    if (
      typeof result === 'object' &&
      typeof currentValue === 'object' &&
      !Array.isArray(result) &&
      !Array.isArray(currentValue)
    ) {
      return {...currentValue, ...result};
    }

    return result;
  }

  private createUrl(url: string, urlParams?: TUrlParams): string {
    return url.replace(/{{(.*?)}}/g, (_: string, key: string) => {
      const trimmedKey: string = key.trim();
      const value: string | number | undefined = urlParams?.[trimmedKey];

      if (value === undefined) {
        throw new Error(`Missing value for URL parameter: ${trimmedKey}`);
      }

      return encodeURIComponent(value);
    });
  }

  private mergeHeaders(...sources: THeadersSource[]): HttpHeaders {
    let merged: HttpHeaders = new HttpHeaders();

    for (const source of sources) {
      if (!source) continue;

      const headers: HttpHeaders = source instanceof HttpHeaders ? source : new HttpHeaders(source);

      for (const name of headers.keys()) {
        merged = merged.set(name, headers.getAll(name) ?? []);
      }
    }

    return merged;
  }

  private createRequest<T>(method: TMethod, data: TRequestConfig<T>, fetchData?: TFetchConfig): Observable<T> {
    const config: TRequestConfig<T> = { ...data, ...fetchData };
    const url: string = this.createUrl(config.url, config.urlParams);

    const request$: Observable<T> = this.http
      .request<T>(method, url, {
        body: config.body,
        params: config.queryParams,
        ...data.options,
        ...fetchData?.options,
        headers: this.mergeHeaders(data.headers, data.options?.headers, fetchData?.options?.headers),
      })
      .pipe(takeUntilDestroyed(this.destroyRef));

    return config.pipe ? request$.pipe(config.pipe) : request$;
  }

  public get<T = any>(data: IGetRequest<T> & TWithInitialValue<T>): IHttpResource<Get, T>;
  public get<T = any>(data: IGetRequest<T>): IHttpResource<Get, T, T | null>;
  public get<T = any>(data: IGetRequest<T>): IHttpResource<Get, T, T | null> {
    return this.createResource<T, Get>('get', data);
  }

  public post<T = any>(data: IPostRequest<T> & TWithInitialValue<T>): IHttpResource<Post, T>;
  public post<T = any>(data: IPostRequest<T>): IHttpResource<Post, T, T | null>;
  public post<T = any>(data: IPostRequest<T>): IHttpResource<Post, T, T | null> {
    return this.createResource<T, Post>('post', data);
  }

  public patch<T = any>(data: IPatchRequest<T> & TWithInitialValue<T>): IHttpResource<Patch, T>;
  public patch<T = any>(data: IPatchRequest<T>): IHttpResource<Patch, T, T | null>;
  public patch<T = any>(data: IPatchRequest<T>): IHttpResource<Patch, T, T | null> {
    return this.createResource<T, Patch>('patch', data);
  }

  public put<T = any>(data: IPutRequest<T> & TWithInitialValue<T>): IHttpResource<Put, T>;
  public put<T = any>(data: IPutRequest<T>): IHttpResource<Put, T, T | null>;
  public put<T = any>(data: IPutRequest<T>): IHttpResource<Put, T, T | null> {
    return this.createResource<T, Put>('put', data);
  }

  public delete<T = any>(data: IDeleteRequest<T> & TWithInitialValue<T>): IHttpResource<Delete, T>;
  public delete<T = any>(data: IDeleteRequest<T>): IHttpResource<Delete, T, T | null>;
  public delete<T = any>(data: IDeleteRequest<T>): IHttpResource<Delete, T, T | null> {
    return this.createResource<T, Delete>('delete', data);
  }

  private createResource<T, Method extends TypeMethod>(
    method: TMethod,
    data: TRequestConfig<T>,
  ): IHttpResource<Method, T, T | null> {
    const reactiveData: ReactiveHttpModel<T> = new ReactiveHttpModel(data.initialValue as T | undefined);
    const cancelPrevious: boolean = data.cancelPrevious ?? method === 'get';

    let pendingRequests: number = 0;
    let lastRequest: Subscription | undefined;

    const fetch = (fetchData?: Method): void => {
      const request$: Observable<T> = this.createRequest(method, data, fetchData);
      const mergeValues: boolean | undefined = fetchData?.mergeValues ?? data.mergeValues;

      pendingRequests++;

      if (cancelPrevious) lastRequest?.unsubscribe();

      reactiveData.error.set(null);
      reactiveData.loading.set(true);

      lastRequest = request$
        .pipe(
          finalize(() => {
            if (--pendingRequests === 0) reactiveData.loading.set(false);
          })
        )
        .subscribe({
          next: (result: T): void => {
            const value: T = mergeValues
              ? this.mergeResult(result, reactiveData.value())
              : result

            reactiveData.value.set(value);

            if (data.afterSuccess) data.afterSuccess(value);
          },
          error: (error: HttpErrorResponse): void => {
            reactiveData.error.set(error);

            if (data.afterError) data.afterError(error);
          },
        });
    };

    if (!data.manual) fetch();

    return {
      value: reactiveData.value,
      error: reactiveData.error,
      loading: reactiveData.loading.asReadonly(),
      request$: (fetchData?: Method): Observable<T> => this.createRequest(method, data, fetchData),
      fetch,
    }
  }
}
