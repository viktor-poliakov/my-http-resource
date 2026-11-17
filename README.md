# MyHttpResource

[![npm version](https://img.shields.io/npm/v/my-http-resource.svg)](https://www.npmjs.com/package/my-http-resource)
![Angular](https://img.shields.io/badge/angular-17%2B-red)
![RxJS](https://img.shields.io/badge/RxJS-7%2B-blue)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

`MyHttpResource` is a small wrapper around Angular’s `HttpClient` that turns an endpoint into a **resource**. You describe the request once and get `loading`, `value` and `error` as signals, plus two ways to run the request.

```bash
npm install my-http-resource
```

```ts
import { Injectable } from '@angular/core';
import { myHttpResource } from 'my-http-resource';

@Injectable({ providedIn: 'root' })
export class PostsService {
  public posts = myHttpResource().get<IPost[]>({ url: '/api/posts', initialValue: [] });
}

// posts.value()   → IPost[]
// posts.loading() → boolean
// posts.error()   → unknown
// posts.fetch()   → sends the request again
```

📖 **Full documentation:** [projects/my-http-resource/README.md](projects/my-http-resource/README.md)

---

## What is in this repository

| Path | What it is |
|---|---|
| [`projects/my-http-resource`](projects/my-http-resource) | The library that is published to npm. |
| [`src`](src) | A demo application that uses the library. |
| `dist/my-http-resource` | The built library. Created by the build, not stored in git. |

---

## Development

Install the dependencies:

```bash
npm install
```

Build the library:

```bash
npm run build:lib
```

Run the tests of the library once, in headless Chrome:

```bash
npm run test:lib
```

Run the demo application at `http://localhost:4200/`:

```bash
npm start
```

⚠️ The demo imports the library from `dist/my-http-resource`, so build the library before starting the demo, and build it again after you change the library.

---

## Publishing

1. Change `version` in [`projects/my-http-resource/package.json`](projects/my-http-resource/package.json).
2. Build the library and publish it from `dist/my-http-resource`:

```bash
npm run publish:lib
```

---

## License

[MIT](LICENSE)
