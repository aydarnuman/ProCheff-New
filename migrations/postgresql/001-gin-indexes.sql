-- PostgreSQL-specific optimizations for ProCheff
-- ProCheff PostgreSQL Performance Optimizations
-- GIN indexes for JSON metadata fields
-- Run only on PostgreSQL production environments

-- Guard: Only run on PostgreSQL (will fail silently on SQLite)
DO $$ 
BEGIN
    -- Check if we're on PostgreSQL
    PERFORM version() WHERE version() LIKE '%PostgreSQL%';
    IF NOT FOUND THEN
        RAISE NOTICE 'Skipping PostgreSQL-specific optimizations on non-PostgreSQL database';
        RETURN;
    END IF;
END $$;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Offers metadata GIN index for JSON queries
CREATE INDEX IF NOT EXISTS offers_metadata_gin_idx
  ON offers USING GIN ((metadata) jsonb_path_ops);

-- Tenders requirements GIN index for JSON queries  
CREATE INDEX IF NOT EXISTS tenders_requirements_gin_idx
  ON tenders USING GIN ((requirements) jsonb_path_ops);

-- Composite indexes for frequent queries
CREATE INDEX IF NOT EXISTS offers_tender_simulation_idx
  ON offers (tenderId, simulationId, createdAt DESC);

CREATE INDEX IF NOT EXISTS tenders_status_created_idx
  ON tenders (status, createdAt DESC);

-- Full-text search support for tender titles
CREATE INDEX IF NOT EXISTS tenders_title_gin_idx
  ON tenders USING GIN (to_tsvector('turkish', title));

-- Comments for maintenance
COMMENT ON INDEX offers_metadata_gin_idx IS 'JSON sorguları için GIN - offers.metadata';
COMMENT ON INDEX tenders_requirements_gin_idx IS 'JSON sorguları için GIN - tenders.requirements';
COMMENT ON INDEX offers_tender_simulation_idx IS 'Composite index for offer lookups by tender+simulation';
COMMENT ON INDEX tenders_status_created_idx IS 'Composite index for tender listings by status';
COMMENT ON INDEX tenders_title_gin_idx IS 'Turkish full-text search on tender titles';

-- Index for SLI metrics queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS sli_metrics_name_timestamp_labels_idx
ON sli_metrics (name, timestamp DESC) INCLUDE (labels, value);

-- Comments for maintenance
COMMENT ON INDEX offers_metadata_gin_idx IS 'GIN index for fast JSON queries on offers.metadata (clientId, status, tags)';
COMMENT ON INDEX tenders_metadata_gin_idx IS 'GIN index for fast JSON queries on tenders.metadata (analysis filters)';
COMMENT ON INDEX offers_tender_simulation_created_idx IS 'Composite index for offers listing with date sorting';
COMMENT ON INDEX sli_metrics_name_timestamp_labels_idx IS 'Optimized index for SLI metrics monitoring queries';