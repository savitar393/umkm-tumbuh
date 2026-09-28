#!/bin/bash
set -euo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
CERT_DIR="$SCRIPT_DIR/certs"

mkdir -p "$CERT_DIR"
cd "$CERT_DIR"

# Server CA
openssl req -x509 -newkey rsa:2048 -nodes -keyout server-ca.key -out server-ca.crt -days 365 -subj "/CN=Server CA"
openssl req -newkey rsa:2048 -nodes -keyout server.key -out server.csr -subj "/CN=Server"
openssl x509 -req -in server.csr -CA server-ca.crt -CAkey server-ca.key -CAcreateserial -out server.crt -days 365

# Client CA
openssl req -x509 -newkey rsa:2048 -nodes -keyout client-ca.key -out client-ca.crt -days 365 -subj "/CN=Client Root CA"

# Client Intermediate
openssl req -newkey rsa:2048 -nodes -keyout client-inter.key -out client-inter.csr -subj "/CN=Client Intermediate CA"
openssl x509 -req -in client-inter.csr -CA client-ca.crt -CAkey client-ca.key -CAcreateserial -out client-inter.crt -days 365 -extfile <(echo -e "basicConstraints=critical,CA:TRUE\nkeyUsage=critical,keyCertSign,cRLSign")

# Leaf A
openssl req -newkey rsa:2048 -nodes -keyout leaf-a.key -out leaf-a.csr -subj "/CN=Leaf A"
openssl x509 -req -in leaf-a.csr -CA client-inter.crt -CAkey client-inter.key -CAcreateserial -out leaf-a.crt -days 365

# Leaf B
openssl req -newkey rsa:2048 -nodes -keyout leaf-b.key -out leaf-b.csr -subj "/CN=Leaf B"
openssl x509 -req -in leaf-b.csr -CA client-inter.crt -CAkey client-inter.key -CAcreateserial -out leaf-b.crt -days 365

# Attacker CA & Leaf
openssl req -x509 -newkey rsa:2048 -nodes -keyout attacker-ca.key -out attacker-ca.crt -days 365 -subj "/CN=Attacker CA"
openssl req -newkey rsa:2048 -nodes -keyout attacker.key -out attacker.csr -subj "/CN=Attacker Leaf"
openssl x509 -req -in attacker.csr -CA attacker-ca.crt -CAkey attacker-ca.key -CAcreateserial -out attacker.crt -days 365

chmod 644 *.crt *.key
