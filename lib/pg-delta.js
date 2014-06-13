/**
 * PG Delta
 */

var EventEmitter  = require('events').EventEmitter;
var fs            = require('fs');
var path          = require('path');
var pgjs          = require('pg.js');
var query         = require('pg-query');
var async         = require('async');
var semver        = require('semver');
var debug         = require('debug')('pg-delta');

for ( var key in EventEmitter.prototype ){
  module.exports[ key ] = EventEmitter.prototype[ key ];
}

module.exports.tableExists = function( table, callback ){
  var sql = 'SELECT * FROM pg_catalog.pg_tables where tablename = $1';

  query( sql, [ table ], function( error, results ){
    if ( error ) return callback( error );
    callback( null, results.length > 0 );
  });
};

module.exports.importSql = function( file, callback ){
  async.waterfall([
    fs.readFile.bind( fs, file )
  , function( sql, done ){ done( null, sql.toString(), [] ); }
  , query
    // Don't return results in callback, they're useless
  , function( r, rr, next ){ return next(); }
  ], callback );
};

module.exports.run = function( options, callback ){
  var this_ = this;

  var defaults = {
    deltasQuery:    'select * from deltas'
  , deltaExtension: 'sql'
  , setupPath:      path.join( __dirname, 'setup.sql' )
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

  query.connectionParameters = options.connectionParameters;

  async.waterfall([
    this.importSql.bind( null, options.setupPath )
  , this.tableExists.bind( null, 'deltas' )

  , function( exists, done ){
      // Deltas did not exist, this is a problem
      if ( !exists ){
        throw new Error('Could not find deltas table');
      }

      debug('Finding deltas already run')
      query( options.deltasQuery, [], done );
    }

  , function( results, result, done ){
      // Sort results by semver
      results.sort( function( a, b ){
        return semver.compare( a, b );
      });

      debug('Reading deltas directory')
      fs.readdir( options.deltasDir, function( error, files ){
        if ( error ) return done( error );
        done( null, results, files );
      });
    }

  , function( results, files, done ){
      // Filter to only files of the specified type
      var deltas = files.filter( function( file ){
        return [
          fs.statSync( path.join( options.deltasDir, file ) ).isFile()
        , file.slice(-4) === '.' + options.deltaExtension
        ].every( function( a ){ return a; });

      // Reject files that have already been run
      }).filter( function( file ){
        return results.indexOf( file.slice( 0, -4 ) ) === -1;

      // Sort files by semver
      }).sort( function( a, b ){
        return semver.compare( a.slice( 0, -4 ), b.slice( 0, -4 ) );
      });

      done( null, deltas );
    }

  , function( deltas, done ){
      var onDelta = function( file, next ){
        debug( '> ', file );

        fs.readFile( path.join( options.deltasDir, file ), function( error, result ){
          this_.emit( 'before:delta', file, file.slice( 0, -4 ), result );

          query( result.toString(), [], function( error ){
            if ( error ) return next( error );

            this_.emit( 'after:delta', file, file.slice( 0, -4 ), result );
          });
        });
      };

      async.eachSeries( deltas, onDelta, done );
    }
  ], callback );
};

module.exports = Object.create( module.exports );
EventEmitter.call( module.exports );