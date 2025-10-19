/*
  # Enable pg_trgm Extension

  1. Extension Setup
    - Enables the `pg_trgm` extension for trigram text search
    - Required for `gin_trgm_ops` operator class used in phone number search indexes
  
  2. Notes
    - This extension provides text similarity measurement and index searching based on trigrams
    - Must be enabled before creating GIN indexes with `gin_trgm_ops`
*/

CREATE EXTENSION IF NOT EXISTS pg_trgm;
