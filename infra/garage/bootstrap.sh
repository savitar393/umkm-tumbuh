#!/bin/sh
set -e

apk add --no-cache curl >/dev/null 2>&1

echo "Menunggu Garage siap..."
sleep 3

BASE="http://garage:3903"
AUTH="Authorization: Bearer $GARAGE_ADMIN_TOKEN"
JSON="Content-Type: application/json"

echo ">>> Configure cluster layout..."

# Get node ID from GetClusterStatus
NODE_ID=$(curl -sf "$BASE/v2/GetClusterStatus" -H "$AUTH" | sed 's/.*"id":"\([^"]*\)".*/\1/')
echo "Node ID: $NODE_ID"

# Stage layout changes
curl -sf -X POST "$BASE/v2/UpdateClusterLayout" \
  -H "$AUTH" -H "$JSON" \
  -d "{\"roles\":[{\"id\":\"$NODE_ID\",\"zone\":\"dc1\",\"capacity\":1073741824000,\"tags\":[]}],\"parameters\":{\"zoneRedundancy\":{\"atLeast\":1}}}" \
  || echo "Layout staging gagal, lanjut..."

# Apply layout (version 1 for fresh setup, or check current)
curl -sf -X POST "$BASE/v2/ApplyClusterLayout" \
  -H "$AUTH" -H "$JSON" \
  -d '{"version":1}' \
  || echo "Layout apply mungkin sudah dilakukan, lanjut..."

echo ">>> Import key..."
curl -sf -X POST "$BASE/v2/ImportKey" \
  -H "$AUTH" -H "$JSON" \
  -d '{"accessKeyId":"umkm_garage_access_key","secretAccessKey":"umkm_garage_secret_key","name":"UMKM App Key"}' \
  || echo "Key mungkin sudah ada atau format tidak valid, lanjut..."

echo ">>> Get a valid Garage key..."
KEYS_JSON=$(curl -sf "$BASE/v2/ListKeys" -H "$AUTH")
# Try to find existing key or create one
KEY_ID=$(echo "$KEYS_JSON" | sed 's/.*"id":"\(GK[^"]*\)".*/\1/')
if [ -z "$KEY_ID" ]; then
  KEY_RESP=$(curl -sf -X POST "$BASE/v2/CreateKey" -H "$AUTH" -H "$JSON" -d '{"name":"umkm app key","allow":{"createBucket":true}}')
  KEY_ID=$(echo "$KEY_RESP" | sed 's/.*"accessKeyId":"\([^"]*\)".*/\1/')
fi
echo "Key ID: $KEY_ID"

echo ">>> Create buckets..."
for bucket in documents certificates product-images partnership-files; do
  curl -sf -X POST "$BASE/v2/CreateBucket" \
    -H "$AUTH" -H "$JSON" \
    -d "{\"globalAlias\":\"$bucket\"}" \
    || echo "Bucket $bucket mungkin sudah ada, lanjut..."
done

echo ">>> Grant key permissions to buckets..."
for bucket in documents certificates product-images partnership-files; do
  BUCKET_INFO=$(curl -sf "$BASE/v2/GetBucketInfo?globalAlias=$bucket" -H "$AUTH")
  BID=$(echo "$BUCKET_INFO" | sed 's/.*"id":"\([^"]*\)".*/\1/')
  if [ -n "$BID" ]; then
    curl -sf -X POST "$BASE/v2/AllowBucketKey" \
      -H "$AUTH" -H "$JSON" \
      -d "{\"bucketId\":\"$BID\",\"accessKeyId\":\"$KEY_ID\",\"permissions\":{\"read\":true,\"write\":true,\"owner\":true}}" \
      || echo "Allow sudah diatur untuk $bucket, lanjut..."
  fi
done

echo "========================================"
echo "  Garage bootstrap selesai!"
echo "  Access Key ID: $KEY_ID"
echo "========================================"
