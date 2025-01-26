# Build stage
FROM node:lts-bookworm-slim AS builder

WORKDIR /src

# Copy package files first
COPY package*.json ./

# Install build dependencies
RUN apt-get update && \
    apt-get install -y \
    python3 \
    make \
    g++ \
    libssl-dev \
    git && \
    yarn install --frozen-lockfile

# Copy application code after dependencies are installed
COPY . .

# Verify environment file exists
RUN test -f .env || (echo ".env file not found" && exit 1)

EXPOSE 8000

ENV DOTENV_PATH=/src/.env

# Use shell form to ensure environment variables are read
CMD ["yarn", "dev"]