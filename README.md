Description
-----------
Static, localhost server with optional public/ dir and port.

Installation
-----------
```sh
npm install bare-static-server
````

Usage
-----

`port` defaults to 5000

```js
const { init } = require("bare-static-server")
const port  = ...,
      public = ...
init({ public: "./www" })
```

Assuming dir ./www exists and it contains index.txt we may now:

```sh
curl http://127.0.0.1:5000/index.txt
```
