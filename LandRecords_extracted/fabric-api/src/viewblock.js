'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const paths = require('./config/paths');

async function main() {
    try {
        // Load the network configuration
        const ccpPath = paths.getConnectionProfilePath('org1');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Use dynamically resolved admin credentials
        const certPath = paths.getAdminCertPath('org1');
        const keyPath = paths.getAdminKeyPath('org1');
        const mspPath = paths.getAdminMspPath('org1');
        const tlsCertPath = path.join(mspPath, 'tlscacerts', 'tlsca.org1.example.com-cert.pem');

        const cert = fs.readFileSync(certPath).toString();
        const key = fs.readFileSync(keyPath).toString();
        const tlsCert = fs.readFileSync(tlsCertPath).toString();

        const identity = {
            credentials: {
                certificate: cert,
                privateKey: key,
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            identity: identity,
            discovery: { enabled: false, asLocalhost: true },
            eventHandlerOptions: {
                commitTimeout: 100,
                endorseTimeout: 30,
            },
            queryHandlerOptions: {
                timeout: 60,
            }
        });

        // Get the network (channel) our contract is deployed to
        console.log('Connecting to network...');
        const network = await gateway.getNetwork('mychannel');
        console.log('Successfully connected to network');

        // Get the contract from the network
        console.log('Getting contract...');
        const contract = network.getContract('land-registration');
        console.log('Successfully got contract');

        // Try a simple test first - check if we can get channel info
        console.log('Testing basic channel connectivity...');
        try {
            const channel = network.getChannel();
            console.log(`Channel name: ${channel.getName()}`);
            console.log('Basic connectivity test passed!');
        } catch (error) {
            console.log('Basic connectivity test failed:', error.message);
        }

        console.log('\n=== Blockchain Information ===');

        // Get all land applications
        console.log('\n=== All Land Applications ===');
        console.log('Querying chaincode...');
        
        // Try basic query
        try {
            const result = await contract.evaluateTransaction('getAllLandRequest');
            console.log('Query successful!');
            const applications = JSON.parse(result.toString());
            
            console.log(`Found ${applications.length} land applications:`);
            applications.forEach((app, index) => {
                console.log(`${index + 1}. ID: ${app.id}, Status: ${app.status}, Owner: ${app.ownerName || 'N/A'}`);
            });

            if (applications && applications.length > 0) {
                applications.forEach((app, index) => {
                    console.log(`\nApplication ${index + 1}:`);
                    console.log(`  ID: ${app.Record.applicationId}`);
                    console.log(`  Status: ${app.Record.status}`);
                    console.log(`  Applicant: ${app.Record.userData?.applicantName || 'N/A'}`);
                    console.log(`  Created: ${new Date(parseInt(app.Record.createdAt)).toLocaleString()}`);
                    if (app.Record.history && app.Record.history.length > 0) {
                        console.log(`  Last Action: ${app.Record.history[app.Record.history.length - 1].action}`);
                        console.log(`  Last Officer: ${app.Record.history[app.Record.history.length - 1].officer}`);
                    }
                });
            } else {
                console.log('No applications found on blockchain');
            }

            // Get blockchain statistics
            console.log('\n=== Blockchain Statistics ===');
            console.log(`Total Applications: ${applications ? applications.length : 0}`);
        } catch (error) {
            console.error('Chaincode query failed:', error.message);
            console.log('Trying alternative approach...');
            
            // Try with different function name
            try {
                const altResult = await contract.evaluateTransaction('queryAllLandRequests');
                console.log('Alternative query successful!');
                console.log('Result:', altResult.toString());
            } catch (altError) {
                console.error('Alternative query also failed:', altError.message);
            }
        }

        // Disconnect from the gateway
        await gateway.disconnect();

    } catch (error) {
        console.error(`Failed to view blockchain: ${error}`);
        process.exit(1);
    }
}

main();