#!/bin/bash
set -e

echo "================================================="
echo "   Testing Land Registration Chaincode"
echo "================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"

export FABRIC_CFG_PATH="${PROJECT_ROOT}/fabric-samples/test-network/docker/peercfg"
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
export PEER0_ORG1_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export PEER0_ORG2_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
export PEER0_ORG3_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt"

export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
export CORE_PEER_MSPCONFIGPATH="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051

echo "-> Initializing Ledger..."
peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile $ORDERER_CA \
    -C mychannel -n land-registration \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
    --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
    -c '{"function":"initLedger","Args":[]}'

sleep 5 # Wait for block to commit

echo ""
echo "-> Creating Application (APP-001) using Transient Data..."

# Create a JSON object for user data, then base64 encode it for the transient map
USER_DATA='{"applicantName":"Alice Smith","propertyId":"PROP998877","address":"123 Blockchain Ave","area":"500 sqft"}'
USER_DATA_B64=$(echo -n $USER_DATA | base64 -w 0)
TRANSIENT_DATA="{\"userData\":\"$USER_DATA_B64\"}"

peer chaincode invoke \
    -o localhost:7050 \
    --ordererTLSHostnameOverride orderer.example.com \
    --tls --cafile $ORDERER_CA \
    -C mychannel -n land-registration \
    --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA \
    --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA \
    --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA \
    -c '{"function":"createApplication","Args":["APP-001"]}' \
    --transient "$TRANSIENT_DATA"

sleep 3

echo ""
echo "-> Querying Application APP-001..."
peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-001"]}'

echo ""
echo "-> Testing completed successfully!"
