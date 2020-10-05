/**
 * xprezzo
 * Copyright(c) 2020 Ben Ajenoui
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

const finalhandler = require('xprezzo-finalhandler')
const Router = require('./router')
const methods = require('methods')
const middleware = require('./middleware/init')
const query = require('./middleware/query')
const debug = require('xprezzo-serve-static').debug('xprezzo:proto')
const View = require('./view')
const http = require('http')
const compileETag = require('./utils').compileETag
const compileQueryParser = require('./utils').compileQueryParser
const compileTrust = require('./utils').compileTrust
const deprecate = require('depd')('xprezzo')
const { flatten } = require('array-flatten')
const mixin = require('xprezzo-buffer').mixin
const resolve = require('path').resolve
const setPrototypeOf = require('xprezzo-setprototypeof')
const slice = Array.prototype.slice


/**
 * Variable for trust proxy inheritance back-compat
 * @private
 */

let trustProxyDefaultSymbol = '@@symbol:trust_proxy_default'

/**
 * Initialize the server.
 *
 *   - setup default configuration
 *   - setup default middleware
 *   - setup route reflection methods
 *
 * @private
 */

let app = {
  init: function() {
    this.cache = {}
    this.engines = {}
    this.settings = {}
    return this.defaultConfiguration()
  },
  defaultConfiguration: function(){
    debug('defaultConfiguration start')
    let env = process.env.NODE_ENV || 'development'
    // default settings
    this.enable('x-powered-by')
      .set('etag', 'weak')
      .set('env', env)
      .set('query parser', 'extended')
      .set('subdomain offset', 2)
      .set('trust proxy', false)

    // trust proxy inherit back-compat
    Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
      configurable: true,
      value: true
    })
    debug('booting in %s mode', env)
    this.on('mount', function onmount(parent) {
      // inherit trust proxy
      if (this.settings[trustProxyDefaultSymbol] === true
        && typeof parent.settings['trust proxy fn'] === 'function') {
        delete this.settings['trust proxy']
        delete this.settings['trust proxy fn']
      }

      // inherit protos
      setPrototypeOf(this.request, parent.request)
      setPrototypeOf(this.response, parent.response)
      setPrototypeOf(this.engines, parent.engines)
      setPrototypeOf(this.settings, parent.settings)
    })
    // setup locals
    this.locals = Object.create(null)
    // top-most app is mounted at /
    this.mountpath = '/'
    // default locals
    this.locals.settings = this.settings
    // default configuration
    this.set('view', View)
      .set('views', resolve('views'))
      .set('jsonp callback name', 'callback')
    if (env === 'production') {
      this.enable('view cache')
    }
    Object.defineProperty(this, 'router', {
      get: function() {
        throw new Error('\'app.router\' is deprecated!\nPlease see the 3.x to 4.x migration guide for details on how to update your app.')
      }
    })
    debug('defaultConfiguration done')
    return this
  },
  lazyrouter: function(){
    debug('lazyrouter start')
    if (!this._router) {
      debug('call new Router()')
      this._router = new Router({
        app: this,
        caseSensitive: this.enabled('case sensitive routing'),
        strict: this.enabled('strict routing')
      })
      debug('call router use()')
      this._router.use(query(this.get('query parser fn')))
      debug('call router use()')
      this._router.use(middleware.init(this))
    }
    debug('lazyrouter done')
    return this
  },
  handle: function(req, res, callback){
    let router = this._router
    debug("handle start")
    // final handler
    let done = callback || finalhandler(req, res, {
      env: this.get('env'),
      onerror: function(err) {
        if (this.get('env') !== 'test') console.error(err.stack || err.toString())
        return this
      }.bind(this)
    })
    if (!router) {
      // no routes
      debug('no routes defined on app')
      done()
    } else {
      router.handle(req, res, done)
    }
    debug("handle done")
    this.emit("done")
    return this
  },
  use: function(fn){
    debug("use start")
    let offset = 0
    let path = '/'
    // default path to '/'
    // disambiguate app.use([fn])
    this.emit('use')
    if (typeof fn !== 'function') {
      let arg = fn
      while (Array.isArray(arg) && arg.length !== 0) {
        arg = arg[0]
      }

      // first arg is the path
      if (typeof arg !== 'function') {
        offset = 1
        path = fn
      }
    }
    let fns = flatten(slice.call(arguments, offset))

    if (fns.length === 0) {
      throw new TypeError('app.use() requires a middleware function')
    }
    // setup router
    this.lazyrouter()
    let router = this._router
    fns.forEach(function (fn) {
      // non-express app
      if (!fn || !fn.handle || !fn.set) {
        return router.use(path, fn)
      }

      debug('.use app under %s', path)
      fn.mountpath = path
      fn.parent = this

      // restore .app property on req and res
      router.use(path, function mounted_app(req, res, next) {
        let orig = req.app
        fn.handle(req, res, function (err) {
          setPrototypeOf(req, orig.request)
          setPrototypeOf(res, orig.response)
          next(err)
        })
      })

      // mounted an app
      fn.emit('mount', this)
    }, this)
    debug("use done")
    return this
  },
  route: function(path){
    this.lazyrouter()
    return this._router.route(path)
  },
  engine: function (ext, fn){
    if (typeof fn !== 'function') {
      throw new Error('callback function required')
    }
    // get file extension
    let extension = ext[0] !== '.'
      ? '.' + ext
      : ext
    // store engine
    this.engines[extension] = fn
    return this
  },
  param: function(name, fn){
    this.lazyrouter()
    if (Array.isArray(name)) {
      for (let i = 0 ;i < name.length; i++) {
        this.param(name[i], fn)
      }
      return this
    }
    this._router.param(name, fn)
    return this
  },
  set: function(setting, val){
    if (arguments.length === 1) {
      // app.get(setting)
      return this.settings[setting]
    }

    debug('set "%s" to %o', setting, val)

    // set value
    this.settings[setting] = val

    // trigger matched settings
    switch (setting) {
      case 'etag':
        this.set('etag fn', compileETag(val))
        break
      case 'query parser':
        this.set('query parser fn', compileQueryParser(val))
        break
      case 'trust proxy':
        this.set('trust proxy fn', compileTrust(val))
        // trust proxy inherit back-compat
        Object.defineProperty(this.settings, trustProxyDefaultSymbol, {
          configurable: true,
          value: false
        })
        break
    }
    return this
  },
  path: function() {
    return this.parent
      ? this.parent.path() + this.mountpath
      : ''
  },
  enabled: function(setting) {
    return Boolean(this.set(setting))
  },
  disabled: function (setting){
    return !this.set(setting)
  },
  enable: function(setting){
    this.set(setting, true)
    return this
  },
  disable: function (setting) {
    return this.set(setting, false)
  },
  all: function(path){
    this.lazyrouter()

    let route = this._router.route(path)
    let args = slice.call(arguments, 1)

    for (let i = 0; i < methods.length; i++) {
      route[methods[i]].apply(route, args);
    }

    return this
  },
  render: function(name, options, callback) {
    let cache = this.cache
    let done = callback
    let engines = this.engines
    let opts = options
    let renderOptions = {}
    let view

    // support callback function as second arg
    if (typeof options === 'function') {
      done = options
      opts = {}
    }

    // mixin app.locals, options
    mixin(renderOptions, this.locals)

    // mixin options._locals
    if (opts._locals) {
      mixin(renderOptions, opts._locals)
    }

    // mixin
    mixin(renderOptions, opts)

    // set .cache unless explicitly provided
    if (renderOptions.cache == null) {
      renderOptions.cache = this.enabled('view cache')
    }

    // primed cache
    if (renderOptions.cache) {
      view = cache[name]
    }

    // view
    if (!view) {
      let View = this.get('view')

      view = new View(name, {
        defaultEngine: this.get('view engine'),
        root: this.get('views'),
        engines: engines
      })

      if (!view.path) {
        let dirs = Array.isArray(view.root) && view.root.length > 1
          ? 'directories "' + view.root.slice(0, -1).join('", "') + '" or "' + view.root[view.root.length - 1] + '"'
          : 'directory "' + view.root + '"'
        let err = new Error('Failed to lookup view "' + name + '" in views ' + dirs)
        err.view = view
        return done(err)
      }

      // prime the cache
      if (renderOptions.cache) {
        cache[name] = view
      }
    }
    // render
    (function (view, options, callback) {
      try {
        view.render(options, callback)
      } catch (err) {
        callback(err)
      }
    })(view, renderOptions, done)

    return this
  },
  listen: function() {
    debug("beforeListen")
    this.emit("beforeListen")
    let server = http.createServer(this)
    return server.listen.apply(server, arguments)
  }
}

/**
 * Delegate `.VERB(...)` calls to `router.VERB(...)`.
 */

methods.forEach(function(method){
  app[method] = function(path){
    if (method === 'get' && arguments.length === 1) {
      // app.get(setting)
      return this.set(path)
    }

    this.lazyrouter()

    let route = this._router.route(path)
    route[method].apply(route, slice.call(arguments, 1))
    return this
  }
})

/**
 * Special-cased "all" method, applying the given route `path`,
 * middleware, and callback to _every_ HTTP method.
 *
 * @param {String} path
 * @param {Function} ...
 * @return {app} for chaining
 * @public
 */

// del -> delete alias

app.del = deprecate.function(app.delete, 'app.del: Use app.delete instead')

module.exports = app
