export const WORKFLOW_STAGES = [
  'clerk',
  'superintendent',
  'projectofficer',
  'vro',
  'surveyor',
  'revenueInspector',
  'mro',
  'revenueDeptOfficer',
  'jointCollector',
  'districtCollector',
  'ministryWelfare',
];

export const STAGE_LABELS: Record<string, string> = {
  clerk: 'Clerk (Registration Dept)',
  superintendent: 'Superintendent (Registration Dept)',
  projectofficer: 'Project Officer (Registration Dept)',
  vro: 'VRO (Revenue Dept)',
  surveyor: 'Surveyor (Revenue Dept)',
  revenueInspector: 'Revenue Inspector (Revenue Dept)',
  mro: 'MRO (Revenue Dept)',
  revenueDeptOfficer: 'Revenue Dept Officer (Revenue Dept)',
  jointCollector: 'Joint Collector (Collectorate)',
  districtCollector: 'District Collector (Collectorate)',
  ministryWelfare: 'Ministry of Welfare (Government)',
};

export const DESIGNATION_TO_STAGE: Record<string, string> = {
  clerk: 'clerk',
  superintendent: 'superintendent',
  projectofficer: 'projectofficer',
  project_officer: 'projectofficer',
  vro: 'vro',
  surveyor: 'surveyor',
  revenueinspector: 'revenueInspector',
  revenue_inspector: 'revenueInspector',
  mro: 'mro',
  revenuedeptofficer: 'revenueDeptOfficer',
  revenue_dept_officer: 'revenueDeptOfficer',
  jointcollector: 'jointCollector',
  joint_collector: 'jointCollector',
  districtcollector: 'districtCollector',
  district_collector: 'districtCollector',
  ministrywelfare: 'ministryWelfare',
  ministry_welfare: 'ministryWelfare',
};

export const NEXT_STAGE: Record<string, string> = {
  clerk: 'superintendent',
  superintendent: 'projectofficer',
  projectofficer: 'mro',
  mro: 'surveyor',
  surveyor: 'revenueInspector',
  revenueInspector: 'vro',
  vro: 'revenueDeptOfficer',
  revenueDeptOfficer: 'jointCollector',
  jointCollector: 'districtCollector',
  districtCollector: 'ministryWelfare',
  ministryWelfare: 'completed',
};

export const NEXT_STAGE_LABEL: Record<string, string> = {
  clerk: 'Superintendent (Registration Dept)',
  superintendent: 'Project Officer (Registration Dept)',
  projectofficer: 'MRO (Revenue Dept)',
  mro: 'Surveyor (Revenue Dept)',
  surveyor: 'Revenue Inspector (Revenue Dept)',
  revenueInspector: 'VRO (Revenue Dept)',
  vro: 'Revenue Dept Officer (Revenue Dept)',
  revenueDeptOfficer: 'Joint Collector (Collectorate)',
  jointCollector: 'District Collector (Collectorate)',
  districtCollector: 'Ministry of Welfare (Government)',
  ministryWelfare: 'Process Completed',
};

export const STAGE_DESCRIPTION: Record<string, string> = {
  clerk: 'Create new land record entry and forward to Superintendent',
  superintendent: 'Verify applicant information and uploaded documents',
  projectofficer: 'Approve registration and generate certificate',
  vro: 'Verify land boundaries and physical possession',
  surveyor: 'Update measurements, sketches and geo-coordinates',
  revenueInspector: 'Verify tax status and historical ownership',
  mro: 'Final revenue-level approval before forwarding',
  revenueDeptOfficer: 'Final revenue approval before collectorate review',
  jointCollector: 'Review and approve pending cases',
  districtCollector: 'Final district-level approval or rejection',
  ministryWelfare: 'Government-level approval and finalization',
};
