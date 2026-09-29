#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting existing network..."
cd "$SCRIPT_DIR/fabric-samples/test-network" || exit 1

# Just start existing containers without recreating
docker start peer0.org1.example.com peer0.org2.example.com peer0.org3.example.com \
  orderer.example.com orderer2.example.com orderer3.example.com \
  couchdb0 couchdb1 couchdb4 \
  ca_org1 ca_org2 ca_org3 ca_orderer 2>/dev/null

# Ensure valid certificates exist
if [ -f "$SCRIPT_DIR/generate_admin_certs.sh" ]; then
  bash "$SCRIPT_DIR/generate_admin_certs.sh" >/dev/null 2>&1 || true
fi

echo "Starting fabric-api..."
cd "$SCRIPT_DIR/fabric-api" || exit 1
export DOCKER_SOCK=/var/run/docker.sock

# Ensure node is in PATH (load NVM if needed)
if ! command -v node &> /dev/null; then
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" 2>/dev/null || true
  export PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
fi

# Stop any previous fabric-api instance
pkill -f "node index.js" 2>/dev/null || true

node index.js > /tmp/fabric-api.log 2>&1 &
sleep 3

echo "Done! Check health:"
curl http://localhost:3001/health
