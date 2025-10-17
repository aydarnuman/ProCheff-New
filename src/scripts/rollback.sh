#!/usr/bin/env bash
set -euo pipefail
PROJECT_ID=degsan-site
REGION=us-west1
SERVICE=procheff
gcloud run services update-traffic "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" --to-latest
echo "Rollback tamamlandı (latest rev'e trafik)."