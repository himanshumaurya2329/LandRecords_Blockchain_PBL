#!/bin/bash
# Stop Land Records Hyperledger Fabric Network & Fabric API

echo "========================================="
echo " Stopping E-Land Records Network Services"
echo "========================================="

# 1. Stop Fabric API background process if running
echo "1. Stopping fabric-api process..."
pkill -f "node index.js" 2>/dev/null || true

# 2. Stop all Hyperledger Fabric containers (keeps ledger data safe)
echo "2. Stopping Fabric Docker containers..."
docker stop \
  peer0.org1.example.com \
  peer0.org2.example.com \
  peer0.org3.example.com \
  orderer.example.com \
  couchdb0 couchdb1 couchdb4 \
  ca_org1 ca_org2 ca_org3 ca_orderer \
  $(docker ps -q --filter "name=dev-peer") 2>/dev/null || true

# Check if any fabric container is still running
RUNNING=$(docker ps --filter "name=peer" --filter "name=orderer" --filter "name=couchdb" --filter "name=ca_" -q)
if [ -z "$RUNNING" ]; then
  echo "✅ All Fabric containers successfully stopped."
else
  echo "⚠️ Force stopping remaining Fabric containers..."
  docker stop $RUNNING 2>/dev/null || true
fi

echo "========================================="
echo "✅ Network is stopped! Data & ledger are preserved."
echo "   To start again later, run: ./start-only.sh"
echo "========================================="
