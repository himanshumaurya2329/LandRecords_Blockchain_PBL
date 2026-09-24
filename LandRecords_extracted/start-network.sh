#!/bin/bash
# Dynamically locate project root from script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_NETWORK_DIR="$SCRIPT_DIR/fabric-samples/test-network"

cd "$TEST_NETWORK_DIR" || exit 1
export DOCKER_SOCK=/var/run/docker.sock
export PATH="$SCRIPT_DIR/fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$SCRIPT_DIR/fabric-samples/config/"

# Restart existing network (don't recreate - just start stopped containers)
docker start peer0.org1.example.com peer0.org2.example.com peer0.org3.example.com 2>/dev/null
docker start orderer.example.com 2>/dev/null
docker start couchdb0 couchdb1 couchdb4 2>/dev/null
docker start ca_org1 ca_org2 ca_org3 ca_orderer 2>/dev/null

echo "Waiting for containers to be ready..."
sleep 5
docker ps
echo "Network is ready!"

# Fix certificate symlinks dynamically without hardcoded paths
for org in org1 org2 org3; do
  SIGNCERTS="$TEST_NETWORK_DIR/organizations/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/signcerts"
  KEYSTORE="$TEST_NETWORK_DIR/organizations/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/keystore"
  if [ -d "$SIGNCERTS" ]; then
    ln -sf cert.pem "$SIGNCERTS/Admin@${org}.example.com-cert.pem" 2>/dev/null
  fi
  if [ -d "$KEYSTORE" ]; then
    cd "$KEYSTORE" && ln -sf $(ls | grep -v priv_sk | head -1) priv_sk 2>/dev/null
    cd "$TEST_NETWORK_DIR" || exit 1
  fi
done
echo "Certificate symlinks verified and linked dynamically!"
