'use strict';

const urlParse = require('url').parse
const resolve = require('path').resolve;
const createReadStream = require('fs').createReadStream

const debug = require('debug')("static-file")

module.exports = function (req, res, done) {
  // 1. get rel path
  // 2. fs.createReadStreamAsync() if success
  let rStream;
  let url = urlParse(`http://${req.url}`);
  let reqFile = url.path
  // NOTE: path relativity ("./") is important
  let publicDir = this.public || "./public"
  reqFile = resolve(publicDir + reqFile)

  if (res.statusCode === 404) {
    done();
    return;
  } else if (res.statusCode === 200) {
    debug("reqFile =>", reqFile);
    rStream = createReadStream(reqFile, { autoClose: true});
    rStream.once("end", () => {
      done()
    })
    rStream.pipe(res);
  } else {
    throw new Error("unexpeced status code")
  }
};
