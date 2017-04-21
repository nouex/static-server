'use strict';

/**
  * Here we:
  * 1. check that the file requested is in public/
  * 2. if 1. passes, send headers with 200 OK else 404 NOT FOUND
  */

const resolve = require('path').resolve;
const statSync = require('fs').statSync
const urlParse = require('url').parse

const debug = require('debug')("precheck")

module.exports = function (req, res, done) {
  let exists, publicDir, reqFile, url;

  url = urlParse(`http://${req.url}`);
  reqFile = url.path
  debug("reqFile => ", reqFile)
  // NOTE: path relativity ("./") is important
  publicDir = this.public || "./public"
  reqFile = resolve(publicDir + reqFile)
  debug("resvoled reqFile =>", reqFile)

  try {
    statSync(reqFile)
    exists = true;
  } catch (err) {
    exists = false;
  }
  debug("exists => ", exists)
  if (exists) {
    res.writeHead(200)
  } else {
    res.writeHead(404)
  }
  done()
}
