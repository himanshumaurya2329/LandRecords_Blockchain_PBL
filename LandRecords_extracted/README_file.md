# Module M7: Institutional Privacy and Security Governance
**Member: Charita Priya (Revenue Department - Org2 Contribution)**

## Executive Summary
This module provides the cryptographic infrastructure and regulatory document verification layer for the Land Registration System. It establishes institutional security protocols that preserve citizen data privacy while ensuring immutability and verifiability through decentralized identity and distributed storage technologies.

## Revenue Department Data Governance Framework

### 1. Government-Standard DigiLocker Integration
The module implements an automated interface with the National DigiLocker API to facilitate Aadhaar-authenticated document retrieval. By utilizing government-certified sources, the Revenue Department ensures the authenticity of citizen identity and property records. This includes SHA-256 hash validation to confirm that documents remain untampered during the transition from government servers to the blockchain environment.

### 2. Administrative Data Encryption (AES-256)
A multi-layered AES-256 encryption pipeline has been implemented to protect sensitive citizen attributes, including Aadhaar identifiers and personal contact information. Encryption is performed at the departmental level (Org2) before data is committed to the blockchain world state or IPFS storage. This ensures that sensitive information remains confidential and is only accessible to authorized personnel with valid decryption keys.

### 3. Decentralized Content Archiving (IPFS)
Property deeds and survey maps are stored using the InterPlanetary File System (IPFS) to maintain a decentralized archive that is both scalable and immutable. The system anchors unique Content Identifiers (CIDs) on the Hyperledger Fabric ledger, providing a permanent and verifiable link to the off-chain assets without compromising network performance.

### 4. Attribute-Based Access Control (ABAC)
Security is further enforced through Attribute-Based Access Control (ABAC) policies. By utilizing the Fabric Contract API's Client Identity (CID) library, the smart contract restricts document access and decryption privileges to specific departmental roles, such as MROs and Surveyors, effectively preventing unauthorized cross-departmental data leaks.

### 5. Peer-to-Peer Data Pipeline Integration
The module establishes a Peer-to-Peer (P2P) communication bridge between organizational nodes. This pipeline ensures that the output of the M7 security layer (decrypted assets) is securely transferred to the M9 AI processing engine and verified by the M8 Trust Indexer, maintaining total data consistency across the departmental network.

## Technical Validation and Verification

### Verification of Data Privacy
Execute the following command to demonstrate that citizen attributes are stored as encrypted hexadecimal representations:
```bash
source setorg2.sh
peer chaincode query -C mychannel -n land-registration -c '{"function":"getAllLandRequest","Args":[]}'
```

### Verification of Decentralized Archiving
Execute the following command to retrieve the unique IPFS Content Identifier for a specific application:
```bash
peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-EBE11016F09F1A57"]}' | jq '.ipfsHash'
```

## Technical Specifications
- Blockchain: Hyperledger Fabric
- Storage: IPFS (InterPlanetary File System)
- Identity: DigiLocker API Integration
- Cryptography: AES-256 Encryption and SHA-256 Hashing
