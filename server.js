"use strict";

const createServer = require( "http" ).createServer;
const eachSeries = require( "async" ).eachSeries

const staticFile = require( "./middleware/static-file" )
const headers = require( "./middleware/headers" )
const precheck = require( "./middleware/precheck" )
const debug = require('debug')("server")

const middlewareLineup = [ headers, precheck, staticFile ]

// TODO: don't export what's not used in test
module.exports = {
	init,
	onRequest,
	middlewareLineup
};

function init( opts = {/* TODO: public: ./public, port: ... */} ) {
	let server = createServer();
  // NOTE: must be in relative form i.e. ./foo/bar
	if ( "public" in opts ) {
		server.public = opts.public;// NOTE: no type checking
	}

	server.on( "request", onRequest )
	server.listen( opts.port || 5000, "127.0.0.1" )
	return server;
}

function onRequest( req, res ) {
  debug("request")
	eachSeries( middlewareLineup,
            ( middleware, done ) => {
	middleware.call( this, req, res, done );
},
            ( e ) => {
	if ( e ) {
		console.log( "error in middleware lineup" )
		throw e;
	} else {
		res.end()
	}
} )
}
