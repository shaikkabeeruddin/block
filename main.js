const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

const PORT = 3000;

// Helper function to connect to the network and get the contract
async function getContract() {
    const ccpPath = path.resolve('../organizations/peerOrganizations/org1.example.com/connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new wallet for managing identities.
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check if the admin user exists in the wallet
    const identity = await wallet.get('admin');
    if (!identity) {
        throw new Error('Admin identity not found in wallet');
    }

    // Connect to the network gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

    // Get the network and the contract
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('keyvaluechaincode');  // Replace with your chaincode name

    return { contract, gateway };
}

// Add Certificate
app.post('/addCertificate', async (req, res) => {
    try {
        const { certificateID, userID, certificateType, issueDate, status } = req.body;
        const { contract, gateway } = await getContract();

        // Submit the transaction to add the certificate
        await contract.submitTransaction('AddCertificate', certificateID, userID, certificateType, issueDate, status);

        // Disconnect from the gateway
        await gateway.disconnect();

        res.status(200).json({ message: 'Certificate added successfully' });
    } catch (error) {
        console.error(`Failed to add certificate: ${error}`);
        res.status(500).json({ message: 'Error adding certificate' });
    }
});

// Update Certificate Status
app.post('/updateCertificateStatus', async (req, res) => {
    try {
        const { certificateID, newStatus } = req.body;
        const { contract, gateway } = await getContract();

        // Submit the transaction to update the certificate status
        await contract.submitTransaction('UpdateCertificateStatus', certificateID, newStatus);

        // Disconnect from the gateway
        await gateway.disconnect();

        res.status(200).json({ message: 'Certificate status updated successfully' });
    } catch (error) {
        console.error(`Failed to update certificate status: ${error}`);
        res.status(500).json({ message: 'Error updating certificate status' });
    }
});

// Get Certificate History
app.post('/getCertificateHistory', async (req, res) => {
    try {
        const { certificateID } = req.body;
        const { contract, gateway } = await getContract();

        // Evaluate the transaction to get the certificate history
        const history = await contract.evaluateTransaction('GetCertificateHistory', certificateID);

        // Disconnect from the gateway
        await gateway.disconnect();

        res.status(200).json(JSON.parse(history.toString()));
    } catch (error) {
        console.error(`Failed to get certificate history: ${error}`);
        res.status(500).json({ message: 'Error fetching certificate history' });
    }
});

// Get User Identity
app.post('/getUserIdentity', async (req, res) => {
    try {
        const { contract, gateway } = await getContract();

        // Evaluate the transaction to get the user identity
        const identity = await contract.evaluateTransaction('GetUserIdentity');

        // Disconnect from the gateway
        await gateway.disconnect();

        res.status(200).json({ identity: identity.toString() });
    } catch (error) {
        console.error(`Failed to get user identity: ${error}`);
        res.status(500).json({ message: 'Error fetching user identity' });
    }
});


// Get Certificate
app.post('/getCertificate', async (req, res) => {
    try {
        const { certificateID } = req.body;
        const { contract, gateway } = await getContract();

        // Evaluate the transaction to get the certificate by ID
        const certificate = await contract.evaluateTransaction('GetCertificate', certificateID);

        // Disconnect from the gateway
        await gateway.disconnect();

        res.status(200).json(JSON.parse(certificate.toString()));
    } catch (error) {
        console.error(`Failed to get certificate: ${error}`);
        res.status(500).json({ message: 'Error fetching certificate' });
    }
});

// Serve the HTML form
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/user', (req, res) => {
    res.sendFile(path.join(__dirname, 'user.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});


