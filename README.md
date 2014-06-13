# Node Postgres Deltas

Runs database deltas in order of semver and adds some nice plpgsql functions to help facilitate migrations.

When you just need some simple database migrations done, it's useful to run a plpgsql delta script. Why use plpgsql instead of using your own scripting language of choice? Plpgsql scripts are run as a transaction automatically, so you don't have to worry about messing things up during development of your delta script.

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

## Pre and Post Scripts

Add a corresponding executable pre/post script to your delta. `1.2.7.pre` will be executed before you sql file and `1.2.7.post` will be executed after. Use your scripting environment of choice.

## Docs

### Javascript API

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

### PLPGSQL API

#### delta_update_to_version( version )

Inserts the version specified into the deltas table.

### A sample delta script

```sql
-- Delta

DO $$
declare version text := '" + data.version + "';
begin
raise notice '## Running Delta v% ##', version;

-- Update version
perform delta_update_to_version( version );
end$$;
```

### Generating a scaffolding

To generate the above scaffolding sample delta script, you can run a script included in this module:

```
./bin/generate-scaffold ./db/deltas/1.1.0.sql
```
