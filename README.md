# Module for running delta plpgsql scripts

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

## Docs

### delta.run( options, [callback] )

Run the deltas specified in the directory `options.deltasDir`.

__Options:__

    ```javascript
    {
      // Postgres connection string
      connectionParameters: 'postgres://localhost/my_db'
      // Directory in which your delta scripts live
    , deltasDir: './db/deltas'
    }
    ```
