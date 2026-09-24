const mongoose = require('mongoose');

async function sync() {
    try {
        // You might need to change the DB name if it's different in your env
        await mongoose.connect('mongodb://localhost:27017/elandrecords');
        console.log('Connected to MongoDB');

        // We use the collection directly to avoid model issues
        const LandRequest = mongoose.connection.collection('landrequests');

        // Hard sync: Force the status and owner to match the blockchain's current Surveyor stage
        const res = await LandRequest.updateOne(
            { receiptNumber: 'APP-DF39C279D7BD9836' },
            {
                $set: {
                    status: 'with_surveyor',
                    currentlyWith: 'surveyor1'
                }
            }
        );

        console.log('Sync result:', res);
        console.log('Application APP-DF39C279D7BD9836 is now officially with the Surveyor (surveyor1)');
        process.exit(0);
    } catch (err) {
        console.error('Sync error:', err);
        process.exit(1);
    }
}

sync();
