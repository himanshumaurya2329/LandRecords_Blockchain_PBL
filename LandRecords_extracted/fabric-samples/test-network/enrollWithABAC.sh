#!/bin/bash

# enrollWithABAC.sh
# Comprehensive enrollment for all system users with roles

export PATH=${PWD}/../../bin:${PWD}:$PATH
export FABRIC_CFG_PATH=${PWD}

function enrollAdmin() {
  local org=$1
  local port=$2
  local domain="org$org.example.com"
  
  echo "Enrolling admin for Org$org..."
  mkdir -p organizations/peerOrganizations/$domain/users/Admin@$domain/msp
  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/$domain/users/Admin@$domain
  fabric-ca-client enroll -u https://admin:adminpw@localhost:$port --caname ca-org$org --tls.certfiles ${PWD}/organizations/fabric-ca/org$org/tls-cert.pem
}

function registerAndEnrollUser() {
  local org_num=$1
  local port=$2
  local name=$3
  local role=$4
  local domain="org${org_num}.example.com"

  echo "Registering $name (role: $role) in Org${org_num}..."
  export FABRIC_CA_CLIENT_HOME=${PWD}/organizations/peerOrganizations/$domain/users/Admin@$domain
  
  # Register using the specific TLS cert file
  fabric-ca-client register --caname ca-org${org_num} --id.name $name --id.secret ${name}pw --id.type client --id.attrs "role=$role:ecert" --tls.certfiles ${PWD}/organizations/fabric-ca/org${org_num}/tls-cert.pem || echo "User $name already registered"
  
  # Enroll
  echo "Enrolling $name..."
  mkdir -p organizations/peerOrganizations/$domain/users/$name/msp
  fabric-ca-client enroll -u https://$name:${name}pw@localhost:$port --caname ca-org${org_num} -M ${PWD}/organizations/peerOrganizations/$domain/users/$name/msp --tls.certfiles ${PWD}/organizations/fabric-ca/org${org_num}/tls-cert.pem
}

# 1. Enroll Bootstrap Admins
enrollAdmin 1 7054
enrollAdmin 2 8054
enrollAdmin 3 10054

# 2. Register/Enroll Users per mapping
# Org 1
registerAndEnrollUser 1 7054 admin-registration admin
registerAndEnrollUser 1 7054 user_portal applicant
registerAndEnrollUser 1 7054 clerk officer
registerAndEnrollUser 1 7054 superintendent officer
registerAndEnrollUser 1 7054 project_officer officer

# Org 2
registerAndEnrollUser 2 8054 admin-revenue admin
registerAndEnrollUser 2 8054 mro officer
registerAndEnrollUser 2 8054 vro officer
registerAndEnrollUser 2 8054 surveyor officer
registerAndEnrollUser 2 8054 revenue_inspector officer
registerAndEnrollUser 2 8054 revenue_dept officer

# Org 3
registerAndEnrollUser 3 10054 admin-collector admin
registerAndEnrollUser 3 10054 joint_collector collector
registerAndEnrollUser 3 10054 collector collector
registerAndEnrollUser 3 10054 mw collector
