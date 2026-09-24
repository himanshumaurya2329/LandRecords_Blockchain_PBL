# Land Registration Blockchain Setup Guide

This guide provides step-by-step instructions for setting up the complete Hyperledger Fabric network for the Land Registration System.

## 🚀 Quick Setup (Recommended)

Run the automated setup script:

```bash
./setup-network.sh
```

This script will:
- Check prerequisites
- Generate crypto materials and channel artifacts
- Start the network
- Create and join channel
- Install and deploy chaincode
- Register users

## 📋 Manual Setup Steps

If you prefer manual setup, follow these steps:

### 1. Prerequisites Check

```bash
# Check Docker and Docker Compose
docker --version
docker-compose --version
docker info
```

### 2. Generate Artifacts

```bash
./generate-artifacts.sh
```

### 3. Start Network

```bash
cd fabric-samples/test-network
./start-network.sh
cd ../..
```

### 4. Setup Channel

```bash
# Create channel with Org1
source setOrg1.sh
createChannel
joinChannel
updateAnchorPeer

# Join Org2
source setOrg2.sh
joinChannel
updateAnchorPeer

# Join Org3
source setOrg3.sh
joinChannel
updateAnchorPeer
```

### 5. Deploy Chaincode

```bash
cd fabric-samples/test-network
./deploy-chaincode.sh
cd ../..
```

### 6. Register Users

```bash
cd fabric-samples/test-network
./enroll-admins.sh
cd ../..
```

## 🏢 Organization Scripts

### setOrg1.sh - Registration Department
```bash
source setOrg1.sh

# Available commands:
createChannel      # Create the channel
joinChannel        # Join Org1 to channel
updateAnchorPeer   # Update anchor peer
installChaincode   # Install chaincode
approveChaincode   # Approve chaincode
```

### setOrg2.sh - Revenue Department
```bash
source setOrg2.sh

# Available commands:
joinChannel        # Join Org2 to channel
updateAnchorPeer   # Update anchor peer
installChaincode   # Install chaincode
approveChaincode   # Approve chaincode
```

### setOrg3.sh - Collectorate Department
```bash
source setOrg3.sh

# Available commands:
joinChannel        # Join Org3 to channel
updateAnchorPeer   # Update anchor peer
installChaincode   # Install chaincode
approveChaincode   # Approve chaincode
commitChaincode    # Commit chaincode to channel
```

## 🔧 Environment Variables

Each organization script sets the following environment variables:

- `CORE_PEER_TLS_ENABLED=true`
- `CORE_PEER_LOCALMSPID` - Organization MSP ID
- `CORE_PEER_ADDRESS` - Peer address
- `CORE_PEER_TLS_ROOTCERT_FILE` - TLS certificate path
- `CORE_PEER_MSPCONFIGPATH` - Admin MSP path

## 📁 Directory Structure

```
esb/
├── setOrg1.sh              # Org1 environment setup
├── setOrg2.sh              # Org2 environment setup
├── setOrg3.sh              # Org3 environment setup
├── generate-artifacts.sh   # Generate crypto/channel artifacts
├── setup-network.sh        # Complete automated setup
├── fabric-samples/
│   └── test-network/
│       ├── organizations/  # Crypto materials
│       ├── channel-artifacts/  # Channel configs
│       └── docker/         # Docker compose files
├── chaincode/
│   └── land-registration/  # Smart contracts
└── fabric-api/             # REST API server
```

## 🧪 Testing the Setup

### Test Chaincode
```bash
# Set Org1 environment
source setOrg1.sh

# Query all land applications
peer chaincode query -C mychannel -n land-registration -c '{"function":"getAllLandRequest","Args":[]}'
```

### Test API Server
```bash
# Start API server
cd fabric-api
npm start

# Test health endpoint
curl http://localhost:3001/health
```

### Test Client Application
```bash
# Start client
cd client
npm run dev

# Open http://localhost:3000
```

## 🔍 Troubleshooting

### Network Issues
```bash
# Check container status
cd fabric-samples/test-network
docker-compose -f docker/docker-compose-full.yaml ps

# View logs
docker-compose -f docker/docker-compose-full.yaml logs -f

# Restart network
./stop-network.sh clean
./start-network.sh
```

### Chaincode Issues
```bash
# Check chaincode status
source setOrg1.sh
peer lifecycle chaincode querycommitted --channelID mychannel --name land-registration

# Reinstall chaincode
source setOrg1.sh
installChaincode
approveChaincode
```

### Permission Issues
```bash
# Fix script permissions
chmod +x *.sh
chmod +x fabric-samples/test-network/*.sh
```

## 📊 Network Architecture

- **Org1 (Registration)**: Initial application registration
- **Org2 (Revenue)**: Verification and survey reports
- **Org3 (Collectorate)**: Final approval authority

All organizations participate in consensus with multi-signature policies.

## 🔐 Security Features

- TLS encryption for all communications
- X.509 certificate-based authentication
- Multi-organization endorsement policies
- Private data collections for sensitive information

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review container logs
3. Verify environment variables are set correctly
4. Ensure all prerequisites are installed

## 🎯 Next Steps

After setup completion:
1. Start the API server (`cd fabric-api && npm start`)
2. Start the client application (`cd client && npm run dev`)
3. Begin testing land registration workflows
4. Monitor network performance and logs