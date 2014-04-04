/**
 * PG Delta
 */

var fs    = require('fs');
var path  = require('path');
var pg    = require('pg-query');
var async = require('async');

module.exports.tableExists = function( table, callback ){
  var query = 'SELECT * FROM pg_catalog.pg_tables where tablename = $1';

  pg.query( query, [ table ], function( error, results ){
    if ( error ) return callback( error );
    callback( null, results.length > 0 );
  });
};

module.exports.run = function( options, callback ){
  var defaults = {
    deltasQuery: 'select * from deltas'
  , deltaExtension: 'sql'
  };

  if ( !options.connectionParameters ){
    throw new Error('options.connectionParameters required');
  }

  if ( !options.deltasDir ){
    throw new Error('options.deltasDir required');
  }

  for ( var key in defaults ){
    if ( !(key in options) ) options[ key ] = defaults[ key ];
  }

  pg.connectionParameters = options.connectionParameters;

  async.waterfall([
    module.exports.tableExists.bind( null, 'deltas' )

  , function( exists, done ){
      // No deltas exist, no need to query deltas to find which ones to run
      if ( !exists ) return done( null, [] );

      db.query( options.deltasQuery, done );
    }

  , function( results, done ){
      // Sort results by semver
      results.sort( function( a, b ){
        return semver.compare( a, b );
      });

      fs.readdir(
        path.join( __dirname, options.deltasDir )
      , done.bind( null, results )
      );
    }

  , function( results, files ){
      var max = '0.0.0';

      if ( results.length ) max = results[ results.length - 1 ];

      // Filter to only files of the specified type
      var deltas = files.filter( function( file ){
        return [
          fs.statSync( path.join( __dirname, options.deltasDir, file ) ).isFile()
        , file.slice(-4) === '.' + options.deltaExtension
        ].every( function( a ){ return a; });

      // Reject files that have already been run
      }).filter( function( file ){
        return results.indexOf( file ) === -1;

      // Sort files by semver
      }).sort( function( a, b ){
        return semver.compare( a.slice( 0, -4 ), b.slice( 0, -4 ) );
      });
    }
  ], function( error ){
    if ( error ) return callback ? callback( error ) : null;


  });
};