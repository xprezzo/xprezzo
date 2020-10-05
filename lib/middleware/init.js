/**
 * xprezzo
 * Copyright(c) 2020 Ben Ajenoui
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @private
 */

const setPrototypeOf = require('xprezzo-setprototypeof')

/**
 * Initialization middleware, exposing the
 * request and response to each other, as well
 * as defaulting the X-Powered-By header field.
 *
 * @param {Function} app
 * @return {Function}
 * @api private
 */

exports.init = (app) => {
  return (req, res, next) => {
    if (app.enabled('x-powered-by')) res.setHeader('X-Powered-By', 'Xprezzo')
    req.res = res
    res.req = req
    req.next = next

    setPrototypeOf(req, app.request)
    setPrototypeOf(res, app.response)

    res.locals = res.locals || Object.create(null)

    next()
  }
}
