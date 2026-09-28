#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
cd "$SCRIPT_DIR"

PROJECT_NAME="wssec-interop"
COMPOSE_BASE="$REPO_ROOT/infra/docker-compose.yml"
COMPOSE_SMOKE="$REPO_ROOT/tests/smoke/ca-trust/docker-compose.smoke.yml"
ENDPOINT="http://127.0.0.1:9091/partnership"

echo "=== 1. Generating Test PKI and Keystores ==="
bash "$SCRIPT_DIR/generate-test-material.sh"

# Check if the disposable server is running; if not, spin it up
MANAGED_CONTAINER=false
if ! curl -sf "$ENDPOINT?wsdl" > /dev/null 2>&1; then
    echo "=== Starting disposable SOAP service ($PROJECT_NAME) ==="
    HOST_BIND_ADDRESS=127.0.0.3 docker compose \
        --env-file "$REPO_ROOT/.env.example" \
        -f "$COMPOSE_BASE" \
        -f "$COMPOSE_SMOKE" \
        -p "$PROJECT_NAME" \
        up -d --build
    MANAGED_CONTAINER=true

    # Wait for service to be healthy
    echo "Waiting for $ENDPOINT?wsdl to be ready..."
    for i in $(seq 1 30); do
        if curl -sf "$ENDPOINT?wsdl" > /dev/null 2>&1; then
            echo "SOAP endpoint ready."
            break
        fi
        sleep 1
    done
else
    echo "=== Reloading freshly generated CA in running SOAP service ==="
    docker compose \
        -f "$COMPOSE_BASE" \
        -f "$COMPOSE_SMOKE" \
        -p "$PROJECT_NAME" \
        restart soap-partnerships-service
    for i in $(seq 1 30); do
        if curl -sf "$ENDPOINT?wsdl" > /dev/null 2>&1; then
            echo "SOAP endpoint ready."
            break
        fi
        sleep 1
    done
fi

echo "=== 2. Refreshing WSDL contract from live service ==="
curl -sf "$ENDPOINT?wsdl" -o "$SCRIPT_DIR/src/main/resources/partnership.wsdl"

echo "=== 3. Running Apache CXF & WSS4J Interoperability Tests ==="
mkdir -p /tmp/m2-cache
docker run --rm --network host \
    -v /tmp/m2-cache:/root/.m2 \
    -v "$SCRIPT_DIR":/app \
    -w /app \
    maven:3.9-eclipse-temurin-17 \
    mvn clean test -B

if [ "$MANAGED_CONTAINER" = true ]; then
    echo "=== Cleaning up disposable compose environment ==="
    docker compose \
        -f "$COMPOSE_BASE" \
        -f "$COMPOSE_SMOKE" \
        -p "$PROJECT_NAME" \
        down -v --remove-orphans
    rm -rf "$REPO_ROOT/tests/smoke/ca-trust/certs"
    rm -rf "$SCRIPT_DIR/certs"
fi

echo "=== Interoperability test suite completed successfully ==="
