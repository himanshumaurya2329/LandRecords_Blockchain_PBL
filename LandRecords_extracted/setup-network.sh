#!/bin/bash

# Complete Land Registration Network Setup Script
# This script sets up the entire Hyperledger Fabric network with 3 organizations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking prerequisites..."

    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker first."
        exit 1
    fi

    print_status "Prerequisites check passed."
}

# Generate crypto materials and channel artifacts
generate_artifacts() {
    print_header "Generating crypto materials and channel artifacts..."

    cd "${PROJECT_ROOT}/fabric-samples/test-network" || exit 1

    # Stop and remove any running containers and networks from old runs
    print_status "Tearing down old network..."
    docker-compose -f docker/docker-compose-full.yaml down -v 2>/dev/null || true
    docker network rm fabric_test 2>/dev/null || true

    # Set FABRIC_CFG_PATH to current directory so configtxgen finds our configtx.yaml
    export FABRIC_CFG_PATH=${PWD}

    # Generate crypto materials first
    print_status "Generating crypto materials..."
    if [ -f organizations ]; then rm -f organizations; fi
    rm -rf organizations/ordererOrganizations organizations/peerOrganizations
    cryptogen generate --config=./crypto-config.yaml --output="organizations"
    
    # Generate channel genesis block (channel participation mode - no system channel needed)
    print_status "Generating channel genesis block..."
    configtxgen -profile ThreeOrgsChannel -outputBlock ./channel-artifacts/mychannel.block -channelID mychannel

    # Generate connection profiles for the API
    if [ -f ./organizations/ccp-generate.sh ]; then
        ./organizations/ccp-generate.sh
    fi

    cd "${PROJECT_ROOT}" || exit 1
    print_status "Artifacts generated successfully."
}

# Start the network
start_network() {
    print_header "Starting the Fabric network..."

    cd "${PROJECT_ROOT}/fabric-samples/test-network" || exit 1
    docker-compose -f docker/docker-compose-full.yaml up -d

    print_status "Waiting for network to be ready..."
    sleep 15

    # Check if all containers are running
    RUNNING=$(docker ps --filter "network=fabric_test" --format "{{.Names}}" | wc -l)
    TOTAL=$(docker-compose -f docker/docker-compose-full.yaml config --services | wc -l)

    if [ "$RUNNING" -ge "$TOTAL" ]; then
        print_status "Network started successfully ($RUNNING/$TOTAL containers running)."
    else
        print_error "Some containers failed to start ($RUNNING/$TOTAL running)."
        docker ps -a --filter "network=fabric_test" --format "table {{.Names}}\t{{.Status}}"
        exit 1
    fi

    cd "${PROJECT_ROOT}" || exit 1
}

# Create and join channel
setup_channel() {
    print_header "Setting up channel and joining organizations..."

    # Orderer TLS certs for osnadmin
    ORDERER_CA="${PROJECT_ROOT}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt"
    ORDERER_ADMIN_TLS_SIGN_CERT="${PROJECT_ROOT}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.crt"
    ORDERER_ADMIN_TLS_PRIVATE_KEY="${PROJECT_ROOT}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/tls/server.key"

    # Create mychannel using osnadmin (channel participation API)
    print_status "Joining all orderers to 'mychannel'..."
    for node in 7053 8053 9053; do
        port=$node
        case $port in
            7053) host="orderer.example.com" ;;
            8053) host="orderer2.example.com" ;;
            9053) host="orderer3.example.com" ;;
        esac
        
        echo "Joining $host to mychannel via localhost:$port..."
        
        # Determine correct TLS paths for each orderer
        NODE_TLS_DIR="${PROJECT_ROOT}/fabric-samples/test-network/organizations/ordererOrganizations/example.com/orderers/$host/tls"
        
        osnadmin channel join --channelID mychannel \
            --config-block "${PROJECT_ROOT}/fabric-samples/test-network/channel-artifacts/mychannel.block" \
            -o localhost:$port \
            --ca-file "$NODE_TLS_DIR/ca.crt" \
            --client-cert "$NODE_TLS_DIR/server.crt" \
            --client-key "$NODE_TLS_DIR/server.key"
    done

    print_status "Waiting for Raft leader election (mychannel)..."
    sleep 10

    # Join Org1 to channel
    print_status "Org1 joining channel..."
    source "${PROJECT_ROOT}/setorg1.sh"
    joinChannel

    # Join Org2 to channel
    print_status "Org2 joining channel..."
    source "${PROJECT_ROOT}/setorg2.sh"
    joinChannel

    # Join Org3 to channel
    print_status "Org3 joining channel..."
    source "${PROJECT_ROOT}/setorg3.sh"
    joinChannel

    print_status "Channel setup completed."
}

# Setup chaincode
setup_chaincode() {
    print_header "Setting up chaincode..."

    # Package chaincode
    print_status "Packaging chaincode..."
    cd "${PROJECT_ROOT}/chaincode/land-registration" || exit 1
    npm install
    cd "${PROJECT_ROOT}" || exit 1

    # Create tar.gz package
    print_status "Creating chaincode package..."
    peer lifecycle chaincode package "${PROJECT_ROOT}/chaincode/land-registration.tar.gz" \
        --path "${PROJECT_ROOT}/chaincode/land-registration" \
        --lang node \
        --label land-registration_1.2

    # Install on all organizations
    print_status "Installing chaincode on Org1..."
    source "${PROJECT_ROOT}/setorg1.sh"
    installChaincode

    print_status "Installing chaincode on Org2..."
    source "${PROJECT_ROOT}/setorg2.sh"
    installChaincode

    print_status "Installing chaincode on Org3..."
    source "${PROJECT_ROOT}/setorg3.sh"
    installChaincode

    # Approve chaincode for mychannel
    print_status "Approving chaincode for mychannel..."
    local POLICY="AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')"
    source "${PROJECT_ROOT}/setorg1.sh" && approveChaincode mychannel "$POLICY"
    source "${PROJECT_ROOT}/setorg2.sh" && approveChaincode mychannel "$POLICY"
    source "${PROJECT_ROOT}/setorg3.sh" && approveChaincode mychannel "$POLICY"

    # Commit chaincode to mychannel
    print_status "Committing chaincode to mychannel..."
    source "${PROJECT_ROOT}/setorg3.sh" && commitChaincode mychannel "$POLICY" 2>/dev/null || true

    print_status "Chaincode setup completed."
}

# Register users
register_users() {
    print_header "Registering users..."

    cd "${PROJECT_ROOT}/fabric-samples/test-network" || exit 1
    if [ -f "./enroll-admins.sh" ]; then
        ./enroll-admins.sh
    fi
    cd "${PROJECT_ROOT}" || exit 1

    print_status "User registration completed."
}

# Main setup function
main() {
    print_header "=========================================="
    print_header "  Land Registration Network Setup"
    print_header "=========================================="

    check_prerequisites
    generate_artifacts
    start_network
    setup_channel
    setup_chaincode
    # register_users
    print_status "Enrolling users with ABAC attributes..."
    cd "${PROJECT_ROOT}/fabric-samples/test-network" || exit 1
    if [ -f "./enrollWithABAC.sh" ]; then
        chmod +x enrollWithABAC.sh
        ./enrollWithABAC.sh
    fi
    cd "${PROJECT_ROOT}" || exit 1

    print_header "=========================================="
    print_status "Network setup completed successfully!"
    print_header "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Start the API server: cd fabric-api && npm start"
    echo "2. Start the client: cd client && npm run dev"
    echo "3. Test the application at http://localhost:3000"
    echo ""
    print_status "Happy coding! 🚀"
}

# Run main function
main "$@"
