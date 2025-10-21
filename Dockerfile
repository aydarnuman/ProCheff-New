FROM node:20 AS builder
WORKDIR /app

# Install build-time system dependencies needed for PDF rasterization and OCR
ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
		apt-get install -y --no-install-recommends \
			build-essential \
			python3 \
			libvips-dev \
			poppler-utils \
			tesseract-ocr && \
		rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

# Copy sources and build; ensure sharp is rebuilt against the system libvips
COPY . .
RUN npm rebuild sharp --unsafe-perm || true
RUN npm run build

FROM node:20
WORKDIR /app
ENV NODE_ENV=production
ENV DEBIAN_FRONTEND=noninteractive

# Runtime dependencies for PDF rasterization and CLI fallbacks
RUN apt-get update && \
		apt-get install -y --no-install-recommends \
			libvips-tools \
			poppler-utils \
			tesseract-ocr && \
		rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]