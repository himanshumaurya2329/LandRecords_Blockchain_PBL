#!/bin/bash

# Test script for Land Registration Network
# This script verifies that the network is working correctly

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PROJECT_ROOT="${PROJECT_ROOT:-$SCRIPT_DIR}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}$1${NC}"
}

# Test 1: Check if network is running
test_network_status() {
    print_header "Testing Network Status..."

    cd "${PROJECT_ROOT}/fabric-samples/test-network" || exit 1

    RUNNING=$(docker-compose -f docker/docker-compose-full.yaml ps 2>/dev/null | grep "Up" | wc -l)
    TOTAL=$(docker-compose -f docker/docker-compose-full.yaml config --services 2>/dev/null | wc -l)

    if [ "$RUNNING" -gt 0 ]; then
        print_status "Network is running: $RUNNING containers up"
        return 0
    else
        print_error "Network issues: $RUNNING/$TOTAL containers running"
        return 1
    fi
}

# Test 2: Check channel
test_channel() {
    print_header "Testing Channel..."

    source "${PROJECT_ROOT}/setorg1.sh"

    if peer channel list 2>/dev/null | grep -q "mychannel"; then
        print_status "Channel 'mychannel' exists"
        return 0
    else
        print_error "Channel 'mychannel' not found"
        return 1
    fi
}

# Test 3: Check chaincode
test_chaincode() {
    print_header "Testing Chaincode..."

    source "${PROJECT_ROOT}/setorg1.sh"

    if peer lifecycle chaincode querycommitted --channelID mychannel --name land-registration &>/dev/null; then
        print_status "Chaincode 'land-registration' is committed"
        return 0
    else
        print_error "Chaincode 'land-registration' not committed"
        return 1
    fi
}

# Test 4: Test chaincode query
test_chaincode_query() {
    print_header "Testing Chaincode Query..."

    source "${PROJECT_ROOT}/setorg1.sh"

    RESULT=$(peer chaincode query -C mychannel -n land-registration -c '{"function":"getAllLandRequest","Args":[]}' 2>/dev/null)

    if [ $? -eq 0 ]; then
        print_status "Chaincode query successful"
        echo "Result: $RESULT"
        return 0
    else
        print_error "Chaincode query failed"
        return 1
    fi
}

# Test 5: Check API server
test_api_server() {
    print_header "Testing API Server..."

    if curl -s http://localhost:3001/health | grep -q "OK"; then
        print_status "API server is responding"
        return 0
    else
        print_error "API server not responding (Start with: cd fabric-api && npm start)"
        return 1
    fi
}

# Main test function
main() {
    print_header "=========================================="
    print_header "  Land Registration Network Test Suite"
    print_header "=========================================="

    local tests_passed=0
    local total_tests=5

    # Run all tests
    if test_network_status; then ((tests_passed++)); fi
    if test_channel; then ((tests_passed++)); fi
    if test_chaincode; then ((tests_passed++)); fi
    if test_chaincode_query; then ((tests_passed++)); fi
    if test_api_server; then ((tests_passed++)); fi

    echo ""
    print_header "=========================================="
    if [ $tests_passed -eq $total_tests ]; then
        print_status "All tests passed! ($tests_passed/$total_tests)"
        print_status "Network is ready for land registration operations! 🎉"
    else
        print_error "Some tests failed: $tests_passed/$total_tests passed"
        print_error "Please check the setup and try again."
        exit 1
    fi
    print_header "=========================================="
}

# Run tests
main "$@"