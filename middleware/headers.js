'use strict';

// here we set common headers
// we go a head and send them here so be sure to set all headers in this mod
module.exports = function (req, res, done) {
  // headers sent by node even if the use doesen't
  // TODO: whta format should the Date be in ??
  res.setHeader("date", Date());
  res.setHeader("connection", "close");
  res.setHeader("transfer-encoding", "chunked")
  // TODO: set other headers
  done()
};
