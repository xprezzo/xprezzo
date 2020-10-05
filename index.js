/*!
 * xprezzo
 * Copyright(c) 2020 Ben Ajenoui
 * MIT Licensed
 */

'use strict'
const serveStatic = require("xprezzo-serve-static")
const buffer = require("xprezzo-buffer")
const setprototypeof = require("xprezzo-setprototypeof")
const finalhandler = require('xprezzo-finalhandler')

module.exports = require('./lib/xprezzo')
module.exports.buffer = buffer
module.exports.debug = serveStatic.debug
module.exports.finalhandler = finalhandler
module.exports.mime = serveStatic.mime
module.exports.mixim = buffer.mixim
module.exports.ms = serveStatic.ms
module.exports.send = serveStatic.send
module.exports.setprototypeof = setprototypeof
