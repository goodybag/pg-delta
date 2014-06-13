-- Delta

DO $$
  declare version       text := '1.0.0';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();

  create table if not exists test_tbl ();
  perform add_column( 'test_tbl', 'id', 'serial primary key' );
  perform add_column( 'test_tbl', 'name', 'text' );
end$$;