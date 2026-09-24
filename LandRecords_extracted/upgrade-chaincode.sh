#!/bin/bash
# Script to upgrade chaincode to v1.1 (Sequence 2)
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"

cd "$PROJECT_ROOT" || exit 1

echo "📦 Packaging chaincode v1.1..."
peer lifecycle chaincode package "${PROJECT_ROOT}/land-registration_1.1.tar.gz" --path "${PROJECT_ROOT}/chaincode/land-registration" --lang node --label land_registration_1.1

## ORG 1
echo "🏢 Installing on Org1..."
source "${PROJECT_ROOT}/setorg1.sh"
peer lifecycle chaincode install "${PROJECT_ROOT}/land-registration_1.1.tar.gz" || echo "⚠️ Already installed on Org1"
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "land_registration_1.1" | awk -F'[, ]+' '{print $3}')
echo "✅ Package ID: $PACKAGE_ID"
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" --channelID mychannel --name land-registration --version 1.1 --package-id "$PACKAGE_ID" --sequence 2 --signature-policy "AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')"

## ORG 2
echo "🏢 Installing on Org2..."
source "${PROJECT_ROOT}/setorg2.sh"
peer lifecycle chaincode install "${PROJECT_ROOT}/land-registration_1.1.tar.gz" || echo "⚠️ Already installed on Org2"
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" --channelID mychannel --name land-registration --version 1.1 --package-id "$PACKAGE_ID" --sequence 2 --signature-policy "AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')"

## ORG 3
echo "🏢 Installing on Org3..."
source "${PROJECT_ROOT}/setorg3.sh"
peer lifecycle chaincode install "${PROJECT_ROOT}/land-registration_1.1.tar.gz" || echo "⚠️ Already installed on Org3"
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" --channelID mychannel --name land-registration --version 1.1 --package-id "$PACKAGE_ID" --sequence 2 --signature-policy "AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')"

## COMMIT
echo "🚀 Committing v1.1 to channel..."
source "${PROJECT_ROOT}/setorg1.sh"
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" --channelID mychannel --name land-registration --version 1.1 --sequence 2 --signature-policy "AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')" --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" --peerAddresses localhost:11051 --tlsRootCertFiles "$PEER0_ORG3_CA"

echo "🏁 Chaincode upgrade to v1.1 completed!"
