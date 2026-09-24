const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Load .env.local (Next.js style) then fallback to .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function fix() {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/elandrecords';
        console.log('Connecting to:', uri.replace(/:([^@]+)@/, ':****@'));
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // We use the collection directly to bypass model validation if needed
        const Official = mongoose.connection.collection('officials');

        const mappings = [
            // Org 1 - Registration
            { old: 'clerk', new: 'clerk', pass: 'clerk123', role: 'clerk', org: 'org1', dept: 'Registration' },
            { old: 'superintendent', new: 'superintendent', pass: 'superintendent123', role: 'superintendent', org: 'org1', dept: 'Registration' },
            { old: 'project_officer', new: 'project_officer', pass: 'project_officer123', role: 'project_officer', org: 'org1', dept: 'Registration' },

            // Org 2 - Revenue
            { old: 'mro1', new: 'mro1', pass: 'mro123', role: 'mro', org: 'org2', dept: 'Revenue' },
            { old: 'vro1', new: 'vro1', pass: 'vro123', role: 'vro', org: 'org2', dept: 'Revenue' },
            { old: 'survey1', new: 'surveyor1', pass: 'surveyor123', role: 'surveyor', org: 'org2', dept: 'Revenue' },
            { old: 'revenue_officer1', new: 'revenue_inspector1', pass: 'revenue_inspector123', role: 'revenue_inspector', org: 'org2', dept: 'Revenue' },
            { old: 'revenue_dept1', new: 'revenue_dept_officer1', pass: 'revenue_dept_officer123', role: 'revenue_dept_officer', org: 'org2', dept: 'Revenue' },

            // Org 3 - Collectorate
            { old: 'joint_collector1', new: 'joint_collector1', pass: 'joint_collector123', role: 'joint_collector', org: 'org3', dept: 'Collectorate' },
            { old: 'collector1', new: 'district_collector1', pass: 'district_collector123', role: 'district_collector', org: 'org3', dept: 'Collectorate' },
            { old: 'mw1', new: 'ministry_welfare1', pass: 'ministry_welfare123', role: 'ministry_welfare', org: 'org3', dept: 'Collectorate' }
        ];

        for (const m of mappings) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(m.pass, salt);

            // Try to find by new name first to see if it exists
            const exists = await Official.findOne({ username: m.new });

            if (exists) {
                await Official.updateOne({ _id: exists._id }, { $set: { password: hash, designation: m.role } });
                console.log(`Updated password for existing user: ${m.new}`);
            } else {
                // Try to find by old name and rename
                const oldUser = await Official.findOne({ username: m.old });
                if (oldUser) {
                    await Official.updateOne({ _id: oldUser._id }, { $set: { username: m.new, password: hash, designation: m.role } });
                    console.log(`Renamed and updated: ${m.old} -> ${m.new}`);
                } else {
                    // Create new user from scratch
                    await Official.insertOne({
                        username: m.new,
                        password: hash,
                        firstName: m.new,
                        lastName: 'Official',
                        designation: m.role,
                        department: m.role.includes('collector') || m.role.includes('ministry') ? 'Collectorate' : 'Revenue',
                        email: m.new + '@gov.in',
                        phone: '9999999999',
                        officeId: 'OFF-' + Math.random().toString(36).substring(7).toUpperCase(),
                        isVerified: true,
                        org: m.role.includes('collector') || m.role.includes('ministry') ? 'org3' : 'org2',
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    console.log(`Created new official: ${m.new}`);
                }
            }
        }
        console.log('Credential fix completed successfully');
        process.exit(0);
    } catch (err) {
        console.error('Error fixing credentials:', err);
        process.exit(1);
    }
}

fix();
