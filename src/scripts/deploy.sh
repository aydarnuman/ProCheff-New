#!/usr/bin/env bash
set -euo pipefail
PROJECT_ID=degsan-site
REGION=us-west1
SERVICE=procheff
REPO=procheff
IMAGE="us-west1-docker.pkg.dev/${PROJECT_ID}/${REPO}/procheff:local-$(git rev-parse --short HEAD)"

docker build -f docker/Dockerfile -t "$IMAGE" .
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
docker push "$IMAGE"
gcloud run deploy "$SERVICE" \
  --project "$PROJECT_ID" --region "$REGION" \
  --image "$IMAGE" --allow-unauthenticated \
  --concurrency 80 --cpu 1 --memory 512Mi --port 8080 \
  --set-env-vars "GIT_SHA=$(git rev-parse --short HEAD)" \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:3" \
  --set-secrets "OPENAI_API_KEY=OPENAI_API_KEY:1" \
  --set-secrets "NEXTAUTH_SECRET=NEXTAUTH_SECRET:1" \
  --set-secrets "DB_URL_SECRET=DB_URL_SECRET:1"