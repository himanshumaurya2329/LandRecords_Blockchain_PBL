#!/bin/bash
echo "========================================="
echo " Hyperledger Fabric Auto Network Startup "
echo "========================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$SCRIPT_DIR" || exit 1
export PATH="$SCRIPT_DIR/../bin:$PATH"
export FABRIC_CFG_PATH="$SCRIPT_DIR/../config/"
export DOCKER_SOCK=/var/run/docker.sock

echo "Stopping old network..."
./network.sh down || true

echo "Starting network and creating channel..."
./network.sh up createChannel -ca -s couchdb -c mychannel

echo "Adding Org3..."
cd addOrg3 || exit 1
./addOrg3.sh up -ca -c mychannel -s couchdb
cd ..

echo "Fixing certificate symlinks dynamically..."
for org in org1 org2 org3; do
  SIGNCERTS="$SCRIPT_DIR/organizations/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/signcerts"
  KEYSTORE="$SCRIPT_DIR/organizations/peerOrganizations/${org}.example.com/users/Admin@${org}.example.com/msp/keystore"
  if [ -d "$SIGNCERTS" ]; then
    ln -sf cert.pem "$SIGNCERTS/Admin@${org}.example.com-cert.pem" 2>/dev/null
  fi
  if [ -d "$KEYSTORE" ]; then
    cd "$KEYSTORE" && ln -sf $(ls | grep -v priv_sk | head -1) priv_sk 2>/dev/null
    cd "$SCRIPT_DIR" || exit 1
  fi
done

cd "$SCRIPT_DIR" || exit 1

echo "Deploying chaincode on Org1 and Org2..."
./network.sh deployCC \
  -ccn land-registration \
  -ccp "$PROJECT_ROOT/chaincode/land-registration" \
  -ccl javascript \
  -c mychannel \
  -ccv 1.0 \
  -ccs 1

echo "Installing and approving chaincode on Org3..."
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051

peer lifecycle chaincode install land-registration.tar.gz

PKGID=$(peer lifecycle chaincode queryinstalled --output json | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['installed_chaincodes'][0]['package_id'])")
echo "Org3 Package ID: $PKGID"

peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile ${PWD}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem \
  --channelID mychannel \
  --name land-registration \
  --version 1.0 \
  --package-id $PKGID \
  --sequence 1

echo "Verifying all 3 orgs approved..."
peer lifecycle chaincode querycommitted --channelID mychannel --name land-registration

echo "Re-enrolling wallet identities..."
cd "$PROJECT_ROOT/fabric-api" || exit 1
rm -f src/wallets/org1/admin.id src/wallets/org2/admin.id src/wallets/org3/admin.id
node src/org1/enrollAdmin.js
node src/org1/registerUser.js
node src/org2/enrollAdmin.js
node src/org2/registerUser.js
node src/org3/enrollAdmin.js

echo "========================================="
echo " Fabric Network Running Successfully!    "
echo "========================================="
docker ps
