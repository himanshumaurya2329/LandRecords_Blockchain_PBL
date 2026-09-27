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

/**
 * Returns the exact status strings that mean an application is currently ASSIGNED
 * to this specific official role for pending action.
 * Once the official forwards or approves to the next stage, the application status changes
 * and will no longer match this role's assigned statuses.
 */
export function getAssignedStatusesForRole(role: string): string[] {
  const normalized = (role || '').toLowerCase().replace(/[\s_-]/g, '');

  switch (normalized) {
    case 'clerk':
      return ['submitted', 'with_clerk'];

    case 'superintendent':
      return ['with_superintendent'];

    case 'projectofficer':
      return ['with_project_officer', 'with_projectofficer'];

    case 'mro':
      return ['with_mro'];

    case 'surveyor':
      return ['with_surveyor'];

    case 'revenueinspector':
      return ['with_revenue_inspector', 'with_revenueinspector'];

    case 'vro':
      return ['with_vro'];

    case 'revenuedeptofficer':
    case 'revenuedept':
    case 'revenueofficer':
    case 'revenuedepartmentofficer':
      return [
        'with_revenue_dept',
        'with_revenue_dept_officer',
        'with_revenuedeptofficer',
        'with_revenue_officer',
        'with_revenuedepartmentofficer'
      ];

    case 'jointcollector':
      return ['with_joint_collector', 'with_jointcollector'];

    case 'districtcollector':
    case 'collector':
      return ['with_collector', 'with_district_collector', 'with_districtcollector'];

    case 'ministrywelfare':
    case 'ministryofwelfare':
    case 'mw':
      return ['with_ministry_welfare', 'with_ministrywelfare'];

    case 'admin':
      return []; // Admin can see all applications

    default:
      return [`with_${role.toLowerCase().trim()}`];
  }
}

