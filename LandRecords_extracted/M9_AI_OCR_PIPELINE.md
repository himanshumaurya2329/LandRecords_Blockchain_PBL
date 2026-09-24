# Module M9: AI-Driven Document Digitization Pipeline
**Member: Gajjela Vineeth**

## Executive Summary
This module automates the transition from traditional physical land deeds to structured, blockchain-native data objects. It implements an AI-OCR microservice that utilizes Optical Character Recognition and Natural Language Processing to digitize legal documents, thereby reducing human data-entry errors and enhancing departmental efficiency.

## AI Digitization and Extraction Framework

### 1. NLP-Driven Document Parsing
The module utilizes Natural Language Processing (NLP) models to identify and extract critical land attributes from unstructured PDF deeds. Key entities such as Survey Numbers, Land Dimensions, and Owner Names are automatically parsed from complex legal text. This ensures that the digitized record accurately reflects the physical source-of-truth.

### 2. FastAPI Cross-Functional Inference Bridge
A high-performance FastAPI microservice serves as the communication bridge between the Next.js client-side application and the AI inference engine. This architecture allows for asynchronous document processing, ensuring that large property deeds are digitized without impacting the overall performance of the blockchain network.

### 3. Automated Fact Synchronization
Digitized facts extracted by the AI engine are automatically synchronized with the Hyperledger Fabric ledger. These attributes are committed as "AI-Verified" data points, providing a second layer of validation alongside manual official reviews. This ensures that the blockchain world state remains consistent with the physical documentation provided by the citizen.

### 4. Technical Performance and Confidence Metrics
To ensure the integrity of the extraction process, the system provides a confidence score for every digitized field. This allows officials to distinguish between high-confidence automated extractions and low-confidence items that require additional manual scrutiny, optimizing the administrative workflow.

### 5. Peer-to-Peer Data Pipeline Integration
The module utilizes a peer-to-peer (P2P) data channel to receive encrypted assets from the M7 security layer. Once processing is complete, the structured results are propagated across the P2P network to all departmental peers, ensuring that the digitized land facts are universally available and verified for the M8 Trust Indexer.

## Technical Validation and Verification

### Verification of AI-Extracted Data (Blockchain Proof)
Execute the following command to demonstrate the structured JSON data generated from a physical scan and stored on the ledger:
```bash
source setorg2.sh
peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-EBE11016F09F1A57"]}' | jq '.ocrData'
```

### Verification of Field Symmetry (Accuracy Check)
Execute the following command to verify the match status between the AI-extracted attributes and the original application data:
```bash
peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-EBE11016F09F1A57"]}' | jq '.ocrMatch'
```

## Technical Specifications
- AI Engine: Python-based OCR / NLP Pipeline
- API Framework: FastAPI Microservice
- Synchronization: Ledger-level Attribute Commitment
- Metrics: Probability-based Confidence Scoring
