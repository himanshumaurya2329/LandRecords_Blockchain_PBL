# 📜 Land Registration Blockchain: Final Project Guide

This document provides the complete technical manual for starting, running, and verifying the **M7, M8, and M9** security modules of the Land Registration platform.

---

## 🚀 Phase 1: Startup Sequence (Run in Order)

### 1. The Blockchain Network (Foundation)
In your main terminal (`~/elandrecords`):
```bash
# Clean up old containers
docker stop $(docker ps -aq) && docker rm $(docker ps -aq) && docker volume prune -f

# Start the 3-Org network (Org1, Org2, Org3)
./setup-network.sh

# Enroll Administrative Identities
./enroll-admins.sh
```

### 2. The Fabric API (The Bridge)
In a **new terminal**:
```bash
cd fabric-api
npm start
```
*Purpose: Handles encryption (M7) and signs transactions as various officials.*

### 3. The Frontend (The UI)
In a **third terminal**:
```bash
cd client
npm run dev
```
*URL: http://localhost:3000*

---

## 🛡️ Phase 2: Security Verification (M7, M8, M9)

> [!TIP]
> Always run `source setorg1.sh` before running any `peer` commands below.

### **M7: Privacy & ABAC (Security Governance)**
*   **Encrypted Ledger**: Verify that Aadhaar/Phone are hidden in hex blocks.
    ```bash
    peer chaincode query -C mychannel -n land-registration -c '{"function":"getAllLandRequest","Args":[]}'
    ```
*   **ABAC Rejection**: Prove that a **Collector** cannot touch a **Surveyor's** file.
    *(Replace APP-ID with your real receipt number)*
    ```bash
    peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.example.com --tls --cafile "$ORDERER_CA" -C mychannel -n land-registration --peerAddresses localhost:7051 --tlsRootCertFiles "$PEER0_ORG1_CA" --peerAddresses localhost:9051 --tlsRootCertFiles "$PEER0_ORG2_CA" --peerAddresses localhost:11051 --tlsRootCertFiles "$PEER0_ORG3_CA" -c '{"function":"forwardApplication","Args":["APP-ID", "{\"userRole\":\"collector\"}"]}'
    ```

### **M8: Multi-Signature Endorsement Policy**
*   **Policy Proof**: Show the `AND` rule that binds all 3 Orgs together.
    ```bash
    peer lifecycle chaincode querycommitted -C mychannel --name land-registration
    ```
    *Look for: `Endorsement: AND('Org1MSP.member', 'Org2MSP.member', 'Org3MSP.member')`*

### **M9: AI / OCR Trust Analysis**
*   **Trust Data Proof**: Show the AI extraction results stored on the ledger.
    ```bash
    peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-ID"]}' | jq '.trustScore, .ocrData'
    ```
*   **Match Result**: Verify the AI confirmed the document authenticity.
    ```bash
    peer chaincode query -C mychannel -n land-registration -c '{"function":"getApplication","Args":["APP-ID"]}' | jq '.ocrMatch'
    ```

---

## 🛠️ Phase 3: Emergency Utility Scripts
Run these if you encounter data sync or login issues during a demo:

| Script | Command (from `client` dir) | Usage |
| :--- | :--- | :--- |
| **Fix Credentials** | `node fix-credentials.js` | Resets all official passwords to `username123`. |
| **Sync DB Status** | `node sync-status.js` | Syncs MongoDB with Blockchain if status is "stuck". |
| **Create Admin** | `node create-admin.js` | Creates the master `admin@nitw.ac.in` account. |

---

## 🎓 Summary for Presentation
*   **M7**: Uses **AES-256** encryption for data privacy and **ABAC** for role-based security.
*   **M8**: Uses a **Multi-Signature** policy to prevent any single department from acting alone.
*   **M9**: Uses **AI Vision (OCR)** to automatically verify physical documents against blockchain data.

**Your project is now fully validated and secured.** 🚀🏁🛡️⚖️
