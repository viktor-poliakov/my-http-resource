import {
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
  runInInjectionContext
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse, HttpHeaders, HttpRequest, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { config as rxjsConfig, delay, map, Observable, pipe } from 'rxjs';

import { IHttpResource, IPatchRequest, IPostRequest, IPutRequest } from '../interfaces';
import { Delete, Get, Post } from '../types';
import { myHttpResource } from '../utils';
import { MyHttpService } from './my.http.service';

interface IItem {
  id: number;
  name: string;
}

const item: IItem = { id: 1, name: 'first' };

describe('myHttpResource', () => {
  let httpMock: HttpTestingController;

  function create<R>(factory: (api: MyHttpService) => R): R {
    return TestBed.runInInjectionContext(() => factory(myHttpResource()));
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('must be created in an injection context', () => {
    expect(() => myHttpResource()).toThrowError(/NG0203/);
  });

  describe('state', () => {
    it('sends the request right away and fills the signals', () => {
      const resource = create((api) => api.get<IItem[]>({ url: '/items', initialValue: [] }));

      expect(resource.loading()).toBeTrue();
      expect(resource.value()).toEqual([]);

      httpMock.expectOne('/items').flush([item]);

      expect(resource.value()).toEqual([item]);
      expect(resource.loading()).toBeFalse();
      expect(resource.error()).toBeNull();
    });

    it('waits for fetch() when manual is true', () => {
      const resource = create((api) => api.get<IItem>({ url: '/items/1', manual: true }));

      httpMock.expectNone('/items/1');
      expect(resource.loading()).toBeFalse();

      resource.fetch();

      expect(resource.loading()).toBeTrue();
      httpMock.expectOne('/items/1').flush(item);
      expect(resource.value()).toEqual(item);
    });

    it('holds null until the first response when there is no initialValue', () => {
      const resource = create((api) => api.get<IItem>({ url: '/items/1', manual: true }));

      expect(resource.value()).toBeNull();
    });

    it('keeps falsy initial values', () => {
      const zero = create((api) => api.get<number>({ url: '/x', manual: true, initialValue: 0 }));
      const empty = create((api) => api.get<string>({ url: '/x', manual: true, initialValue: '' }));
      const no = create((api) => api.get<boolean>({ url: '/x', manual: true, initialValue: false }));

      expect(zero.value()).toBe(0);
      expect(empty.value()).toBe('');
      expect(no.value()).toBeFalse();
    });

    it('passes the value to afterSuccess', () => {
      const afterSuccess = jasmine.createSpy('afterSuccess');
      const resource = create((api) => api.get<IItem>({ url: '/items/1', manual: true, afterSuccess }));

      resource.fetch();
      httpMock.expectOne('/items/1').flush(item);

      expect(afterSuccess).toHaveBeenCalledOnceWith(item);
    });

    it('stores the error, calls afterError and clears the error on the next fetch', () => {
      const afterError = jasmine.createSpy('afterError');
      const resource = create((api) => api.get<IItem>({ url: '/items/1', manual: true, afterError }));

      resource.fetch();
      httpMock.expectOne('/items/1').flush('nope', { status: 500, statusText: 'Server Error' });

      const error = resource.error() as HttpErrorResponse;

      expect(error.status).toBe(500);
      expect(afterError).toHaveBeenCalledOnceWith(error);
      expect(resource.loading()).toBeFalse();
      expect(resource.value()).toBeNull();

      resource.fetch();

      expect(resource.error()).toBeNull();

      httpMock.expectOne('/items/1').flush(item);

      expect(resource.error()).toBeNull();
      expect(resource.value()).toEqual(item);
    });

    it('lets the signals be changed by hand', () => {
      const resource = create((api) => api.get<IItem[]>({ url: '/items', manual: true, initialValue: [] }));

      resource.value.update((items: IItem[]) => [...items, item]);
      resource.error.set('custom');

      expect(resource.value()).toEqual([item]);
      expect(resource.error()).toBe('custom');
    });

    it('does not leave loading stuck when afterSuccess throws', async () => {
      const boom = new Error('boom');
      const unhandled: unknown[] = [];

      rxjsConfig.onUnhandledError = (error: unknown) => unhandled.push(error);

      try {
        const resource = create((api) => api.get<IItem>({
          url: '/items/1',
          manual: true,
          afterSuccess: () => { throw boom; },
        }));

        resource.fetch();
        httpMock.expectOne('/items/1').flush(item);

        expect(resource.value()).toEqual(item);
        expect(resource.loading()).toBeFalse();

        await new Promise((resolve) => setTimeout(resolve));

        expect(unhandled).toEqual([boom]);
      } finally {
        rxjsConfig.onUnhandledError = null;
      }
    });

    it('throws on a missing url parameter without touching the state', () => {
      const resource = create((api) => api.get<IItem>({ url: '/items/{{id}}', manual: true }));

      expect(() => resource.fetch()).toThrowError('Missing value for URL parameter: id');
      expect(resource.loading()).toBeFalse();
      expect(resource.error()).toBeNull();
      httpMock.expectNone(() => true);
    });

    it('cancels the request and resets loading when its owner is destroyed', () => {
      const owner = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
      const resource = runInInjectionContext(owner, () => {
        return myHttpResource().get<IItem>({ url: '/items/1', manual: true });
      });

      resource.fetch();

      expect(resource.loading()).toBeTrue();

      owner.destroy();

      expect(httpMock.expectOne('/items/1').cancelled).toBeTrue();
      expect(resource.loading()).toBeFalse();
    });
  });

  describe('repeated fetch()', () => {
    it('GET: cancels the request that is still in flight', () => {
      const resource = create((api) => api.get<string>({ url: '/items/{{id}}', manual: true }));

      resource.fetch({ urlParams: { id: 1 } });
      resource.fetch({ urlParams: { id: 2 } });

      expect(httpMock.expectOne('/items/1').cancelled).toBeTrue();
      expect(resource.loading()).toBeTrue();

      httpMock.expectOne('/items/2').flush('second');

      expect(resource.value()).toBe('second');
      expect(resource.loading()).toBeFalse();
    });

    it('POST: runs requests side by side and keeps loading until all of them finish', () => {
      const afterSuccess = jasmine.createSpy('afterSuccess');
      const resource = create((api) => api.post<string>({ url: '/items', manual: true, afterSuccess }));

      resource.fetch({ body: { n: 1 } });
      resource.fetch({ body: { n: 2 } });

      const [first, second]: TestRequest[] = httpMock.match('/items');

      expect(first.cancelled).toBeFalse();
      expect(second.cancelled).toBeFalse();

      first.flush('a');

      expect(resource.loading()).toBeTrue();

      second.flush('b');

      expect(resource.loading()).toBeFalse();
      expect(afterSuccess.calls.allArgs()).toEqual([['a'], ['b']]);
    });

    it('PUT, PATCH and DELETE do not cancel either', () => {
      const put = create((api) => api.put({ url: '/put', manual: true }));
      const patch = create((api) => api.patch({ url: '/patch', manual: true }));
      const remove = create((api) => api.delete({ url: '/delete', manual: true }));

      for (const resource of [put, patch, remove]) {
        resource.fetch();
        resource.fetch();
      }

      for (const url of ['/put', '/patch', '/delete']) {
        const requests: TestRequest[] = httpMock.match(url);

        expect(requests.length).toBe(2);
        expect(requests.some((request: TestRequest) => request.cancelled)).toBeFalse();
      }
    });

    it('cancelPrevious: true makes POST cancel the previous request', () => {
      const resource = create((api) => api.post<string>({ url: '/search', manual: true, cancelPrevious: true }));

      resource.fetch({ body: { q: 'a' } });
      resource.fetch({ body: { q: 'ab' } });

      const [first, second]: TestRequest[] = httpMock.match('/search');

      expect(first.cancelled).toBeTrue();

      second.flush('result');

      expect(resource.value()).toBe('result');
      expect(resource.loading()).toBeFalse();
    });

    it('cancelPrevious: false lets GET requests run side by side', () => {
      const resource = create((api) => api.get<string>({ url: '/items', manual: true, cancelPrevious: false }));

      resource.fetch();
      resource.fetch();

      const [first, second]: TestRequest[] = httpMock.match('/items');

      expect(first.cancelled).toBeFalse();

      second.flush('second');

      expect(resource.loading()).toBeTrue();

      first.flush('first');

      expect(resource.value()).toBe('first');
      expect(resource.loading()).toBeFalse();
    });
  });

  describe('request', () => {
    it('uses the matching HTTP method', () => {
      create((api) => api.get({ url: '/get' }));
      create((api) => api.post({ url: '/post' }));
      create((api) => api.put({ url: '/put' }));
      create((api) => api.patch({ url: '/patch' }));
      create((api) => api.delete({ url: '/delete' }));

      expect(httpMock.expectOne('/get').request.method).toBe('GET');
      expect(httpMock.expectOne('/post').request.method).toBe('POST');
      expect(httpMock.expectOne('/put').request.method).toBe('PUT');
      expect(httpMock.expectOne('/patch').request.method).toBe('PATCH');
      expect(httpMock.expectOne('/delete').request.method).toBe('DELETE');
    });

    it('fills url placeholders, trims their names and encodes the values', () => {
      const resource = create((api) => api.get({
        url: '/users/{{ userId }}/posts/{{postId}}',
        manual: true,
        urlParams: { userId: 'a b', postId: 7 },
      }));

      resource.fetch();
      expect(httpMock.expectOne(() => true).request.url).toBe('/users/a%20b/posts/7');

      resource.fetch({ urlParams: { userId: 1, postId: 2 } });
      expect(httpMock.expectOne(() => true).request.url).toBe('/users/1/posts/2');
    });

    it('sends queryParams and lets fetch() replace them', () => {
      const resource = create((api) => api.get({
        url: '/items',
        manual: true,
        queryParams: { limit: 10, search: 'angular', active: true },
      }));

      resource.fetch();
      expect(httpMock.expectOne(() => true).request.urlWithParams).toBe('/items?limit=10&search=angular&active=true');

      resource.fetch({ queryParams: { limit: 5 } });
      expect(httpMock.expectOne(() => true).request.urlWithParams).toBe('/items?limit=5');
    });

    it('combines headers of all levels and merges options', () => {
      const resource = create((api) => api.get({
        url: '/items',
        manual: true,
        headers: { Authorization: 'token', 'X-Level': 'resource', 'X-Count': 7 },
        options: { withCredentials: true, headers: { 'X-Level': 'resource-options' } },
      }));

      resource.fetch();

      const first: HttpRequest<unknown> = httpMock.expectOne('/items').request;

      expect(first.headers.get('Authorization')).toBe('token');
      expect(first.headers.get('X-Level')).toBe('resource-options');
      expect(first.headers.get('X-Count')).toBe('7');
      expect(first.withCredentials).toBeTrue();

      resource.fetch({
        options: { headers: new HttpHeaders({ 'x-level': 'call', 'X-Trace-Id': 'abc-123' }) },
      });

      const second: HttpRequest<unknown> = httpMock.expectOne('/items').request;

      expect(second.headers.get('Authorization')).toBe('token');
      expect(second.headers.get('X-Level')).toBe('call');
      expect(second.headers.get('X-Trace-Id')).toBe('abc-123');
      expect(second.headers.keys().length).toBe(4);
      expect(second.withCredentials).toBeTrue();
    });

    it('sends no body when none is given', () => {
      const resource = create((api) => api.post({ url: '/items', manual: true }));

      resource.fetch();

      expect(httpMock.expectOne('/items').request.body).toBeNull();
    });

    it('uses the resource body and lets fetch() replace it', () => {
      const resource = create((api) => api.put({ url: '/items/1', manual: true, body: { name: 'old' } }));

      resource.fetch();
      expect(httpMock.expectOne('/items/1').request.body).toEqual({ name: 'old' });

      resource.fetch({ body: { title: 'new' } });
      expect(httpMock.expectOne('/items/1').request.body).toEqual({ title: 'new' });
    });

    it('DELETE keeps bodies that have no own keys and accepts an empty one', () => {
      const resource = create((api) => api.delete({ url: '/items', manual: true }));
      const form: FormData = new FormData();

      form.append('id', '1');

      resource.fetch({ body: form });
      expect(httpMock.expectOne('/items').request.body).toBe(form);

      resource.fetch({ body: [] });
      expect(httpMock.expectOne('/items').request.body).toEqual([]);

      resource.fetch({ body: undefined });
      expect(httpMock.expectOne('/items').request.body).toBeNull();
    });
  });

  describe('mergeValues', () => {
    it('appends arrays', () => {
      const resource = create((api) => api.get<number[]>({
        url: '/numbers',
        manual: true,
        initialValue: [1],
        mergeValues: true,
      }));

      resource.fetch();
      httpMock.expectOne('/numbers').flush([2, 3]);

      expect(resource.value()).toEqual([1, 2, 3]);
    });

    it('merges objects', () => {
      const resource = create((api) => api.get<Record<string, number>>({
        url: '/object',
        manual: true,
        initialValue: { a: 1, b: 1 },
        mergeValues: true,
      }));

      resource.fetch();
      httpMock.expectOne('/object').flush({ b: 2, c: 3 });

      expect(resource.value()).toEqual({ a: 1, b: 2, c: 3 });
    });

    it('overwrites when the types do not match or there is nothing to merge with', () => {
      const mismatch = create((api) => api.get<unknown>({
        url: '/mismatch',
        manual: true,
        initialValue: [1],
        mergeValues: true,
      }));
      const empty = create((api) => api.get<number[]>({ url: '/empty', manual: true, mergeValues: true }));

      mismatch.fetch();
      httpMock.expectOne('/mismatch').flush({ a: 1 });
      empty.fetch();
      httpMock.expectOne('/empty').flush([1]);

      expect(mismatch.value()).toEqual({ a: 1 });
      expect(empty.value()).toEqual([1]);
    });

    it('can be switched per fetch()', () => {
      const afterSuccess = jasmine.createSpy('afterSuccess');
      const resource = create((api) => api.get<number[]>({
        url: '/numbers',
        manual: true,
        initialValue: [1],
        afterSuccess,
      }));

      resource.fetch({ mergeValues: true });
      httpMock.expectOne('/numbers').flush([2]);

      expect(resource.value()).toEqual([1, 2]);
      expect(afterSuccess).toHaveBeenCalledOnceWith([1, 2]);

      resource.fetch({ mergeValues: false });
      httpMock.expectOne('/numbers').flush([3]);

      expect(resource.value()).toEqual([3]);
    });
  });

  describe('pipe', () => {
    it('is applied to the response and may convert it', () => {
      const resource = create((api) => api.get<number>({
        url: '/stats',
        manual: true,
        pipe: pipe(map((raw: { total: number }) => raw.total)),
      }));

      resource.fetch();
      httpMock.expectOne('/stats').flush({ total: 5 });

      expect(resource.value()).toBe(5);
    });

    it('keeps loading true until a delayed pipe emits', () => {
      jasmine.clock().install();

      try {
        const resource = create((api) => api.get<string>({ url: '/slow', manual: true, pipe: pipe(delay(1000)) }));

        resource.fetch();
        httpMock.expectOne('/slow').flush('late');

        expect(resource.loading()).toBeTrue();
        expect(resource.value()).toBeNull();

        jasmine.clock().tick(1000);

        expect(resource.loading()).toBeFalse();
        expect(resource.value()).toBe('late');
      } finally {
        jasmine.clock().uninstall();
      }
    });
  });

  describe('request$()', () => {
    it('returns a cold observable that leaves the signals and callbacks alone', () => {
      const afterSuccess = jasmine.createSpy('afterSuccess');
      const resource = create((api) => api.get<number[]>({
        url: '/numbers/{{id}}',
        manual: true,
        initialValue: [],
        afterSuccess,
        pipe: pipe(map((list: number[]) => list.map((n: number) => n * 10))),
      }));

      const request$: Observable<number[]> = resource.request$({ urlParams: { id: 9 } });

      httpMock.expectNone('/numbers/9');

      const received: number[][] = [];

      request$.subscribe((value: number[]) => received.push(value));
      httpMock.expectOne('/numbers/9').flush([1, 2]);

      expect(received).toEqual([[10, 20]]);
      expect(resource.value()).toEqual([]);
      expect(resource.loading()).toBeFalse();
      expect(afterSuccess).not.toHaveBeenCalled();
    });

    it('throws on a missing url parameter', () => {
      const resource = create((api) => api.post({ url: '/items/{{id}}', manual: true }));

      expect(() => resource.request$()).toThrowError('Missing value for URL parameter: id');
    });
  });

  describe('types', () => {
    type Equal<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false;
    type IsAny<T> = 0 extends 1 & T ? true : false;

    it('value is T with initialValue and T | null without it', () => {
      const withInitial = create((api) => api.get<IItem[]>({ url: '', manual: true, initialValue: [] }));
      const withoutInitial = create((api) => api.get<IItem>({ url: '', manual: true }));

      const first: Equal<typeof withInitial, IHttpResource<Get, IItem[]>> = true;
      const second: Equal<typeof withoutInitial, IHttpResource<Get, IItem, IItem | null>> = true;
      const third: Equal<ReturnType<typeof withoutInitial.request$>, Observable<IItem>> = true;

      expect([first, second, third]).toEqual([true, true, true]);
      expect(withInitial.value()).toEqual([]);
      expect(withoutInitial.value()).toBeNull();
    });

    it('accepts annotated fields and rejects a non-null annotation without initialValue', () => {
      const list: IHttpResource<Get, IItem[]> = create((api) => api.get({ url: '', manual: true, initialValue: [] }));
      const nullable: IHttpResource<Post, IItem, IItem | null> = create((api) => api.post({ url: '', manual: true }));
      const loose: IHttpResource<Delete> = create((api) => api.delete({ url: '', manual: true }));
      // @ts-expect-error
      const wrong: IHttpResource<Post, IItem> = create((api) => api.post<IItem>({ url: '', manual: true }));

      expect([list.value(), nullable.value(), loose.value(), wrong.value()]).toEqual([[], null, null, null]);
    });

    it('checks initialValue against T but does not infer T from it', () => {
      const untyped = create((api) => api.get({ url: '', manual: true, initialValue: [] }));
      const stillAny: IsAny<ReturnType<typeof untyped.value>> = true;

      // @ts-expect-error
      create((api) => api.get<IItem>({ url: '', manual: true, initialValue: {} }));

      expect(stillAny).toBeTrue();
      expect(untyped.value()).toEqual([]);
    });

    it('types the options of post, put and patch', () => {
      const post: IsAny<NonNullable<IPostRequest<unknown>['options']>> = false;
      const put: IsAny<NonNullable<IPutRequest<unknown>['options']>> = false;
      const patch: IsAny<NonNullable<IPatchRequest<unknown>['options']>> = false;

      create((api) => api.post({ url: '', manual: true, options: { withCredentials: true } }));
      // @ts-expect-error
      create((api) => api.post({ url: '', manual: true, options: { withCredentials: 'yes' } }));
      // @ts-expect-error
      create((api) => api.put({ url: '', manual: true, options: { nope: true } }));

      expect([post, put, patch]).toEqual([false, false, false]);
    });

    it('types the argument of fetch() per method', () => {
      const resource = create((api) => api.get<IItem>({ url: '/items', manual: true }));

      resource.fetch({ queryParams: { a: 1 }, mergeValues: true, options: { withCredentials: true } });
      // @ts-expect-error
      resource.fetch({ body: {} });

      expect(httpMock.match('/items?a=1').length).toBe(1);
      expect(httpMock.match('/items').length).toBe(1);
    });
  });
});
