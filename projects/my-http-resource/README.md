# MyHttpResource

[![npm version](https://img.shields.io/npm/v/my-http-resource.svg)](https://www.npmjs.com/package/my-http-resource)
![Angular](https://img.shields.io/badge/angular-17%2B-red)
![RxJS](https://img.shields.io/badge/RxJS-7%2B-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/viktor-poliakov/my-http-resource/blob/main/LICENSE)

`MyHttpResource` is a small wrapper around Angular’s `HttpClient` that turns an endpoint into a **resource**. You describe the request once and get `loading`, `value` and `error` as signals, plus two ways to run the request.

- **No hand-written state** — `loading`, `value` and `error` are signals that update themselves.
- **One config per endpoint** — URL template, query, body, headers, callbacks and RxJS operators live in one place.
- **Signals or RxJS** — call `fetch()` to update the signals, or `request$()` to get a plain `Observable`.
- **Safe repeated calls** — a new GET cancels the previous one, so an old response never overwrites a newer one.

```ts
public posts = myHttpResource().get<IPost[]>({ url: '/api/posts', initialValue: [] });

// posts.value()   → IPost[]
// posts.loading() → boolean
// posts.error()   → unknown
// posts.fetch()   → sends the request again
```

---

## 📦 Installation

```bash
npm install my-http-resource
```

Requirements: Angular 17 or newer and RxJS 7.8 or newer.

⚠️ ***Important***. MyHttpResource uses `HttpClient`, so register it once in the application config:

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';

export const appConfig: ApplicationConfig = {
  providers: [provideHttpClient()],
};
```

---

## 🚀 Quick Start

```ts
// posts.service.ts
import { Injectable } from '@angular/core';
import { myHttpResource } from 'my-http-resource';

export interface IPost {
  id: number;
  title: string;
  body: string;
}

@Injectable({ providedIn: 'root' })
export class PostsService {
  // Sent right away, when the service is created.
  public posts = myHttpResource().get<IPost[]>({
    url: '/api/posts',
    initialValue: [],
  });

  // Sent only when you call fetch().
  public createPost = myHttpResource().post<IPost>({
    url: '/api/posts',
    manual: true,
    afterSuccess: (post: IPost) => this.posts.value.update((list: IPost[]) => [...list, post]),
  });
}
```

```ts
// posts.component.ts
import { Component, inject } from '@angular/core';
import { PostsService } from './posts.service';

@Component({
  selector: 'app-posts',
  template: `
    @if (service.posts.loading()) {
      <p>Loading...</p>
    } @else if (service.posts.error()) {
      <p>Could not load the posts.</p>
      <button (click)="service.posts.fetch()">Try again</button>
    } @else {
      @for (post of service.posts.value(); track post.id) {
        <article>
          <h3>{{ post.title }}</h3>
          <p>{{ post.body }}</p>
        </article>
      } @empty {
        <p>No posts yet.</p>
      }
    }

    <button [disabled]="service.createPost.loading()" (click)="addPost()">Add post</button>
  `,
})
export class PostsComponent {
  protected service = inject(PostsService);

  protected addPost(): void {
    this.service.createPost.fetch({ body: { title: 'Hello', body: 'My first post' } });
  }
}
```

---

## 💡 Concept

You create a resource once, with all its settings. Every resource has the same five members:

| Member | Type | What it does |
|---|---|---|
| `value` | `WritableSignal<T>` | The last response. Starts as `initialValue`. Without `initialValue` it starts as `null`, and the type is `T \| null`. |
| `loading` | `Signal<boolean>` | `true` while a request started by `fetch()` is running. |
| `error` | `WritableSignal<unknown>` | The error of the last failed request, usually an `HttpErrorResponse`. Reset to `null` when a new `fetch()` starts. |
| `fetch(overrides?)` | `void` | Sends the request and updates the three signals. |
| `request$(overrides?)` | `Observable<T>` | Returns the request as an `Observable`. Does not touch the signals. |

### When the request is sent

- By default the request is sent right away, when the resource is created.
- With `manual: true` it is sent only when you call `fetch()` or subscribe to `request$()`.

### Where to create a resource

`myHttpResource()` uses Angular’s `inject()`, so call it in an injection context: a field initializer or the constructor of a service, component or directive. Anywhere else Angular throws `NG0203`.

```ts
@Injectable({ providedIn: 'root' })
export class UsersService {
  // ✅ Field initializer.
  public users = myHttpResource().get<IUser[]>({ url: '/api/users', initialValue: [] });

  public load(): void {
    // ❌ NG0203: a method is not an injection context.
    const users = myHttpResource().get<IUser[]>({ url: '/api/users' });
  }
}
```

A resource lives as long as the place it was created in. Requests of a resource created in a component are cancelled when the component is destroyed. A resource created in a `providedIn: 'root'` service lives for the whole application.

---

## ⚙️ Configuration

All options except `url` are optional.

| Option | Type | Default | Description |
|---|---|---|---|
| `url` | `string` | — | Request URL. May contain `{{placeholders}}`. |
| `urlParams` | `Record<string, string \| number>` | — | Values for the placeholders in `url`. |
| `queryParams` | `Record<string, string \| number \| boolean>` | — | Query string. GET and DELETE only. |
| `body` | `object` | — | Request body. POST, PUT, PATCH and DELETE. |
| `headers` | `Record<string, string \| number>` | — | Request headers. |
| `options` | `HttpClient` options | — | Options of the matching `HttpClient` method, for example `withCredentials` or `context`. |
| `initialValue` | `T` | `null` | What `value` holds before the first response. |
| `manual` | `boolean` | `false` | `true` — do not send the request when the resource is created. |
| `mergeValues` | `boolean` | `false` | `true` — merge the response into the current value instead of replacing it. |
| `cancelPrevious` | `boolean` | `true` for GET, `false` for the rest | Whether a new `fetch()` cancels the request that is still in flight. |
| `pipe` | RxJS operators | — | Operators applied to the response before it reaches `value`. |
| `afterSuccess` | `(data: T) => void` | — | Called after a successful `fetch()`. |
| `afterError` | `(error: HttpErrorResponse) => void` | — | Called after a failed `fetch()`. |

### Overriding the config for one call

`fetch()` and `request$()` accept an object that overrides part of the config **for that call only**. The resource itself is not changed.

| Resource | Type of the argument | What you can override |
|---|---|---|
| `get()` | `Get` | `urlParams`, `queryParams`, `mergeValues`, `options` |
| `post()`, `put()`, `patch()` | `Post`, `Put`, `Patch` | `urlParams`, `body`, `mergeValues`, `options` |
| `delete()` | `Delete` | `urlParams`, `queryParams`, `body`, `mergeValues`, `options` |

`urlParams`, `queryParams` and `body` replace the resource-level value as a whole. `options` are merged key by key and headers are combined — see [Headers and options](#4-headers-and-options).

---

## 📚 Usage examples

### 1. GET request

```ts
public rates: IHttpResource<Get, IRate[]> = myHttpResource().get<IRate[]>({
  url: '/api/rates/{{base}}',
  urlParams: { base: 'USD' },
  queryParams: { limit: 10 },
  headers: { 'X-Trace-Id': 'abc-123' },
  initialValue: [],
  manual: true,
  afterSuccess: (rates: IRate[]) => console.log('Loaded', rates.length),
  afterError: (error: HttpErrorResponse) => console.warn('Failed', error.status),
});

public loadEuro(): void {
  // GET /api/rates/EUR?limit=5
  this.rates.fetch({
    urlParams: { base: 'EUR' },
    queryParams: { limit: 5 },
  });
}
```

### 2. POST request

```ts
public createUser = myHttpResource().post<IUser>({
  url: '/api/users',
  manual: true,
  body: { name: 'Elizabeth' }, // the default body
  afterSuccess: (user: IUser) => console.log('Created', user.id),
});

public create(name: string): void {
  this.createUser.fetch({ body: { name } }); // the body for this call
}
```

### 3. PUT and PATCH requests

```ts
public replaceUser = myHttpResource().put<IUser>({
  url: '/api/users/{{id}}',
  manual: true,
});

public renameUser = myHttpResource().patch<IUser>({
  url: '/api/users/{{id}}',
  manual: true,
});

public save(user: IUser): void {
  this.replaceUser.fetch({ urlParams: { id: user.id }, body: user });
}

public rename(id: number, name: string): void {
  this.renameUser.fetch({ urlParams: { id }, body: { name } });
}
```

### 4. DELETE request

```ts
public removeUser = myHttpResource().delete<void>({
  url: '/api/users/{{id}}',
  manual: true,
});

public remove(id: number): void {
  this.removeUser.fetch({ urlParams: { id } });
}

public removeWithReason(id: number, reason: string): void {
  // DELETE can also carry a query string and a body.
  this.removeUser.fetch({
    urlParams: { id },
    queryParams: { force: true },
    body: { reason },
  });
}
```

---

## 🛠️ Key Features and How to Use Them

### 1. URL templates

Use `{{...}}` placeholders in the `url`. They are filled from `urlParams`.

```ts
public post = myHttpResource().get<IPost>({
  url: '/api/users/{{ userId }}/posts/{{ postId }}',
  urlParams: { userId: 42, postId: 7 }, // → /api/users/42/posts/7
});
```

- Values are URL-encoded: `'a b'` becomes `a%20b`.
- Spaces inside the braces are ignored: `{{ userId }}` and `{{userId}}` are the same.
- If a key is missing, you get a clear error right away, before anything is sent: `Missing value for URL parameter: userId`.
- `urlParams` passed to `fetch()` replace the whole object, so pass every key again:

```ts
this.post.fetch({ urlParams: { userId: 42, postId: 8 } }); // ✅
this.post.fetch({ urlParams: { postId: 8 } });             // ❌ Missing value for URL parameter: userId
```

### 2. Query parameters

Available for GET and DELETE.

```ts
public posts = myHttpResource().get<IPost[]>({
  url: '/api/posts',
  queryParams: { limit: 20, search: 'angular' }, // → /api/posts?limit=20&search=angular
  initialValue: [],
});

public loadLess(): void {
  this.posts.fetch({ queryParams: { limit: 5 } }); // → /api/posts?limit=5
}
```

### 3. Request body

Available for POST, PUT, PATCH and DELETE. Set a default `body` in the config, or pass it to `fetch()` / `request$()`. Without a `body` the request is sent with an empty body.

```ts
public createPost = myHttpResource().post<IPost>({
  url: '/api/posts',
  manual: true,
  body: { title: 'Hello', body: 'World' },
});

public createUpdated(): void {
  this.createPost.fetch({ body: { title: 'Updated', body: 'World' } });
}
```

The body can be any object, including `FormData`:

```ts
public upload = myHttpResource().post<IFile>({ url: '/api/files', manual: true });

public send(file: File): void {
  const form: FormData = new FormData();

  form.append('file', file);
  this.upload.fetch({ body: form });
}
```

### 4. Headers and options

`headers` is the short way to set request headers. `options` accepts the options of the matching `HttpClient` method, such as `withCredentials`, `context` or `headers`.

- `options` of the resource and `options` passed to `fetch()` / `request$()` are merged key by key, so a call-time option does not drop the resource-level ones.
- Headers of all levels are combined: `headers` → `options.headers` of the resource → `options.headers` of the call. For the same header name the later one wins.
- The response is always read as a JSON body, so `observe` and `responseType` can not be changed.

```ts
public items = myHttpResource().get<IItem[]>({
  url: '/api/items',
  manual: true,
  initialValue: [],
  headers: { Authorization: 'token' },
  options: { withCredentials: true },
});

public loadWithTrace(): void {
  // Sends Authorization, X-Trace-Id and withCredentials: true.
  this.items.fetch({ options: { headers: { 'X-Trace-Id': 'abc-123' } } });
}
```

### 5. Auto vs manual mode

- By default the request is sent when the resource is created. This suits data that a screen needs right away.
- Use `manual: true` for requests that depend on a user action: create, update, delete, search.

```ts
public createItem = myHttpResource().post<IItem>({
  url: '/api/items',
  manual: true, // does not start automatically
});

public create(): void {
  this.createItem.fetch({ body: { title: 'New item' } });
}
```

An automatic resource can still be reloaded later with `fetch()`.

### 6. Success and error handlers (`afterSuccess` / `afterError`)

```ts
public createItem = myHttpResource().post<IItem>({
  url: '/api/items',
  manual: true,
  afterSuccess: (item: IItem) => console.log('OK', item),
  afterError: (error: HttpErrorResponse) => console.warn('ERR', error.status),
});
```

- They are called by `fetch()` and by the automatic first request.
- They are **not** called by `request$()` — there you subscribe yourself and decide what to do with the result.
- `afterSuccess` receives exactly what was written to `value`: the response after `pipe` and after `mergeValues`.

### 7. Pipe (RxJS operators)

`pipe` adds RxJS operators to the request. It is applied in both `fetch()` and `request$()`, and it can not be overridden per call.

```ts
import { map, pipe, retry } from 'rxjs';

public names = myHttpResource().get<string[]>({
  url: '/api/users',
  initialValue: [],
  pipe: pipe(
    retry(2),
    map((users: IUser[]) => users.map((user: IUser) => user.name)),
  ),
});
```

The operators may change the type, as in the example above: the server returns `IUser[]`, the resource holds `string[]`. The generic `T` is always the type **after** `pipe`.

### 8. Data merging (`mergeValues`)

With `mergeValues: true` the response is merged into the current value instead of replacing it:

- two arrays are joined: `[...current, ...response]`;
- two objects are merged: `{ ...current, ...response }`;
- in any other case (different types, or the current value is `null`) the response simply replaces the value.

```ts
public feed = myHttpResource().get<IPost[]>({
  url: '/api/posts',
  queryParams: { page: 1 },
  initialValue: [],
  mergeValues: true,
});

public loadSecondPage(): void {
  this.feed.fetch({ queryParams: { page: 2 } }); // value = page 1 + page 2
}

public startOver(): void {
  this.feed.fetch({ queryParams: { page: 1 }, mergeValues: false }); // value = page 1 only
}
```

### 9. Repeated `fetch()` calls (`cancelPrevious`)

- **GET** — a new `fetch()` cancels the request that is still in flight, so an older response can never overwrite a newer one.
- **POST / PUT / PATCH / DELETE** — requests run side by side, and `afterSuccess` / `afterError` fire for each of them.
- `loading()` stays `true` until every request of the resource has finished.

Use `cancelPrevious` to change the default, for example for a search that is sent with POST:

```ts
public search = myHttpResource().post<IItem[]>({
  url: '/api/search',
  manual: true,
  initialValue: [],
  cancelPrevious: true, // only the latest search is applied
});
```

### 10. `request$()` — the request as an Observable

`request$()` returns an `Observable<T>` for composing with other streams.

- Nothing is sent until you subscribe, and every subscription sends its own request.
- `pipe` from the config is applied.
- `loading`, `value`, `error`, `afterSuccess` and `afterError` are not touched. Update the signals yourself if you need to.

```ts
public loadTogether(): void {
  forkJoin({
    posts: this.posts.request$(),
    users: this.users.request$(),
  }).subscribe(({ posts, users }) => {
    this.posts.value.set(posts);
    this.users.value.set(users);
  });
}
```

### 11. Changing the state by hand

`value` and `error` are writable signals, so you can change them after dialogs, socket messages and other events that do not go through the resource.

```ts
this.posts.value.update((list: IPost[]) => [...list, newPost]);
this.posts.value.set([]);
this.posts.error.set(null);
```

---

## 🍳 Recipes

### Load more (pagination)

```ts
@Injectable({ providedIn: 'root' })
export class FeedService {
  private page: number = 1;

  public feed = myHttpResource().get<IPost[]>({
    url: '/api/posts',
    queryParams: { page: 1 },
    initialValue: [],
    mergeValues: true, // append each page to the list
  });

  public loadMore(): void {
    this.page += 1;
    this.feed.fetch({ queryParams: { page: this.page } });
  }

  public reload(): void {
    this.page = 1;
    this.feed.fetch({ queryParams: { page: 1 }, mergeValues: false });
  }
}
```

### Search as you type

Every `fetch()` of a GET resource cancels the previous request, so only the latest answer is shown.

```ts
@Component({
  selector: 'app-user-search',
  template: `
    <input #box placeholder="Search" (input)="search(box.value)" />

    @if (results.loading()) {
      <p>Searching...</p>
    }

    @for (user of results.value(); track user.id) {
      <p>{{ user.name }}</p>
    }
  `,
})
export class UserSearchComponent {
  protected results = myHttpResource().get<IUser[]>({
    url: '/api/users',
    manual: true,
    initialValue: [],
  });

  protected search(term: string): void {
    this.results.fetch({ queryParams: { q: term } });
  }
}
```

### Show the error message

`error()` has the type `unknown`, so narrow it before reading its fields.

```ts
@Component({
  selector: 'app-posts-error',
  template: `
    @if (errorMessage(); as message) {
      <p class="error">{{ message }}</p>
      <button (click)="service.posts.fetch()">Try again</button>
    }
  `,
})
export class PostsErrorComponent {
  protected service = inject(PostsService);

  protected errorMessage = computed(() => {
    const error: unknown = this.service.posts.error();

    return error instanceof HttpErrorResponse ? `${error.status}: ${error.message}` : null;
  });
}
```

### Delete a row and update the list

`afterSuccess` does not know which row was deleted. `request$()` keeps the `id` at hand:

```ts
public posts = myHttpResource().get<IPost[]>({ url: '/api/posts', initialValue: [] });

public removePost = myHttpResource().delete<void>({ url: '/api/posts/{{id}}', manual: true });

public remove(id: number): void {
  this.removePost.request$({ urlParams: { id } }).subscribe(() => {
    this.posts.value.update((list: IPost[]) => list.filter((post: IPost) => post.id !== id));
  });
}
```

### One request after another

```ts
public user = myHttpResource().get<IUser>({ url: '/api/users/{{id}}', manual: true });

public userPosts = myHttpResource().get<IPost[]>({ url: '/api/posts', manual: true, initialValue: [] });

public loadUserWithPosts(id: number): void {
  this.user.request$({ urlParams: { id } })
    .pipe(
      tap((user: IUser) => this.user.value.set(user)),
      switchMap((user: IUser) => this.userPosts.request$({ queryParams: { userId: user.id } })),
    )
    .subscribe((posts: IPost[]) => this.userPosts.value.set(posts));
}
```

### A resource without `initialValue`

Without `initialValue` the value is `null` until the first response, and its type is `T | null`.

```ts
@Component({
  selector: 'app-profile',
  template: `
    @if (user.value(); as user) {
      <h2>{{ user.name }}</h2>
    } @else if (user.loading()) {
      <p>Loading...</p>
    }
  `,
})
export class ProfileComponent {
  protected user = myHttpResource().get<IUser>({
    url: '/api/users/{{id}}',
    urlParams: { id: 1 },
  });
}
```

---

## 🗂️ Types

```ts
import {
  myHttpResource,
  IHttpResource,
  Get, Post, Put, Patch, Delete,                                      // the argument of fetch() / request$()
  IGetRequest, IPostRequest, IPutRequest, IPatchRequest, IDeleteRequest, // the config of a resource
  TQueryParams, TUrlParams,
} from 'my-http-resource';
```

`IHttpResource<Method, T, V = T>` is the type of a resource:

- `Method` — what `fetch()` and `request$()` accept: `Get`, `Post`, `Put`, `Patch` or `Delete`.
- `T` — the type of the response. It is the generic of `get<T>()`, `post<T>()` and the others.
- `V` — the type held by `value`. With `initialValue` it equals `T`. Without it the value starts as `null`, so `V` is `T | null`.

The simplest way is to let TypeScript infer the type. If you annotate the field, spell it out:

```ts
// Inferred: IHttpResource<Get, IPost[]>
public posts = myHttpResource().get<IPost[]>({ url: '/api/posts', initialValue: [] });

// Annotated, with initialValue.
public users: IHttpResource<Get, IUser[]> = myHttpResource().get({ url: '/api/users', initialValue: [] });

// Annotated, without initialValue: the third parameter says that value may be null.
public createPost: IHttpResource<Post, IPost, IPost | null> = myHttpResource().post({
  url: '/api/posts',
  manual: true,
});
```

---

## ⬆️ Upgrading from 0.4 to 0.5

- **`value` may be `null`.** Without `initialValue` the type of `value` is now `T | null`. Change `IHttpResource<Post, IPost>` to `IHttpResource<Post, IPost, IPost | null>`, or remove the annotation and let TypeScript infer it.
- **`initialValue` must match `T`.** For example `initialValue: {}` is no longer accepted for `get<IPost>()`.
- **`options` of POST, PUT and PATCH are type-checked.** Before they accepted anything.
- **A repeated GET `fetch()` cancels the previous request.** Set `cancelPrevious: false` to get the old behaviour back.
- **POST, PUT and PATCH without a `body` send an empty body** instead of `{}`.
- **`options` are merged and headers are combined** instead of being replaced.
- **`error` is reset to `null`** when a new `fetch()` starts.

---

## ✅ Best practices and tips

1. **Set `initialValue` for lists and objects** (for example `[]`) so the template needs no `null` checks.
2. **Use `manual: true` for user actions** (create, update, delete) so the request does not fire when the resource is created.
3. **Use `request$()` for stream combinations** (`forkJoin`, `combineLatest`, `switchMap`) — it is a plain `Observable`.
4. **Signals are the source of truth.** After dialogs, socket messages and similar events, update the state with `value.set()` / `value.update()`.
5. **Show `error()` in the UI** and log errors in one place with `afterError`.
6. **Keep data transformation in `pipe`** and side effects in `afterSuccess`.
7. **Put technical headers** (trace id, locale) at the resource level with `headers`.

---

## 🐞 Common mistakes and how to avoid them

| What you see | Why | What to do |
|---|---|---|
| `NG0203: inject() must be called from an injection context` | `myHttpResource()` was called in a method or a callback. | Create the resource in a field initializer or in the constructor. |
| `NullInjectorError: No provider for HttpClient` | `HttpClient` is not registered. | Add `provideHttpClient()` to the application config. |
| `Missing value for URL parameter: id` | The `url` contains `{{id}}`, but `urlParams` has no `id`. `urlParams` passed to `fetch()` replace the resource-level ones. | Pass every key that the `url` uses. |
| `Object is possibly 'null'` when reading `value()` | There is no `initialValue`, so `value` starts as `null`. | Set `initialValue`, or check for `null` first. |
| `value()` does not change after `request$()` | `request$()` never touches the signals. | Use `fetch()`, or call `value.set()` in `subscribe`. |
| `mergeValues` does not merge | The response and the current value are not both arrays or both objects. | Make the types match, for example `initialValue: []` for a list. |
| `queryParams` is not accepted by POST, PUT or PATCH | `queryParams` exists only for GET and DELETE. | Put the query into the `url`, or use `options: { params: { ... } }`. |

---

## 📋 Migrating existing `HttpClient` code

Before:

```ts
@Component({ selector: 'app-posts', templateUrl: './posts.component.html' })
export class PostsComponent implements OnInit {
  private http: HttpClient = inject(HttpClient);
  private destroyRef: DestroyRef = inject(DestroyRef);

  protected posts: IPost[] = [];
  protected loading: boolean = false;
  protected error: unknown = null;

  public ngOnInit(): void {
    this.loading = true;

    this.http.get<IPost[]>('/api/posts')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (posts: IPost[]) => {
          this.posts = posts;
          this.loading = false;
        },
        error: (error: unknown) => {
          this.error = error;
          this.loading = false;
        },
      });
  }
}
```

After:

```ts
@Component({ selector: 'app-posts', templateUrl: './posts.component.html' })
export class PostsComponent {
  protected posts = myHttpResource().get<IPost[]>({ url: '/api/posts', initialValue: [] });
}
```

Checklist:

1. Identify the endpoint and create a `get` / `post` / `put` / `patch` / `delete` resource.
2. Specify the `url`, and `urlParams` if the URL has `{{...}}` placeholders.
3. Set an `initialValue` of the right type.
4. Decide whether the request should start by itself or needs `manual: true`.
5. Move data transformation into `pipe` and reactions to the result into `afterSuccess` / `afterError`.
6. In the template read `loading()`, `value()` and `error()`, and call `fetch()` on events.

---

## Thank you ❤️!!!
