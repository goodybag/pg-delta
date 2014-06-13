# Node Postgres Deltas

Runs database deltas in order of semver and adds some nice plpgsql functions to help facilitate migrations.

When you just need some simple database migrations done, it's useful to run a plpgsql delta script. Why use plpgsql instead of using your own scripting language of choice? Plpgsql scripts are run as a transaction automatically, so you don't have to worry about messing things up during development of your delta script. Also, being able to easily utilize SQL in the scripting language is a huge plus.

__Install:__

```
npm install pg-delta
```

__Usage:__

Setup a directory with your delta scripts:

```
db/
  deltas/
    - 1.0.0.sql
    - 1.0.1.sql
    - 1.0.2.sql
```

In a script, require the delta module and call `run`.

```javascript
var delta = require('pg-delta');
var options = {
  connectionParameters: MY_POSTGRES_CONN_STR
, deltasDir: './db/deltas'
};

delta.run( options, function( error ){
   /* ... */
});
```

## Docs

### Javascript API

Note that the pg-delta module is also an `EventEmitter`.

#### delta.run( options, [callback] )

Run the deltas specified in the directory `options.deltasDir` in order of semver.

__Required Options:__

```javascript
{
  // Postgres connection string
  connectionParameters: 'postgres://localhost/my_db'
  // Directory in which your delta scripts live
, deltasDir:      './db/deltas'
, deltasQuery:    'select * from deltas'
, deltaExtension: 'sql'
, setupPath:      path.join( __dirname, 'setup.sql' )
}
```

__Optional Options and Defaults:__

```javascript
{
  // Query used to select deltas already run
  deltasQuery:    'select * from deltas'
  // Extension for deltas file
, deltaExtension: 'sql'
  // Path for setup script
, setupPath:      path.join( __dirname, 'setup.sql' )
}
```

#### delta.tableExists( tableName, callback( error, result ) )

Checks whether a table exists

#### delta.runSqlFile( filePath, callback( error ) )

Reads a file and executes the result as a query

### Events

```javascript
var delta = require('pg-delta');

delta.on( 'before:delta', function( version, file, contents ){
  /* ... */
});

delta.on( 'before:delta:x.x.x', function( file, contents ){
  /* ... */
});

delta.on( 'after:delta', function( version, file, contents ){
  /* ... */
});

delta.on( 'after:delta:x.x.x', function( file, contents ){
  /* ... */
});
```

### PLPGSQL API

### A sample delta script

```sql
-- Delta

DO $$
declare version text := '1.2.3';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  insert into "deltas" ( "version" ) values ( version );

  -- Add a new table
  create table if not exists users ();

  -- Intead of creating a table and all of its columns
  -- in one statement, break up each column into its own
  -- statement so you can run the script multiple times
  -- and add new columns as you go

  perform add_column( 'users', 'id', 'serial primary key' );
  perform add_column( 'users', 'email', 'text' );
  perform add_column( 'users', 'password', 'text' );
  perform add_column( 'users', 'name', 'text' );

  -- Drop constraints before adding them so script can 
  -- be run multiple times
  if exists ( select 1 where constraint_exists( 'users_email_key' ) is true )
  then
    alter table users drop constraing users_email_key;
  end if;

  alter table users add constraint users_email_key unique( "email" );
end$$;
```

#### boolean table_exists( tbl_name text )

Checks whether a table exists

#### boolean column_exists( tbl_name text, col_name text )

Checks whether a column exists on a table

#### boolean constraint_exists( c_name text )

Checks whether a constraint exists by constraint name

#### boolean constraint_exists( c_type text, tbl_name text, col_name text )

Checks whether a constraint exists by constraint type, table, and column

#### void add_column( tbl_name text, col_name text, col_type text )

Attempts to add a column to a table if the column does not already exist

#### void drop_column( tbl_name text, col_name text )

Attempts to drop a column to a table if the column exists

#### void add_type( type_name text, type_def text )

Attempts to add a new data type if the type does not already exist
