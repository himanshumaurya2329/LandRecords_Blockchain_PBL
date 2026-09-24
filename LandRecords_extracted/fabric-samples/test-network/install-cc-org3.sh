#!/bin/bash
set -e

export PATH=${PWD}/../bin:$PATH
export FABRIC_CFG_PATH=${PWD}/../config

# Set env for Org3
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp
export CORE_PEER_ADDRESS=localhost:11051
export ORDERER_CA=${PWD}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

PACKAGE_FILE="land-registration.tar.gz"

echo "Installing chaincode v2.0 on Org3..."
peer lifecycle chaincode install $PACKAGE_FILE

echo "Querying installed package ID..."
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "land-registration_2.0" | awk '{print $3}' | sed 's/.$//' | tail -n 1)
echo "Package ID: $PACKAGE_ID"

echo "Approving chaincode v2.0 for Org3..."
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile $ORDERER_CA --channelID mychannel --name land-registration --version 2.0 --package-id $PACKAGE_ID --sequence 2

echo "Chaincode v2.0 installed and approved for Org3."
