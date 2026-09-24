const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const officialSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  designation: { type: String, required: true },
  officeId: { type: String, required: true },
  org: { type: String, required: true },
}, { timestamps: true });

const Official = mongoose.model('Official', officialSchema);

async function fixOfficials() {
  await mongoose.connect('mongodb://localhost:27017/elandrecords');
  console.log('Connected to MongoDB');
  
  await Official.deleteMany({});
  console.log('Cleared old officials');

  const officials = [
    { username: 'clerk1', firstName: 'Clerk', lastName: 'One', email: 'clerk1@gov.in', password: 'clerk123', designation: 'clerk', officeId: 'OFF001', org: 'org1' },
    { username: 'superintendent1', firstName: 'Super', lastName: 'One', email: 'super1@gov.in', password: 'super123', designation: 'superintendent', officeId: 'OFF001', org: 'org1' },
    { username: 'project_officer1', firstName: 'Project', lastName: 'Officer', email: 'po1@gov.in', password: 'project123', designation: 'project_officer', officeId: 'OFF001', org: 'org1' },
    { username: 'mro1', firstName: 'MRO', lastName: 'One', email: 'mro1@gov.in', password: 'mro123', designation: 'mro', officeId: 'OFF002', org: 'org2' },
    { username: 'vro1', firstName: 'VRO', lastName: 'One', email: 'vro1@gov.in', password: 'vro123', designation: 'vro', officeId: 'OFF002', org: 'org2' },
    { username: 'survey1', firstName: 'Survey', lastName: 'One', email: 'survey1@gov.in', password: 'survey123', designation: 'surveyor', officeId: 'OFF002', org: 'org2' },
    { username: 'revenue_officer1', firstName: 'Revenue', lastName: 'Inspector', email: 'rev1@gov.in', password: 'revenue123', designation: 'revenue_inspector', officeId: 'OFF002', org: 'org2' },
    { username: 'revenue_dept1', firstName: 'Revenue', lastName: 'Dept', email: 'revdept1@gov.in', password: 'dept123', designation: 'revenue_dept_officer', officeId: 'OFF002', org: 'org2' },
    { username: 'joint_collector1', firstName: 'Joint', lastName: 'Collector', email: 'jc1@gov.in', password: 'joint123', designation: 'joint_collector', officeId: 'OFF003', org: 'org3' },
    { username: 'collector1', firstName: 'District', lastName: 'Collector', email: 'col1@gov.in', password: 'collector123', designation: 'district_collector', officeId: 'OFF003', org: 'org3' },
    { username: 'mw1', firstName: 'Ministry', lastName: 'Welfare', email: 'mw1@gov.in', password: 'mw123', designation: 'ministry_welfare', officeId: 'OFF003', org: 'org3' },
  ];

  for (const off of officials) {
    const salt = await bcrypt.genSalt(10);
    off.password = await bcrypt.hash(off.password, salt);
    await Official.create(off);
    console.log(`Created: ${off.username} (${off.designation})`);
  }

  await mongoose.disconnect();
  console.log('Done!');
}

fixOfficials().catch(console.error);
