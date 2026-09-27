#!/bin/bash
set -e

BASE_DIR="/mnt/c/Users/hmury/Desktop/LandRecords_PBL/LandRecords_extracted/fabric-samples/test-network/organizations/peerOrganizations"

for org in org1 org2 org3; do
    echo "=========================================="
    echo "Generating cryptogen-compatible Admin cert for $org..."
    echo "=========================================="
    
    ORG_DIR="$BASE_DIR/${org}.example.com"
    CA_DIR="$ORG_DIR/ca"
    ADMIN_MSP="$ORG_DIR/users/Admin@${org}.example.com/msp"
    
    # 1. Generate private key
    TEMP_DIR="/tmp/admin_gen_${org}"
    rm -rf "$TEMP_DIR" && mkdir -p "$TEMP_DIR"
    
    openssl ecparam -name prime256v1 -genkey -noout -out "$TEMP_DIR/admin.key"
    openssl pkcs8 -topk8 -nocrypt -in "$TEMP_DIR/admin.key" -out "$TEMP_DIR/priv_sk"
    
    # 2. Generate CSR
    openssl req -new -key "$TEMP_DIR/admin.key" -out "$TEMP_DIR/admin.csr" \
        -subj "/C=US/ST=California/L=San Francisco/O=${org}.example.com/OU=admin/CN=Admin@${org}.example.com"
    
    # 3. Create extension file
    cat << 'EXT' > "$TEMP_DIR/ext.cnf"
basicConstraints = critical, CA:FALSE
keyUsage = critical, digitalSignature
subjectKeyIdentifier = hash
authorityKeyIdentifier = keyid:always,issuer
EXT

    # 4. Sign with CA
    CA_CERT="$CA_DIR/ca.${org}.example.com-cert.pem"
    CA_KEY="$CA_DIR/priv_sk"
    
    openssl x509 -req -in "$TEMP_DIR/admin.csr" -CA "$CA_CERT" -CAkey "$CA_KEY" \
        -CAcreateserial -out "$TEMP_DIR/Admin@${org}.example.com-cert.pem" -days 3650 -extfile "$TEMP_DIR/ext.cnf"
    
    # 5. Verify cert against CA
    openssl verify -CAfile "$CA_CERT" "$TEMP_DIR/Admin@${org}.example.com-cert.pem"
    
    # 6. Copy to Admin MSP
    mkdir -p "$ADMIN_MSP/signcerts" "$ADMIN_MSP/keystore" "$ADMIN_MSP/admincerts"
    
    # Backup old if not backed up
    if [ ! -f "$ADMIN_MSP/signcerts/cert.pem.bak" ]; then
        cp "$ADMIN_MSP/signcerts/cert.pem" "$ADMIN_MSP/signcerts/cert.pem.bak" 2>/dev/null || true
    fi
    
    cp "$TEMP_DIR/Admin@${org}.example.com-cert.pem" "$ADMIN_MSP/signcerts/Admin@${org}.example.com-cert.pem"
    cp "$TEMP_DIR/Admin@${org}.example.com-cert.pem" "$ADMIN_MSP/signcerts/cert.pem"
    cp "$TEMP_DIR/Admin@${org}.example.com-cert.pem" "$ADMIN_MSP/admincerts/Admin@${org}.example.com-cert.pem"
    
    # Keystore
    rm -f "$ADMIN_MSP/keystore/"*
    cp "$TEMP_DIR/priv_sk" "$ADMIN_MSP/keystore/priv_sk"
    
    # Revert config.yaml to point to cryptogen CA
    cat << CFG > "$ORG_DIR/msp/config.yaml"
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.${org}.example.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.${org}.example.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.${org}.example.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.${org}.example.com-cert.pem
    OrganizationalUnitIdentifier: orderer
CFG
    cp "$ORG_DIR/msp/config.yaml" "$ORG_DIR/peers/peer0.${org}.example.com/msp/config.yaml"
    cp "$ORG_DIR/msp/config.yaml" "$ADMIN_MSP/config.yaml"
    
    echo "Successfully updated Admin MSP for $org!"
done

echo "ALL ORGS UPDATED SUCCESSFULLY!"
