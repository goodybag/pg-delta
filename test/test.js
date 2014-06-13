var path    = require('path');
var assert  = require('assert');
var pgjs    = require('pg.js');
var query   = require('pg-query');
var semver  = require('semver');
var pgdelta = require('../');

var pgconn = 'postgres://localhost:5432/pg_delta_test';

var destroyCreateDb = function( callback ){
  query.connectionParameters = pgconn.substring( 0, pgconn.lastIndexOf('/') ) + '/postgres';
console.log('destroy');
  query( 'drop database if exists pg_delta_test', [], function( error ){
    if ( error ) return callback( error );
    console.log('create');
    query( 'create database pg_delta_test', [], callback );
  });
};

before( function( done ){
  destroyCreateDb( done );
});

describe( 'Delta Runner', function(){
  var options = {
    connectionParameters: pgconn
  , deltasDir: path.join( __dirname, 'deltas' )
  };

  it ('Should create tables', function( done ){
    pgdelta.run( options, function( error ){
      assert( !error, error );

      pgdelta.tableExists( 'deltas', function( error, result ){
        assert( !error, error );
        assert( result, 'Deltas table did not exist' );

        pgdelta.tableExists( 'test_tbl', function( error, result ){
          assert( !error, error );
          assert( result, 'test_tbl did not exist' );
          done();
        });
      });
    });
  });

  it ('Should run the deltas in correct order', function( done ){
    query( 'delete from deltas', [], function( error ){
      assert( !error, error );

      var prev;
      pgdelta.on( 'before:delta', function( version ){
        if ( !prev ) return;

        assert( semver.lt( prev, version ), 'Previous version was not less than current' );

        prev = version;
      });

      pgdelta.run( options, function( error ){
        assert( !error, error );

        done();
      });
    });
  });
});