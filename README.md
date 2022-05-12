![Xprezzo](https://xprezzo.org/logo.png)

# Xprezzo

The most updated MVC web framework for NodeJS

## Examples

```js
const xprezzo = require('xprezzo')
const app = xprezzo()

app.get('/', function (req, res) {
  res.send('Hello World')
})

app.listen(3000)
```

## Features

  * Robust routing
  * Focus on high performance
  * Super-high test coverage
  * HTTP helpers (redirection, caching, etc)
  * View system supporting 14+ template engines
  * Content negotiation
  * Executable for generating applications quickly


## Examples

  To view the examples, clone the Express repo and install the dependencies:

```bash
$ git clone git://github.com/xpreszzo/xpreszzo.git
$ cd xpreszzo
$ npm install
```

  Then run whichever example you want:

```bash
$ node examples/content-negotiation
```

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm install
$ npm test
```

## People

Xprezzo and related projects are maintained by [Cloudgen Wong](mailto:cloudgen.wong@gmail.com).


## License

  [MIT](LICENSE)
