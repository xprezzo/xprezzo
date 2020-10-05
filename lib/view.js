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

const debug = require('xprezzo-serve-static').debug('xprezzo:view');
const path = require('path');
const fs = require('fs');

/**
 * Module variables.
 * @private
 */

let dirname = path.dirname;
let basename = path.basename;
let extname = path.extname;
let join = path.join;
let resolve = path.resolve;

/**
 * Module exports.
 * @public
 */

module.exports = View;

/**
 * Initialize a new `View` with the given `name`.
 *
 * Options:
 *
 *   - `defaultEngine` the default template engine name
 *   - `engines` template engine require() cache
 *   - `root` root path for view lookup
 *
 * @param {string} name
 * @param {object} options
 * @public
 */

function View(name, options) {
  let opts = options || {};

  this.defaultEngine = opts.defaultEngine;
  this.ext = extname(name);
  this.name = name;
  this.root = opts.root;

  if (!this.ext && !this.defaultEngine) {
    throw new Error('No default engine was specified and no extension was provided.');
  }

  let fileName = name;

  if (!this.ext) {
    // get extension from default engine name
    this.ext = this.defaultEngine[0] !== '.'
      ? '.' + this.defaultEngine
      : this.defaultEngine;

    fileName += this.ext;
  }

  if (!opts.engines[this.ext]) {
    let mod, fn;
    // add reverse support for extension using .send
    if(this.ext === ".send" ){
      mod = "xprezzo-send";
    } else {
      mod = this.ext.substr(1)
    }

    // load engine
    debug('require "%s"', mod)
    // default engine export
    if (mod === "xprezzo-send"){
      fn = require("xprezzo-serve-static").send.__express
    } else {
      fn = require(mod).__express
    }

    if (typeof fn !== 'function') {
      throw new Error('Module "' + mod + '" does not provide a view engine.')
    }

    opts.engines[this.ext] = fn
  }

  // store loaded engine
  this.engine = opts.engines[this.ext];

  // lookup path
  this.path = this.lookup(fileName);
  return this;
}

/**
 * Lookup view by the given `name`
 *
 * @param {string} name
 * @private
 */

View.prototype.lookup = function lookup(name) {
  let path;
  let roots = [].concat(this.root);

  debug('lookup "%s"', name);

  for (let i = 0; i < roots.length && !path; i++) {
    let root = roots[i];

    // resolve the path
    let loc = resolve(root, name);
    let dir = dirname(loc);
    let file = basename(loc);

    // resolve the file
    path = this.resolve(dir, file);
  }

  return path;
};

/**
 * Render with the given options.
 *
 * @param {object} options
 * @param {function} callback
 * @private
 */

View.prototype.render = function render(options, callback) {
  debug('render "%s"', this.path);
  this.engine(this.path, options, callback);
};

/**
 * Resolve the file within the given directory.
 *
 * @param {string} dir
 * @param {string} file
 * @private
 */

View.prototype.resolve = function resolve(dir, file) {
  let ext = this.ext;

  // <path>.<ext>
  let path = join(dir, file);
  let stat = tryStat(path);

  if (stat && stat.isFile()) {
    return path;
  }

  // <path>/index.<ext>
  path = join(dir, basename(file, ext), 'index' + ext);
  stat = tryStat(path);

  if (stat && stat.isFile()) {
    return path;
  }
};

/**
 * Return a stat, maybe.
 *
 * @param {string} path
 * @return {fs.Stats}
 * @private
 */

function tryStat(path) {
  debug('stat "%s"', path);

  try {
    return fs.statSync(path);
  } catch (e) {
    return undefined;
  }
}
