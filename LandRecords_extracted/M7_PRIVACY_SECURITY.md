# Individual Contribution: Module M7
**Member: Charita Priya | Organization 2 (Revenue Department)**

---

## Videos Submitted in This Zip

The following two videos are included directly in this submission zip:

1. **individual_contribution.webm**
   - Live terminal demonstration of my blockchain proof commands on the shared ledger.
   - Shows encrypted data on the blockchain, IPFS hash anchoring, and the endorsement policy.

2. **Digilocker_part.webm**
   - Shows the DigiLocker authentication flow from my Org2 perspective.
3. **Org2-m7.webm**
   - Shows individual role in organization2.

---

## Before P2P




| Video | Work Demonstrated |
| :--- | :--- |
| digilocker.webm | Complete DigiLocker API integration |
| digilocker_clerkreq_to_user.webm | Clerk-side document request flow |
| digilocker_user_accpeting_Clerkreq.webm | User accepting the DigiLocker request |
| digilocker_user_acceptsreq_showninclerk.webm | Confirmation shown in clerk dashboard |
| officiallogin.webm | ABAC role-based official login |
| user_login.webm | Citizen login and application submission |
| DID.webm | Decentralized Identity implementation (done before P2P, not part of final group integration) |
| dual_channel.webm | Multi-channel isolation setup (done before P2P, not part of final group integration) |

Note: DID and dual_channel were explored independently before the P2P phase. The final group integration focused on the Org2 P2P workflow without these modules.

---

## Individual Technical Contributions

### 1. AES-256 Data Encryption
Implemented cryptographic protection for all sensitive citizen data (Aadhaar, Phone) before storage on the blockchain. Even other authenticated network participants cannot read raw personal data.

### 2. DigiLocker Integration
Developed the Aadhaar-authenticated document retrieval handshake between the National DigiLocker API and the Fabric network, ensuring government-certified document authenticity.

### 3. IPFS Decentralized Document Storage
Designed the system that stores property deeds on IPFS and anchors the Content Identifier permanently on the blockchain for tamper-proof archiving.

### 4. Attribute-Based Access Control (ABAC)
Enforced departmental access boundaries using X.509 certificate attributes, restricting data access to authorized Org2 personnel only.

### 5. Peer-to-Peer Security Gateway (After P2P Integration)
After connecting with M8 and M9 across 3 physical systems using Tailscale VPN, my encryption layer became the foundational security gateway for the entire Org2 P2P pipeline.

---

## Live Blockchain Proof Commands

### Proof 1: Encryption Code Authorship
```bash
grep -n "encryptData\|decryptData\|recordDocumentIntegrity" \
  chaincode/land-registration/lib/land-registration-contract.js
```

### Proof 2: Live IPFS Hash on Blockchain
```bash
source setorg2.sh
peer chaincode query -C mychannel -n land-registration \
  -c '{"function":"getApplication","Args":["APP-EBE11016F09F1A57"]}' \
  | jq '{ipfsHash: .userData.ipfsHash}'
```

### Proof 3: Endorsement Policy
```bash
peer lifecycle chaincode querycommitted -C mychannel --name land-registration
```
Expected: Approvals: [Org1MSP: true, Org2MSP: true, Org3MSP: true]
