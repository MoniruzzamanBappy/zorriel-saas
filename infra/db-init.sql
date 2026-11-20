-- Run once as the Postgres superuser when creating the database.
-- zorriel_owner owns the schema and runs migrations.
-- zorriel_app is what the API connects as: it is subject to Row Level Security.
CREATE ROLE zorriel_owner LOGIN PASSWORD :'owner_password';
CREATE ROLE zorriel_app LOGIN PASSWORD :'app_password' NOSUPERUSER NOBYPASSRLS;
CREATE DATABASE zorriel OWNER zorriel_owner;
\connect zorriel
GRANT USAGE ON SCHEMA public TO zorriel_app;
ALTER DEFAULT PRIVILEGES FOR ROLE zorriel_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO zorriel_app;
ALTER DEFAULT PRIVILEGES FOR ROLE zorriel_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO zorriel_app;
ALTER DEFAULT PRIVILEGES FOR ROLE zorriel_owner IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO zorriel_app;
