#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

export FABRIC_CFG_PATH="${PROJECT_ROOT}/fabric-samples/config"

print_status() { echo -e "${GREEN}[INFO]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }
print_header() { echo -e "${BLUE}$1${NC}"; }

# Create and join channel
setup_channel() {
    print_header "Setting up channel and joining organizations..."

    # Create channel with Org1
    print_status "Creating channel with Org1..."
    source "${PROJECT_ROOT}/setorg1.sh"
    createChannel

    # Join Org1 to channel
    print_status "Org1 joining channel..."
    joinChannel
    updateAnchorPeer 2>/dev/null || true

    # Join Org2 to channel
    print_status "Org2 joining channel..."
    source "${PROJECT_ROOT}/setorg2.sh"
    joinChannel
    updateAnchorPeer 2>/dev/null || true

    # Join Org3 to channel
    print_status "Org3 joining channel..."
    source "${PROJECT_ROOT}/setorg3.sh"
    joinChannel
    updateAnchorPeer 2>/dev/null || true

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
        --label land-registration_1.0

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

    # Approve chaincode
    print_status "Approving chaincode for Org1..."
    source "${PROJECT_ROOT}/setorg1.sh"
    approveChaincode

    print_status "Approving chaincode for Org2..."
    source "${PROJECT_ROOT}/setorg2.sh"
    approveChaincode

    print_status "Approving chaincode for Org3..."
    source "${PROJECT_ROOT}/setorg3.sh"
    approveChaincode

    # Commit chaincode
    print_status "Committing chaincode to channel..."
    source "${PROJECT_ROOT}/setorg3.sh"
    commitChaincode 2>/dev/null || true

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

main() {
    print_header "Completing Network Setup..."
    setup_channel
    setup_chaincode
    register_users
    print_header "Network Setup Completed Successfully!"
    echo "You can now start the API and Client."
}

main
