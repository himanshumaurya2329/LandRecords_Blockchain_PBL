'use strict';

const path = require('path');
const fs = require('fs');
const appRoot = require('app-root-path');

// Ensure dotenv is loaded
try {
    require('dotenv').config({ path: path.join(appRoot.path, '.env') });
} catch (e) {
    // Ignore if dotenv is not available
}

// Dynamically resolve roots
const API_ROOT = appRoot.path;
const PROJECT_ROOT = process.env.PROJECT_ROOT || path.resolve(API_ROOT, '..');
const FABRIC_SAMPLES_PATH = process.env.FABRIC_SAMPLES_PATH || path.join(PROJECT_ROOT, 'fabric-samples');
const TEST_NETWORK_PATH = process.env.FABRIC_NETWORK_PATH || path.join(FABRIC_SAMPLES_PATH, 'test-network');
const ORGANIZATIONS_PATH = path.join(TEST_NETWORK_PATH, 'organizations');
const PEER_ORGS_PATH = path.join(ORGANIZATIONS_PATH, 'peerOrganizations');

/**
 * Dynamic path resolvers
 */
const paths = {
    API_ROOT,
    PROJECT_ROOT,
    FABRIC_SAMPLES_PATH,
    TEST_NETWORK_PATH,
    ORGANIZATIONS_PATH,
    PEER_ORGS_PATH,

    /**
     * Get connection profile JSON path for an organization
     * @param {string} org - e.g. 'org1', 'org2', 'org3'
     * @returns {string} Absolute path to connection-[org].json
     */
    getConnectionProfilePath(org) {
        return path.join(PEER_ORGS_PATH, `${org}.example.com`, `connection-${org}.json`);
    },

    /**
     * Get MSP directory for an admin user of an organization
     * @param {string} org - e.g. 'org1', 'org2', 'org3'
     * @returns {string} Absolute path to admin MSP directory
     */
    getAdminMspPath(org) {
        return path.join(PEER_ORGS_PATH, `${org}.example.com`, 'users', `Admin@${org}.example.com`, 'msp');
    },

    /**
     * Get admin certificate path
     * @param {string} org - e.g. 'org1', 'org2', 'org3'
     * @returns {string} Absolute path to admin cert.pem
     */
    getAdminCertPath(org) {
        const mspPath = this.getAdminMspPath(org);
        const certName = `Admin@${org}.example.com-cert.pem`;
        const preferredCert = path.join(mspPath, 'signcerts', certName);
        if (fs.existsSync(preferredCert)) {
            return preferredCert;
        }
        // Fallback to cert.pem if symlink not yet created
        const genericCert = path.join(mspPath, 'signcerts', 'cert.pem');
        return fs.existsSync(genericCert) ? genericCert : preferredCert;
    },

    /**
     * Get admin private key path from keystore
     * @param {string} org - e.g. 'org1', 'org2', 'org3'
     * @returns {string} Absolute path to private key
     */
    getAdminKeyPath(org) {
        const keystorePath = path.join(this.getAdminMspPath(org), 'keystore');
        const privSk = path.join(keystorePath, 'priv_sk');
        if (fs.existsSync(privSk)) {
            return privSk;
        }
        // If priv_sk symlink not present, find the first key file in directory
        if (fs.existsSync(keystorePath)) {
            try {
                const files = fs.readdirSync(keystorePath);
                if (files.length > 0) {
                    return path.join(keystorePath, files[0]);
                }
            } catch (err) {
                // Return default fallback
            }
        }
        return privSk;
    },

    /**
     * Get local file wallet path for an organization
     * @param {string} org - e.g. 'org1', 'org2', 'org3'
     * @returns {string} Absolute path to wallet folder
     */
    getWalletPath(org) {
        return path.join(API_ROOT, 'src', 'wallets', org);
    },

    /**
     * Get all local wallets path
     * @returns {string} Absolute path to src/wallets
     */
    getAllWalletsPath() {
        return path.join(API_ROOT, 'src', 'wallets');
    }
};

module.exports = paths;
