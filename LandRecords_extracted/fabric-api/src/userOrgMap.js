// User to Organization mapping for Land Registration System
const userOrgMap = {
  // Org1 - Registration Department
  'admin-registration': 'org1',
  'user_portal': 'org1',
  'clerk1': 'org1', 'clerk': 'org1',
  'superintendent1': 'org1', 'superintendent': 'org1', 'sup': 'org1',
  'project_officer1': 'org1', 'project_officer': 'org1', 'project': 'org1',

  'admin-revenue': 'org2',
  'mro1': 'org2', 'mro': 'org2',
  'vro1': 'org2', 'vro': 'org2',
  'survey1': 'org2', 'surveyor1': 'org2', 'surveyor': 'org2', 'sur': 'org2',
  'revenue_officer1': 'org2', 'revenue_inspector1': 'org2', 'revenue_inspector': 'org2', 'revenue': 'org2',
  'revenue_dept1': 'org2', 'revenue_dept_officer1': 'org2', 'revenue_dept_officer': 'org2', 'revenue_dept': 'org2',

  // Org3 - Collectorate Department
  'admin-collector': 'org3',
  'joint_collector1': 'org3', 'joint_collector': 'org3', 'jc': 'org3',
  'collector1': 'org3', 'col': 'org3',
  'mw1': 'org3', 'ministry_welfare1': 'org3', 'mw': 'org3'
};

// Function to get organization for a user
function getOrgForUser(username) {
  return userOrgMap[username] || null;
}

// Function to get all users for an organization
function getUsersForOrg(org) {
  return Object.keys(userOrgMap).filter(user => userOrgMap[user] === org);
}

// Function to validate user exists
function isValidUser(username) {
  return username in userOrgMap;
}

module.exports = {
  userOrgMap,
  getOrgForUser,
  getUsersForOrg,
  isValidUser
};