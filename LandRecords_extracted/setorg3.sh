#!/bin/bash

# Set environment for Org3 (Collectorate Department)
# This script sets up the environment variables for Org3 operations

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"

export FABRIC_CFG_PATH="${PROJECT_ROOT}/fabric-samples/test-network/docker/peercfg"
export CORE_PEER_TLS_ENABLED=true
export ORDERER_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
export PEER0_ORG1_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export PEER0_ORG2_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt"
export PEER0_ORG3_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/peers/peer0.org3.example.com/tls/ca.crt"

# Set Org3 specific environment
export CORE_PEER_LOCALMSPID="Org3MSP"
export CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
export CORE_PEER_MSPCONFIGPATH="${PROJECT_ROOT}/fabric-samples/test-network/organizations/peerOrganizations/org3.example.com/users/Admin@org3.example.com/msp"
export CORE_PEER_ADDRESS=localhost:11051

echo "Environment set for Org3 (Collectorate Department)"
echo "CORE_PEER_ADDRESS: $CORE_PEER_ADDRESS"
echo "CORE_PEER_LOCALMSPID: $CORE_PEER_LOCALMSPID"

# Channel operations for Org3
joinChannel() {
    echo "Org3 joining channel 'mychannel'..."
    peer channel join -b "${PROJECT_ROOT}/fabric-samples/test-network/channel-artifacts/mychannel.block"
}


installChaincode() {
    echo "Installing chaincode on Org3 peer..."
    peer lifecycle chaincode install "${PROJECT_ROOT}/chaincode/land-registration.tar.gz"
}

approveChaincode() {
    local CHANNEL_ID=${1:-mychannel}
    local POLICY=${2:-"AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')"}
    echo "Approving chaincode for Org3 on channel '$CHANNEL_ID' with policy '$POLICY'..."
    CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "land-registration" | awk '{print $3}' | sed 's/.$//')

    peer lifecycle chaincode approveformyorg \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        --channelID $CHANNEL_ID \
        --name land-registration \
        --version 1.0 \
        --package-id $CC_PACKAGE_ID \
        --sequence 1 \
        --signature-policy "$POLICY"
}

commitChaincode() {
    local CHANNEL_ID=${1:-mychannel}
    local POLICY=${2:-"AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')"}
    echo "Committing chaincode to channel '$CHANNEL_ID' with policy '$POLICY'..."
    CC_PACKAGE_ID=$(peer lifecycle chaincode queryinstalled | grep "land-registration" | awk '{print $3}' | sed 's/.$//')

    local PEER_ARGS="--peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_CA --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_CA --peerAddresses localhost:11051 --tlsRootCertFiles $PEER0_ORG3_CA"

    peer lifecycle chaincode commit \
        -o localhost:7050 \
        --ordererTLSHostnameOverride orderer.example.com \
        --tls $CORE_PEER_TLS_ENABLED \
        --cafile $ORDERER_CA \
        --channelID $CHANNEL_ID \
        --name land-registration \
        --version 1.0 \
        --sequence 1 \
        --signature-policy "$POLICY" \
        $PEER_ARGS
}

# Display available commands
echo ""
echo "Available commands:"
echo "  joinChannel       - Join Org3 to the channel"
echo "  updateAnchorPeer  - Update anchor peer"
echo "  installChaincode  - Install chaincode"
echo "  approveChaincode  - Approve chaincode for Org3"
echo "  commitChaincode   - Commit chaincode to channel (run from Org3)"
echo ""
echo "Usage: source setOrg3.sh && joinChannel"