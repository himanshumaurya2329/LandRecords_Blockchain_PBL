'use strict';

const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');
const paths = require('../config/paths');

async function main() {
    try {
        // Load the network configuration
        const ccpPath = paths.getConnectionProfilePath('org1');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new CA client for interacting with the CA
        const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
        const ca = new FabricCAServices(caURL);

        // Create a new file system based wallet for managing identities
        const walletPath = paths.getWalletPath('org1');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the admin user
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // Register and enroll users for Org1
        const users = ['user_portal', 'clerk', 'superintendent', 'project_officer'];

        for (const userId of users) {
            // Check if user already exists
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                console.log(`An identity for the user "${userId}" already exists in the wallet`);
                continue;
            }

            // Register the user, enroll the user, and import the new identity into the wallet
            const secret = await ca.register({
                affiliation: 'org1.department1',
                enrollmentID: userId,
                role: 'client'
            }, adminUser);

            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };

            await wallet.put(userId, x509Identity);
            console.log(`Successfully registered and enrolled user "${userId}" and imported it into the wallet`);
        }

    } catch (error) {
        console.error(`Failed to register users: ${error}`);
        process.exit(1);
    }
}

main();