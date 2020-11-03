/**
 * xprezzo
 * Copyright(c) 2020 Ben Ajenoui
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 */

const mixin = require('xprezzo-buffer').mixin
const parseUrl = require('parseurl');
const qs = require('xprezzo-querystring');

/**
 * @param {Object} options
 * @return {Function}
 * @api public
 */

module.exports = (options) => {
  let opts = mixin({}, options)
  let queryparse = qs.parse

  if (typeof options === 'function') {
    queryparse = options
    opts = undefined
  }

  if (opts !== undefined && opts.allowPrototypes === undefined) {
    // back-compat for qs module
    opts.allowPrototypes = true
  }

  return (req, res, next) => {
    if (!req.query) {
      let val = parseUrl(req).query
      req.query = queryparse(val, opts)
    }

    next()
  }
}
