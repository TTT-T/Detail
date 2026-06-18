export interface ProjectDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  urlEnv: string;
  defaultUrl: string;
  ssoUrlEnv?: string;
  ssoDefaultUrl?: string;
  roles: readonly string[];
  ssoPath: string;
}

export const PROJECTS: ProjectDef[] = [
  {
    id: 'account_a_team',
    name: 'Account A-Team',
    description: 'ระบบบัญชีและ Invoice — GL Reconciliation, OCR, SAP Export',
    icon: '📊',
    color: '#6366f1',
    urlEnv: 'ACCOUNT_A_TEAM_URL',
    defaultUrl: 'http://localhost:3000',
    roles: ['SUPERADMIN', 'ADMIN', 'USER'],
    ssoPath: '/api/auth/sso',
  },
  {
    id: 'management_tracking',
    name: 'Management Tracking',
    description: 'ระบบติดตามงานและการเงิน — Field Reports, Project Milestones',
    icon: '📋',
    color: '#0ea5e9',
    urlEnv: 'MANAGEMENT_TRACKING_URL',
    defaultUrl: 'http://localhost:8090',
    roles: ['ADMIN', 'PM', 'SUPERVISOR', 'TECHNICIAN', 'OUTSOURCED'],
    ssoPath: '/tracking/api/v1/auth/sso',
  },
  {
    id: 'team_performance',
    name: 'Track B — Team Performance',
    description: 'KPI Dashboard — CM Analytics, Behavior Ranking, Drill-down 6 ระดับ',
    icon: '📈',
    color: '#10b981',
    urlEnv: 'TEAM_PERFORMANCE_URL',
    defaultUrl: 'http://localhost:3080',
    roles: ['ADMIN', 'MANAGER', 'VIEWER'],
    ssoPath: '/api/auth/sso',
  },
];

export function getProjectUrl(projectId: string): string {
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) return '#';
  return process.env[project.urlEnv] || project.defaultUrl;
}

export function getProjectSSOUrl(project: ProjectDef): string {
  const baseUrl = project.ssoUrlEnv
    ? (process.env[project.ssoUrlEnv] || project.ssoDefaultUrl || getProjectUrl(project.id))
    : getProjectUrl(project.id);
  return `${baseUrl}${project.ssoPath}`;
}
