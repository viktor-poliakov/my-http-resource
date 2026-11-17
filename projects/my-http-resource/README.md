# MyHttpResource

#### `MyHttpResource` is a wrapper around Angular’s `HttpClient` that provides a **reactive approach to working with HTTP requests**.
#### It automatically manages states (`loading`, `error`, `value`), processes URL parameters, and allows easy configuration of post-request handling.

[![npm version](https://img.shields.io/npm/v/my-http-resource.svg)](https://www.npmjs.com/package/my-http-resource)
![Angular](https://img.shields.io/badge/angular-17%2B-red)
![RxJS](https://img.shields.io/badge/RxJS-7%2B-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/viktor-poliakov/my-http-resource/blob/main/LICENSE)

---

## 💡 Installation and Concept

⚠️ ***Important***. MyHttpResource uses `HttpClient`, so don’t forget to add a call to the `provideHttpClient()` function in the project configuration under the providers field.

- You create a “resource” once (e.g., posts, sendPost, updatePost, etc.) with all its settings.
- A resource always includes:
  * `loading: Signal<boolean>`
  * `value: WritableSignal<T>` — or `WritableSignal<T | null>` when no `initialValue` is set, because the value is `null` until the first response.
  * `error: WritableSignal<unknown>`
  * `fetch(fetchData?)` — executes the request immediately and updates signals.
  * `request$(fetchData?)` — returns an `Observable<T>` without side effects.

If `manual: false` (default), the request is executed immediately when the resource is created. If `manual: true`, it only runs when you call `fetch()` or `request$()`.

To install, run `npm install my-http-resource` or `yarn add my-http-resource` and import the required entities into your application:
```ts
import { IHttpResource, myHttpResource, Get, Post, Put, Patch, Delete } from 'my-http-resource';
```

---

## 📚 Usage examples

### 1. GET request

```ts
public getRequestData: IHttpResource<Get, TData> = myHttpResource().get<TData>({
  url:'your_url/{{myId}}',
  pipe: pipe(delay(1000)),
  afterSuccess: (data: TData) => this.afterSuccess(data),
  afterError: (error: HttpErrorResponse) => this.afterError(error),
  urlParams: { myId: 2 },
  headers: {
    testHeader: '12345'
  },
  queryParams: { currency: 'USD' },
  manual: true,
  initialValue: [],
  mergeValues: false,
  opttions: {
    // httpOptions for get request
  }
});

public myMethod(): void {
  this.getRequestData.fetch({
    queryParams: { currency: 'EUR' },
    urlParams: { myId: 3 },
    mergeValues: true,
    opttions: {
      // httpOptions for get request
    }
  })
}
```

### 2. POST request

```ts
public postRequestData: IHttpResource<Post, TData> = myHttpResource().post<TData>({
  url:'your_url/{{myId}}',
  manual: true,
  body: { name: 'Elizabeth'},  
  pipe: pipe(delay(1000)),
  afterSuccess: (data: TData) => this.afterSuccess(data),
  afterError: (error: HttpErrorResponse) => this.afterError(error),
  urlParams: { myId: 2 },
  headers: {
    testHeader: '12345'
  },
  manual: true,
  initialValue: [],
  mergeValues: false,
  opttions: {
    // httpOptions for post request
  }
});

public myMethod(): void {
  this.postRequestData.fetch({
    body: { name: 'Arnold'},
    urlParams: { myId: 3 },
    mergeValues: true,
    opttions: {
      // httpOptions for post request
    }
  })
}
```

### 3. PUT request

```ts
public putRequestData: IHttpResource<Put, TData> = myHttpResource().put<TData>({
  url:'your_url/{{myId}}',
  manual: true,
  body: { name: 'Elizabeth'},  
  pipe: pipe(delay(1000)),
  afterSuccess: (data: TData) => this.afterSuccess(data),
  afterError: (error: HttpErrorResponse) => this.afterError(error),
  urlParams: { myId: 2 },
  headers: {
    testHeader: '12345'
  },
  manual: true,
  initialValue: [],
  mergeValues: false,
  opttions: {
    // httpOptions for put request
  }
});

public myMethod(): void {
  this.putRequestData.fetch({
    body: { name: 'Arnold'},
    urlParams: { myId: 3 },
    mergeValues: true,
    opttions: {
      // httpOptions for put request
    }
  })
}
```
### 4. PATCH request

```ts
public patchRequestData: IHttpResource<Patch, TData> = myHttpResource().patch<TData>({
  url:'your_url/{{myId}}',
  manual: true,
  body: { name: 'Elizabeth'},
  pipe: pipe(delay(1000)),
  afterSuccess: (data: TData) => this.afterSuccess(data),
  afterError: (error: HttpErrorResponse) => this.afterError(error),
  urlParams: { myId: 2 },
  headers: {
    testHeader: '12345'
  },
  manual: true,
  initialValue: [],
  mergeValues: false,
  opttions: {
    // httpOptions for patch request
  }
});

public myMethod(): void {
  this.putRequestData.fetch({
    body: { name: 'Arnold'},
    urlParams: { myId: 3 },
    mergeValues: true,
    opttions: {
      // httpOptions for patch request
    }
  })
}
```

### 5. DELETE request

```ts
public deleteRequestData: IHttpResource<Delete, TData> = myHttpResource().delete<TData>({
  url:'your_url/{{myId}}',
  pipe: pipe(delay(1000)),
  afterSuccess: (data: TData) => this.afterSuccess(data),
  afterError: (error: HttpErrorResponse) => this.afterError(error),
  urlParams: { postId: 2 },
  headers: {
    testHeader: '12345'
  },
  queryParams: { currency: 'USD' },
  manual: true,
  initialValue: [],
  mergeValues: false,
  body: { name: 'Elizabeth' },
  opttions: {
    // httpOptions for delete request
  }
});

public myMethod(): void {
  this.deleteRequestData.fetch({
    body: { name: 'Arnold'}, // if 
    queryParams: { currency: 'EUR' },
    urlParams: { myId: 3 },
    mergeValues: true,
    opttions: {
      // httpOptions for get request
    }
  })
}
```

---

## 🚀 Quick Start (Minimal Example)

```ts
// app.service.ts
import { Injectable, inject } from '@angular/core';
import { myHttpResource } from 'my-http-resource';

export interface IPost {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

@Injectable()
export class AppService {
  // GET: /posts/{{postId}}?limit=... - All parameters except url are optional.
  public posts = myHttpResource().get<IPost[]>({
    url: '/api/posts/{{postId}}',
    urlParams: { postId: 1 },
    queryParams: { limit: 10 },
    initialValue: [],           // What to populate value with before the response.
    afterSuccess: (data: IPost[]) => console.log('got posts', data),
    afterError: (e) => console.warn('get error', e),
    // manual: true,  // If you need to disable auto-start.
    mergeValues: true, // If you want the received data to be merged with the previous ones instead of overwriting them.
  });

  // POST: /posts - All parameters except url are optional.
  public sendPost = myHttpResource().post<IPost>({
    url: '/api/posts',
    body: { name: 'John', email: 'john@mail.com', body: 'Hello' },
    headers: { 'X-Trace-Id': 'abc-123' },
    manual: true,               // Send manually via fetch().
    mergeValues: true
  });

  // PUT: /posts/{{id}} - All parameters except url are optional.
  public updatePost = myHttpResource().put<IPost>({
    url: '/api/posts/{{id}}',
    urlParams: { id: 1 },
    manual: true,
  });

  // PATCH: /posts/{{id}} - All parameters except url are optional.
  public patchPost = myHttpResource().patch<IPost>({
    url: '/api/posts/{{id}}',
    urlParams: { id: 1 },
    manual: true,
  });

  // DELETE: /posts/{{id}} - All parameters except url are optional.
  public deletePost = myHttpResource().delete<void>({
    url: '/api/posts/{{id}}',
    urlParams: { id: 1 },
    manual: true,
  });
}
```

```ts
// app.component.ts (usage snippets)
import { Component, inject } from '@angular/core';
import { AppService, IPost } from './services/app.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-root',
  template: `
    <button (click)="fetchPost()">Load posts</button>
    <button (click)="sendPostHandler()">Create post</button>
    <button (click)="putPostHandler()">PUT</button>
    <button (click)="patchPostHandler()">PATCH</button>
    <button (click)="deletePostHandler()">DELETE</button>
    <button (click)="requestObservable()">forkJoin example</button>

    @if (appService.posts.loading()) {
        <div>Loading...</div>
    }
    
    @if (appService.posts.error()) {
     <pre">Error: {{ err | json }}</pre>
    }
   
    <pre>{{ appService.posts.value() | json }}</pre>
  `,
})
export class AppComponent {
  protected appService = inject(AppService);

  fetchPost(): void {
    this.appService.posts.fetch();                 // GET
  }

  sendPostHandler(): void {
    this.appService.sendPost.fetch();              // POST
  }

  putPostHandler(): void {
    this.appService.updatePost.fetch({ 
      body: { name: 'New', email: 'n@e.com', body: '...' },
      mergeValues: true,
    });
  }

  patchPostHandler(): void {
    this.appService.patchPost.fetch({ body: { name: 'Patch only name' }});
  }

  deletePostHandler(): void {
    this.appService.deletePost.fetch();
  }

  requestObservable(): void {
    forkJoin({
      one: this.appService.posts.request$({ urlParams: { postId: 5 } }),
      two: this.appService.sendPost.request$(),
    }).subscribe(({ one, two }) => {
      // Manually update the signal if needed.
      this.appService.posts.value.set(one);
    });
  }
}
```
---

## 🛠️ Key Features and How to Use Them

### 1. URL Templates (createUrl)

Use placeholders {{...}} in the url. They are filled from `urlParams`.

````ts
url: '/api/users/{{ userId }}/posts/{{ postId }}',
urlParams: { userId: 42, postId: 7 } // → /api/users/42/posts/7
````
If a key is missing, you’ll get a clear error: “Missing value for URL parameter…”.

### 2. Query and URL parameters

Set them directly in the config or when calling `fetch()`/`request$()`.

````ts
public data = this.http.get<IData>({
  url: '/api/posts/{{postId}}',
  queryParams: { limit: 20, search: 'angular' },
  urlParams: { postId: 1 }
});
````
Override at call time:

````ts
data.fetch({ 
  queryParams: { limit: 5 },
  urlParams: { postId: 1 }
});
````
### 3. Request Body for POST/PUT/PATCH/DELETE

Define it in the config or override when calling:

````ts
public data = this.http.post<IData>({
  url: '/api/posts',
  body: { title: 'Hello', body: 'World' },
});
````
You can override it in `fetch()` or `request$()`.

````ts
data.fetch({ body: { title: 'Updated' } });
````

### 4. Auto vs Manual Mode

- By default, requests are executed immediately.
- Use `manual: true` to control execution manually.

````ts
public data = myHttpResource().post<IData>({
  url: '/api/items',
  manual: true, // Doesn’t start automatically
});

// later:
data.fetch();
````
### 5. Success / Error Handlers (`afterSuccess` / `afterError`)

````ts
public data = myHttpResource().post<IData>({
  url: '/api/items',
  afterSuccess: (data) => console.log('OK', data),
  afterError: (err) => console.warn('ERR', err),
});
````
These callbacks are invoked automatically when you call `fetch()` or when the request is triggered automatically with manual = false. For `request$()` (a plain `Observable`), the callbacks won’t fire—you decide when to subscribe and what to do with the result.

### 6. Pipe (RxJS operators)

You can pipe RxJS operators into the request stream. You can’t override it in `fetch()` or `request()`.
````ts
import { map } from 'rxjs/operators';

public data =  myHttpResource().get<{ id: number; name: string }[]>({
  url: '/api/users',
  pipe: pipe(
    map(list => list.filter(u => !!u.name))
  ),
});
````
### 7. Data merging
- If you need to merge the data from the previous request with the current one, use the flag `mergeValues: true`.
- The data must be of the same type — either an array or an object. If the data types do not match, the `mergeValues` flag will not work.
```ts
public data = myHttpResource().post<IData>({
  url: '/api/items',
  manual: true, 
  initialValue: [],
  mergeValues: true,
});

data.fetch({ 
  body: { title: 'Updated' }, 
  mergeValues: false 
});

```
### 8. Three Ways to Make a Request

- Automatic request when `manual = false`. This does not prevent you from later calling `fetch()` or `request()`.
- `fetch(fetchData?)` — makes a request, automatically sets `loading = true`, clears the previous `error`, puts the result into `value`, and the error into `error`.
- `request$(fetchData?)` — returns an `Observable<T>` without side effects. Handy for compositions (forkJoin, switchMap, etc.). The state in signals does not change unless you update it yourself.

### 9. State Management

Every resource provides:
- `loading()` — true / false. Stays `true` until every request started by `fetch()` has finished.
- `value()` — current value (you can set/update). It is `null` until the first response unless you set `initialValue`.
- `error()` — HttpErrorResponse | unknown (you can set/update). It is reset to `null` when a new `fetch()` starts.

Example of manually updating the value:

````ts
resource.value.update(prev => [...prev, newItem]);
````

### 10. Repeated `fetch()` calls

- **GET** — a new `fetch()` cancels the request that is still in flight, so an older response can never overwrite a newer one.
- **POST / PUT / PATCH / DELETE** — requests run side by side, and `afterSuccess` / `afterError` fire for each of them.
- Use `cancelPrevious` to change the default, for example for a search that is sent with POST:

````ts
public search = myHttpResource().post<IData[]>({
  url: '/api/search',
  manual: true,
  initialValue: [],
  cancelPrevious: true, // only the latest search is applied
});
````

### 11. Headers and options

- `options` of the resource and `options` passed to `fetch()` / `request$()` are merged key by key, so a call-time option does not drop the resource-level ones.
- Headers of all levels are combined: `headers` → `options.headers` of the resource → `options.headers` of the call. For the same header name the later one wins.

````ts
public data = myHttpResource().get<IData>({
  url: '/api/items',
  manual: true,
  headers: { Authorization: 'token' },
  options: { withCredentials: true },
});

// Sends Authorization, X-Trace-Id and withCredentials: true.
data.fetch({ options: { headers: { 'X-Trace-Id': 'abc-123' } } });
````
---

## 🗂️ Types (to avoid confusion)

* `Get/Delete → { queryParams?, urlParams? }`
* `Post/Patch/Put → { body?, urlParams? }`
* `IHttpResource<Method, T, V = T>`:
  * `loading: Signal<boolean>`
  * `value: WritableSignal<V>`
  * `error: WritableSignal<unknown>`
  * `fetch(fetchData?: Method): void`
  * `request$(fetchData?: Method): Observable<T>`

The generic T in get<T>() / post<T>() / ... is the type of the expected response.

`V` is the type held by `value`. With `initialValue` it equals `T`; without it the value starts as `null`, so `V` is `T | null`. The simplest way is to let TypeScript infer the type. If you annotate the field, spell it out:

```ts
public posts = myHttpResource().get<IPost[]>({ url: '/api/posts', initialValue: [] });
// IHttpResource<Get, IPost[]>

public sendPost: IHttpResource<Post, IPost, IPost | null> = myHttpResource().post({ url: '/api/posts', manual: true });
```

---

## ✅ Best practices and tips:

#### 1. Always set `initialValue` meaningfully (for example, [] for lists) to avoid unnecessary checks in the template.
#### 2. Use `mergeValues: true` if you want the data received from the server not to overwrite the current value, but to be merged with it. Keep in mind that the type of the current value and the data received from the server must match. Otherwise, mergeValues will not work, and the server response will simply overwrite the current value. 
#### 3. Use `manual: true` for user actions (create/update/delete) so the request doesn’t fire automatically.
#### 4. Use `request$()` for stream combinations (forkJoin, combineLatest, switchMap) — it’s a “pure” Observable.
#### 5. `Signals are the source of truth`. After any external operations (dialogs, sockets, etc.), you can manually update with `value.set / update`.
#### 6. `Errors`. Display error() in the UI; you can log them centrally via `afterError`.
#### 7. `URL parameters.` If a key is missing in urlParams, the service will throw a clear error — which is good, it gets caught immediately.
#### 8. `Headers`. If needed, put technical identifiers (traceId, locale, etc.) into headers at the resource level.

---

## 🐞 Common mistakes and how to avoid them

- #### Forgot `urlParams` for the template → “Missing value for URL parameter…”. Solution: pass all the keys used in {{...}}.
- #### `Incorrect initialValue` → the template expects [], but null came instead. Solution: set an appropriate default type.
- #### Expecting `request$()` to update `value()` → it won’t. It’s a “pure” stream. Use `fetch()` or update value manually in subscribe.
- #### Confusing `queryParams` and `body` → for GET/DELETE use `queryParams`, for POST/PUT/PATCH/DELETE use `body`.
- #### I set `mergeValues`, but the data isn’t merging? Verify that the data type is an array or an object, and that the server response type matches the type of the current value.
--- 

## 📋 Migration of existing code to MyHttpService (checklist)

#### 1. Identify the endpoint → create a get/post/put/patch/delete resource.
#### 2. Specify the `url` and `urlParams` (if there are {{...}}).
#### 3. Set an `initialValue` of the appropriate type.
#### 4. Decide whether auto-start (`manual`) is needed.
#### 5. Move local handling to `afterSuccess/afterError` or into a `pipe` if it’s a data transformation.
#### 6. In the component: read `loading/value/error`, and call `fetch()` on an event.

## Thank you ❤️!!!
