#!/bash
#!/bin/bash

# Generate channel artifacts for the land registration network
# This script creates the necessary channel configuration files

echo "Generating channel artifacts..."

# Set the path to the test-network directory
TEST_NETWORK_DIR="${PWD}/fabric-samples/test-network"

# Create channel-artifacts directory if it doesn't exist
mkdir -p "${TEST_NETWORK_DIR}/channel-artifacts"

cd "$TEST_NETWORK_DIR"

# Clean up stale crypto to prevent cert mismatch
rm -rf organizations/ordererOrganizations organizations/peerOrganizations

# Set FABRIC_CFG_PATH to current directory so configtxgen finds our configtx.yaml
export FABRIC_CFG_PATH=${PWD}

# Generate channel genesis block (channel participation mode)
echo "Generating mychannel genesis block..."
configtxgen -profile ThreeOrgsChannel -outputBlock ./channel-artifacts/mychannel.block -channelID mychannel

# Reset FABRIC_CFG_PATH for peer CLI
export FABRIC_CFG_PATH=${PWD}/docker/peercfg

echo "Channel artifact generated successfully!"
echo "File created:"
echo "  - channel-artifacts/mychannel.block"