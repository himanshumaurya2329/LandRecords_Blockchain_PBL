# Module M8: Advanced Blockchain Trust Indexer
**Member: Indrasenna**

## Executive Summary
This module introduces an automated Trust Scrutiny layer to the land registration lifecycle. It replaces traditional manual verification with a mathematical Trust Indexing model, which calculates a real-time integrity score for every property application based on blockchain telemetry and cross-organizational endorsement data.

## Trust Indexing and Fraud Detection Framework

### 1. Mathematical Trust Indexing Algorithm
The module implements a composite weighted scoring model to evaluate the reliability of property applications. The algorithm aggregates data from three primary dimensions:
- Integrity: Verification of the match status between the Ledger and decentralized IPFS storage.
- Veracity: Assessment of the document's verification history by Registration and Revenue officials.
- Symmetry: Calculation of the match percentage between AI-extracted attributes and user-provided input.
The resulting score represents a quantifiable measure of confidence in the application's overall validity.

### 2. Automated Fraud Detection Engine
An automated Integrity Guard has been developed to monitor for data discrepancies. If the system detects a hash mismatch between the current off-chain document and the original on-chain cryptographic anchor, the application is immediately flagged for review. This prevents departmental officials from processing potentially fraudulent applications.

### 3. Multi-Signature Endorsement Verification
The module tracks the Peer-to-Peer propagation of cryptographic signatures from the Registration (Org1) and Revenue (Org2) departments. By utilizing the endorsement policies of Hyperledger Fabric, the Trust Indexer provides transparency into which organizations have formally approved the record, ensuring departmental accountability and preventing unilateral actions.

### 4. Peer-to-Peer Data Pipeline Integration
The module utilizes the decentralized cross-checking capabilities of the P2P network to verify the Trust Index across Registration, Revenue, and Collectorate nodes. The score is only finalized once the P2P synchronization of administrative endorsements is achieved, ensuring consensus on the integrity of the record.

## Technical Validation and Verification

### Verification of the Mathematical Trust Index
Execute the following command to demonstrate the automated trust score generation for an application:
```bash
source setorg2.sh
peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-EBE11016F09F1A57"]}' | jq '.trustScore'
```

### Verification of Automated Fraud Detection
Execute the following command to retrieve the detailed trust analysis report and integrity guard flags:
```bash
peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-EBE11016F09F1A57"]}' | jq '.trustDetails'
```

## Technical Specifications
- Algorithm Type: Weighted Composite Scoring
- Environment: Hyperledger Fabric Multi-Org Network
- Integrity Check: SHA-256 Hash Matching
- Report Format: Structured JSON-based Trust Analytics
