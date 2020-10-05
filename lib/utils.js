/**
 * xprezzo
 * Copyright(c) 2020 Ben Ajenoui
 * MIT Licensed
 */

'use strict';

/**
 * Module dependencies.
 * @api private
 */

const Buffer = require('xprezzo-buffer').Buffer
const contentDisposition = require('content-disposition');
const contentType = require('content-type');
const deprecate = require('depd')('xprezzo');
const { flatten } = require('array-flatten');
const mime = require('xprezzo-serve-static').mime;
const etag = require('etag');
const proxyaddr = require('proxy-addr');
const qs = require('qs');
const querystring = require('querystring');

/**
 * Return strong ETag for `body`.
 *
 * @param {String|Buffer} body
 * @param {String} [encoding]
 * @return {String}
 * @api private
 */

exports.etag = createETagGenerator({ weak: false })

/**
 * Return weak ETag for `body`.
 *
 * @param {String|Buffer} body
 * @param {String} [encoding]
 * @return {String}
 * @api private
 */

exports.wetag = createETagGenerator({ weak: true })

/**
 * Check if `path` looks absolute.
 *
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

exports.isAbsolute = function(path){
  if ('/' === path[0]) return true;
  if (':' === path[1] && ('\\' === path[2] || '/' === path[2])) return true; // Windows device path
  if ('\\\\' === path.substring(0, 2)) return true; // Microsoft Azure absolute path
};

/**
 * Flatten the given `arr`.
 *
 * @param {Array} arr
 * @return {Array}
 * @api private
 */

exports.flatten = deprecate.function(flatten,
  'utils.flatten: use array-flatten npm module instead');

/**
 * Normalize the given `type`, for example "html" becomes "text/html".
 *
 * @param {String} type
 * @return {Object}
 * @api private
 */

exports.normalizeType = function(type){
  return ~type.indexOf('/')
    ? acceptParams(type)
    : { value: mime.lookup(type), params: {} };
};

/**
 * Normalize `types`, for example "html" becomes "text/html".
 *
 * @param {Array} types
 * @return {Array}
 * @api private
 */

exports.normalizeTypes = function(types){
  let ret = [];

  for (let i = 0; i < types.length; ++i) {
    ret.push(exports.normalizeType(types[i]));
  }

  return ret;
};

/**
 * Generate Content-Disposition header appropriate for the filename.
 * non-ascii filenames are urlencoded and a filename* parameter is added
 *
 * @param {String} filename
 * @return {String}
 * @api private
 */

exports.contentDisposition = deprecate.function(contentDisposition,
  'utils.contentDisposition: use content-disposition npm module instead');

/**
 * Parse accept params `str` returning an
 * object with `.value`, `.quality` and `.params`.
 * also includes `.originalIndex` for stable sorting
 *
 * @param {String} str
 * @return {Object}
 * @api private
 */

function acceptParams(str, index) {
  let parts = str.split(/ *; */);
  let ret = { value: parts[0], quality: 1, params: {}, originalIndex: index };

  for (let i = 1; i < parts.length; ++i) {
    let pms = parts[i].split(/ *= */);
    if ('q' === pms[0]) {
      ret.quality = parseFloat(pms[1]);
    } else {
      ret.params[pms[0]] = pms[1];
    }
  }

  return ret;
}

/**
 * Compile "etag" value to function.
 *
 * @param  {Boolean|String|Function} val
 * @return {Function}
 * @api private
 */

exports.compileETag = function(val) {
  let fn;

  if (typeof val === 'function') {
    return val;
  }

  switch (val) {
    case true:
      fn = exports.wetag;
      break;
    case false:
      break;
    case 'strong':
      fn = exports.etag;
      break;
    case 'weak':
      fn = exports.wetag;
      break;
    default:
      throw new TypeError('unknown value for etag function: ' + val);
  }

  return fn;
}

/**
 * Compile "query parser" value to function.
 *
 * @param  {String|Function} val
 * @return {Function}
 * @api private
 */

exports.compileQueryParser = function compileQueryParser(val) {
  let fn;

  if (typeof val === 'function') {
    return val;
  }

  switch (val) {
    case true:
      fn = querystring.parse;
      break;
    case false:
      fn = newObject;
      break;
    case 'extended':
      fn = parseExtendedQueryString;
      break;
    case 'simple':
      fn = querystring.parse;
      break;
    default:
      throw new TypeError('unknown value for query parser function: ' + val);
  }

  return fn;
}

/**
 * Compile "proxy trust" value to function.
 *
 * @param  {Boolean|String|Number|Array|Function} val
 * @return {Function}
 * @api private
 */

exports.compileTrust = function(val) {
  if (typeof val === 'function') return val;

  if (val === true) {
    // Support plain true/false
    return function(){ return true };
  }

  if (typeof val === 'number') {
    // Support trusting hop count
    return function(a, i){ return i < val };
  }

  if (typeof val === 'string') {
    // Support comma-separated values
    val = val.split(/ *, */);
  }

  return proxyaddr.compile(val || []);
}

/**
 * Set the charset in a given Content-Type string.
 *
 * @param {String} type
 * @param {String} charset
 * @return {String}
 * @api private
 */

exports.setCharset = function setCharset(type, charset) {
  if (!type || !charset) {
    return type;
  }

  // parse type
  let parsed = contentType.parse(type);

  // set charset
  parsed.parameters.charset = charset;

  // format type
  return contentType.format(parsed);
};

/**
 * Create an ETag generator function, generating ETags with
 * the given options.
 *
 * @param {object} options
 * @return {function}
 * @private
 */

function createETagGenerator (options) {
  return function generateETag (body, encoding) {
    let buf = !Buffer.isBuffer(body)
      ? Buffer.from(body, encoding)
      : body

    return etag(buf, options)
  }
}

/**
 * Parse an extended query string with qs.
 *
 * @return {Object}
 * @private
 */

function parseExtendedQueryString(str) {
  return qs.parse(str, {
    allowPrototypes: true
  });
}

/**
 * Return new empty object.
 *
 * @return {Object}
 * @api private
 */

function newObject() {
  return {};
}
