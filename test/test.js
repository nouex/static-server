'use strict';

/**
  * TDD
  *   1. sets up server to listen on host + port
  *   2. sends and interprets minimal http headers & methods
  *   3. on client requested path, if:
  *     + file not found in public/ => 404. end request
  *     + file found in public/ => read and stream the file. end request.
  */

// TODO: don't start and close a server on each spec, use a server that
// listens on as many connections as xit doesn't require closing xit for the
// spec to do xits job
process.env.DEBUG = "server, static-file, precheck"
process.on("uncaughtException", (e) => {
  throw e
})

const http = require('http')
let {init, onRequest, middlewareLineup} = require('../server.js')

const defPort = 5000

describe('server', function () {
    // FIXME: implement opts.port
    it('listens on opts.port', function (done) {
      const port = process.env.PORT = 5454;
      const server = init({port});
      // set env.PORT back to "", we only needed xit for this spec
      delete process.env.PORT
      checkListening(server);

      function checkListening(server) {
        if (server.listening) {
          let addr = server.address();
          expect(+addr.port).toEqual(port);
          expect(addr.address).toEqual("127.0.0.1")
          server.close(done)
        } else server.once("listening", checkListening.bind(void(0), server));
      }
    });

    it('ends connection', function (done) {
      let server;
      (server = init()).once("listening", function () {
        const client = http.request({
          port: defPort
        }, function onResponse(res) {
          res.once("aborted", () => {
            server.close(done)
          })
        });
        // according to the docs flushHeaders() doesn't send them staright away
        // until first write so...
        client.write(" ");
      })
    });
  });

describe('middlware', function () {
  let server
  beforeAll(function (done) {
    server = init({public: "./test/fixtures"});
    server.once("error", (e) => {
      console.log('SErver error')
      throw e;
    })
    server.once("close", () => {
      console.log('SERVER CLOSE')
    })
    server.listen(defPort, function () {
      done();
    })
  });

  afterAll(function (done) {
    console.log('SECOND ALMOST DONE')
    server.close(done);
  });

  describe('headers', function () {
    let origMiddlewareLineup;
    // isolate middleware tot est
    beforeAll(function () {
      origMiddlewareLineup = [middlewareLineup[0], middlewareLineup[1], middlewareLineup[2]]
      middlewareLineup.splice(1, Infinity);
    })

    afterAll(function () {
      middlewareLineup[1] = origMiddlewareLineup[1];
      middlewareLineup[2] = origMiddlewareLineup[2];
      origMiddlewareLineup = null;
    })

    // FIXME
    it("sets headers", (done) => {
      expect(server.listening).toBe(true)
      server.once("request", function (req, res) {
        // Date
        let date = res.getHeader("date");
        expect(date).toEqual(jasmine.any(String), "bad Date header");
        expect(date.length).toBeGreaterThan(0);
        // connection
        let connection = res.getHeader("connection")
        expect(connection).toEqual("close", "bad Connection header")
        // transfer-encoding
        let transEnc = res.getHeader("transfer-encoding")
        expect(transEnc).toEqual("chunked");
        clientReq.end(done)
      })

      let clientReq = http.request({
        port: defPort
      });
      clientReq.flushHeaders();
      clientReq.write("foo");
    });

    it('does NOT write headers', function (done) {
      /** server.js will req.end() once all middleware have done xits job, that
        * will implicxitly send the headers so before that we inject a dummy
        * middleware.  ~~Still not the best test b/c the headers could have been
        * sent and xit just happens that the invocation for 'response' came later
        * in the event loop.~~ We have set a timout to cover the strikethrough'ed
        * case
        */
      let client, gotResponse = false, errorChecked = false;

      middlewareLineup.push(dummyMid);
      client = http.request({
        port: defPort
      });
      client.once("response", () => gotResponse = true)
      client.flushHeaders();
      client.write("foo");
      client.once("error", (e) => {
        expect(e.message).toMatch(/socket hang up/i);
        expect(gotResponse).toBe(false)
        errorChecked = true;
      })

      function dummyMid(_, __, midDone) {
        setTimeout(() => {
          expect(errorChecked).toBe(true)
          midDone();
          done();
        }, 250)
      }
    });
  })

  describe('precheck', function () {
    beforeAll(function (d) {d()
      expect(middlewareLineup.length).toBeGreaterThan(2);// precheck 2nd in line
      expect(middlewareLineup[1]).toEqual(jasmine.any(Function))
    })

    it("satus code 404", function (done) {
      let client = http.request({port: defPort, path: "/nonexistent"}, onRes)
      let statusChecked = false;
      server.once("error", function (e) {
        expect(e.message).toMatch(/socket hang up/i);
        console.log(e.messags, "EEEEEEE "   )
      })
      client.once("error", function (e) {
        expect(e.message).toMatch("socket hang up")
        if (!statusChecked) done.fail("socket hang up before status checked")
        else {
          done.fail()
        }
      })
      expect(server.listening).toBeTruthy()
      client.flushHeaders();
      client.write("foo");
      function onRes(res) {
        expect(+res.statusCode).toEqual(404)
        statusChecked = true;
        client.end(done)
      }
    })

    it("status code 200", function (done) {
      let client = http.request({port: defPort, path: "/foo"}, onResponse);
      client.end()
      function onResponse(res) {
        expect(+res.statusCode).toEqual(200)
        if (client.end(done) === false) {// already ended, wont' re-end
          done()
        }
      }
    })

    // FIXME: Error: socket hang up
    xit("flushes headers", function (done) {
      let client = http.request({port: defPort}, (res) => {
        let headers = res.headers;
        expect(headers["connection"]).toEqual("close")
        expect(headers["date"]).toBeDefined()
        expect(headers["transfer-encoding"]).toEqual("chunked")
        client.end(done)
      })

      client.write("void")
    })
  });

  describe('staticFile', function () {
    it("serves file from <public>", function (done) {
      let pub = "./fixtures";
      let file = "foo"
      let utf8 = "";

      let client = http.request({port: defPort, path: require("path").sep + file}, (incomingReq) => {
        incomingReq.setEncoding("utf8")
        incomingReq.on("data", (s) => {
          console.log(s)
          expect(typeof s).toEqual("string")
          utf8 += s;
        })
        incomingReq.once("end", () => {
          if (!utf8.includes("hello")) {
            done.fail("received data does not include 'hello'")// includes() not === b/c of poss. BOM
          } else {
            expect(client.end()).toBe(false);
            done();
          }
        })
      });
      client.end();
    })
  });
});
