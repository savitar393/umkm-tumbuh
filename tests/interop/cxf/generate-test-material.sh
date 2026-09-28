#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PKI_SCRIPT="$SCRIPT_DIR/../../smoke/ca-trust/generate-pki.sh"

cd "$SCRIPT_DIR"
rm -rf certs
bash "$PKI_SCRIPT"

cp -r ../../smoke/ca-trust/certs ./certs

cd certs

# Create client.jks (Leaf A)
openssl pkcs12 -export -in leaf-a.crt -inkey leaf-a.key \
    -certfile client-inter.crt -name client \
    -out client.p12 -passout pass:password
keytool -importkeystore -deststorepass password -destkeypass password -destkeystore client.jks -srckeystore client.p12 -srcstoretype PKCS12 -srcstorepass password -alias client

# Create client-b.jks (Leaf B)
openssl pkcs12 -export -in leaf-b.crt -inkey leaf-b.key \
    -certfile client-inter.crt -name client \
    -out client-b.p12 -passout pass:password
keytool -importkeystore -deststorepass password -destkeypass password -destkeystore client-b.jks -srckeystore client-b.p12 -srcstoretype PKCS12 -srcstorepass password -alias client

# Create attacker.jks
openssl pkcs12 -export -in attacker.crt -inkey attacker.key \
    -certfile attacker-ca.crt -name client \
    -out attacker.p12 -passout pass:password
keytool -importkeystore -deststorepass password -destkeypass password -destkeystore attacker.jks -srckeystore attacker.p12 -srcstoretype PKCS12 -srcstorepass password -alias client

# Create server truststore
keytool -import -trustcacerts -alias server-ca -file server-ca.crt -keystore server-truststore.jks -storepass password -noprompt

echo "Java keystores generated in $SCRIPT_DIR/certs"
