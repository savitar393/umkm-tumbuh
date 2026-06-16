#!/bin/bash

# Training Service Runner Script

echo "==================================="
echo "Starting Training Service"
echo "==================================="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL is not set"
    exit 1
fi

# Install dependencies
echo "Installing dependencies..."
go mod download

# Run service
echo "Starting service on port ${TRAINING_SERVICE_PORT:-8083}..."
go run cmd/api/main.go
