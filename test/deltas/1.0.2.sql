-- Delta

DO $$
  declare version       text := '1.0.2';
begin
  raise notice '## Running Delta v% ##', version;

  -- Update version
  execute 'insert into deltas (version, date) values ($1, $2)' using version, now();
end$$;