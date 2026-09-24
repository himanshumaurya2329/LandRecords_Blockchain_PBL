# Land Registration System - Blockchain Integration

This project implements a complete Hyperledger Fabric blockchain solution for land registration with a 3-organization network architecture.

## 🚀 Quick Start

### Automated Setup (Recommended)
```bash
# Complete network setup in one command
./setup-network.sh

# Test the setup
./test-network.sh
```

### Manual Setup
See [NETWORK_SETUP.md](NETWORK_SETUP.md) for detailed manual setup instructions.

## 🏢 Network Architecture

### Organizations
- **Org1 (Registration)**: Handles initial land application registration and user management
- **Org2 (Revenue)**: Manages revenue department verification, survey reports, and land valuation
- **Org3 (Collectorate)**: Provides final approval authority and oversees the complete registration process

### Setup Scripts
- `setOrg1.sh` - Environment setup for Registration Department
- `setOrg2.sh` - Environment setup for Revenue Department
- `setOrg3.sh` - Environment setup for Collectorate Department
- `setup-network.sh` - Complete automated network setup
- `test-network.sh` - Network verification and testing

### Components

#### 1. Frontend (Next.js)
- User registration and authentication
- Official dashboards with role-based access
- Land application submission and tracking
- Document upload and viewing
- Location: `client/`

#### 2. Backend API (Express.js)
- REST API server for blockchain integration
- JWT authentication with role-based access control
- Land application management
- User enrollment and certificate management
- Location: `fabric-api/`

#### 3. Chaincode (Node.js)
- Smart contracts for land registration workflow
- Multi-step approval process
- Immutable audit trail
- Location: `chaincode/land-registration/`

#### 4. Network Configuration
- Docker-based Fabric network
- 3-organization setup with CAs, peers, and orderer
- Automated deployment scripts
- Location: `fabric-samples/test-network/`

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+
- npm or yarn

### 1. Start the Blockchain Network
```bash
cd fabric-samples/test-network
./start-network.sh
```

### 2. Deploy Chaincode
```bash
./deploy-chaincode.sh
```

### 3. Start the API Server
```bash
cd ../../fabric-api
npm install
npm start
```

### 4. Start the Frontend
```bash
cd ../client
npm install
npm run dev
```

## Workflow

1. **User Registration**: Citizens register through the web interface
2. **Application Submission**: Users submit land registration applications with documents
3. **Revenue Verification**: Revenue officials verify documents and conduct surveys
4. **Collector Approval**: Collector officials provide final approval
5. **Registration Complete**: Land registration is recorded on blockchain

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Land Applications
- `POST /api/land/create` - Create new application
- `GET /api/land/:id` - Get application details
- `GET /api/land` - Get all applications (role-based)
- `PUT /api/land/:id/verify` - Revenue verification
- `PUT /api/land/:id/survey` - Survey report update
- `PUT /api/land/:id/approve` - Collector approval

## Chaincode Functions

- `createApplication(applicationData)` - Create land application
- `verifyByRevenue(applicationId, verificationData)` - Revenue verification
- `surveyReportUpdate(applicationId, surveyData)` - Survey update
- `approveByCollector(applicationId, approvalData)` - Final approval
- `getApplication(applicationId)` - Get application
- `getAllLandRequest()` - Get all applications
- `getHistory(applicationId)` - Get application history
- `queryByStatus(status)` - Query by status

## User Roles

- **User**: Can submit and track applications
- **Clerk**: Can view and update applications
- **Superintendent**: Can verify applications
- **Revenue Inspector**: Can conduct surveys
- **MRO**: Can approve revenue-related actions
- **District Collector**: Can provide final approval

## Security Features

- **TLS Encryption**: All network communications encrypted
- **Certificate-based Authentication**: X.509 certificates for identity
- **Role-based Access Control**: Fine-grained permissions
- **Immutable Audit Trail**: All actions recorded on blockchain
- **Multi-organization Consensus**: Requires approval from multiple parties

## Development

### Project Structure
```
esb/
├── client/                 # Next.js frontend
├── fabric-api/            # Express.js API server
├── chaincode/             # Smart contracts
│   └── land-registration/
└── fabric-samples/        # Network configuration
    └── test-network/
```

### Environment Setup

1. **Clone and setup:**
   ```bash
   git clone <repository>
   cd esb
   ```

2. **Install dependencies:**
   ```bash
   # Frontend
   cd client && npm install

   # API Server
   cd ../fabric-api && npm install

   # Chaincode
   cd ../chaincode/land-registration && npm install
   ```

3. **Start development environment:**
   ```bash
   # Terminal 1: Blockchain network
   cd fabric-samples/test-network
   ./start-network.sh

   # Terminal 2: API server
   cd ../../fabric-api
   npm run dev

   # Terminal 3: Frontend
   cd ../client
   npm run dev
   ```

## Testing

### Unit Tests
```bash
# API tests
cd fabric-api
npm test

# Chaincode tests
cd ../chaincode/land-registration
npm test
```

### Integration Tests
```bash
# End-to-end workflow tests
cd fabric-api
npm run test:e2e
```

## Deployment

### Production Setup
1. Configure production Docker registry
2. Update connection profiles with production endpoints
3. Deploy network to Kubernetes or cloud
4. Configure load balancers and monitoring
5. Set up backup and disaster recovery

### Monitoring
- Container health checks
- Blockchain network monitoring
- API performance metrics
- Audit log analysis

## Troubleshooting

### Common Issues

1. **Network won't start**: Check Docker resources and ports
2. **Chaincode deployment fails**: Verify network is running
3. **API connection errors**: Check connection profiles
4. **Certificate issues**: Regenerate crypto material

### Logs
```bash
# Network logs
cd fabric-samples/test-network
docker-compose -f docker/docker-compose-full.yaml logs -f

# API logs
cd ../../fabric-api
npm run logs

# Frontend logs
cd ../client
npm run build  # Check for build errors
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

## License

This project is licensed under the Apache 2.0 License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the README files in each component
- Open an issue in the repository