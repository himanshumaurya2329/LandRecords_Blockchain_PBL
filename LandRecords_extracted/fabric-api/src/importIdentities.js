'use strict';

const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const { userOrgMap } = require('./userOrgMap');
const paths = require('./config/paths');

async function main() {
    try {
        console.log('Starting identity import process...');

        const testNetworkPath = paths.TEST_NETWORK_PATH;
        const walletsPath = paths.getAllWalletsPath();

        const orgs = ['org1', 'org2', 'org3'];

        for (const [username, org] of Object.entries(userOrgMap)) {
            console.log(`Processing user: ${username} for ${org}`);

            const domain = `${org}.example.com`;
            const walletPath = path.join(walletsPath, org);
            const wallet = await Wallets.newFileSystemWallet(walletPath);

            // Path for CA identity (preferred for ABAC)
            const caMspPath = path.join(testNetworkPath, 'organizations', 'peerOrganizations', domain, 'users', username, 'msp');

            let certPath, keyPath;
            if (fs.existsSync(caMspPath)) {
                certPath = path.join(caMspPath, 'signcerts', 'cert.pem');
                const keystorePath = path.join(caMspPath, 'keystore');
                const keyFiles = fs.readdirSync(keystorePath);
                keyPath = path.join(keystorePath, keyFiles[0]);
            } else {
                // Fallback to Admin@org/User1@org
                const cryptogenUser = username.startsWith('admin-') ? `Admin@${domain}` : `User1@${domain}`;
                const mspPath = path.join(testNetworkPath, 'organizations', 'peerOrganizations', domain, 'users', cryptogenUser, 'msp');
                certPath = path.join(mspPath, 'signcerts', `${cryptogenUser}-cert.pem`);
                const keystorePath = path.join(mspPath, 'keystore');
                const keyFiles = fs.readdirSync(keystorePath);
                keyPath = path.join(keystorePath, keyFiles[0]);
            }

            if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
                console.error(`Crypto files not found for ${username}. Skipping.`);
                continue;
            }

            const cert = fs.readFileSync(certPath).toString();
            const key = fs.readFileSync(keyPath).toString();

            const identity = {
                credentials: { certificate: cert, privateKey: key },
                mspId: org.charAt(0).toUpperCase() + org.slice(1) + 'MSP',
                type: 'X.509',
            };

            await wallet.put(username, identity);
            console.log(`Successfully imported identity for ${username} into wallet`);
        }

        console.log('Identity import completed successfully.');

    } catch (error) {
        console.error('Error importing identities:', error);
        process.exit(1);
    }
}

main();
