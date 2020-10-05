/**
 * xprezzo
 * Copyright(c) 2020 Ben Ajenoui
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 */

const JsonParser = require('xprezzo-json-parser')
const RawParser = require('xprezzo-raw-parser')
const TextParser = require('xprezzo-text-parser')
const UrlencodedParser = require('xprezzo-urlencoded-parser')
const EventEmitter = require('events').EventEmitter
const mixin = require('xprezzo-buffer').mixin
const proto = require('./proto')
const Route = require('./router/route')
const Router = require('./router')
const req = require('./request')
const res = require('./response')
const debug = require('xprezzo-serve-static').debug('xprezzo:xprezzo')


/**
  * Create an xprezzo application.
  *
  * @return {Function}
  * @api public
  */
exports = module.exports = () => {
  debug('start')
  let app = (req, res, next) => {
    return app.handle(req, res, next)
  }
  mixin(app, EventEmitter.prototype, proto,
    {
      request: Object.create(req, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
      }),
      response: Object.create(res, {
        app: { configurable: true, enumerable: true, writable: true, value: app }
      })
    }
  )
  if(typeof app.init === 'function'){
    debug('call proto init()')
    app.init()
  }
  debug('done')
  return app
}

/**
 * Expose the prototypes.
 */
exports.application = proto
exports.request = req
exports.response = res

/**
 * Expose constructors.
 */
exports.Route = Route
exports.Router = Router

/**
 * Expose middleware
 */
exports.json = JsonParser
exports.query = require('./middleware/query')
exports.raw = RawParser
exports.static = require('xprezzo-serve-static')
exports.text = TextParser
exports.urlencoded = UrlencodedParser
