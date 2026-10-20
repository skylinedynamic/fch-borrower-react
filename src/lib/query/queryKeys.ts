// Centralized Query Keys for modules
export const queryKeys = {
  partner: {
    all: ['partner'] as const,
    list: () => [...queryKeys.partner.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.partner.all, 'detail', id] as const,
  },
  borrower: {
    all: ['borrower'] as const,
    list: () => [...queryKeys.borrower.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.borrower.all, 'detail', id] as const,
  },
  employee: {
    all: ['employee'] as const,
    list: () => [...queryKeys.employee.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.employee.all, 'detail', id] as const,
  },
  appointment: {
    all: ['appointment'] as const,
    list: () => [...queryKeys.appointment.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.appointment.all, 'detail', id] as const,
  },
  role: {
    all: ['role'] as const,
    list: () => [...queryKeys.role.all, 'list'] as const,
    detail: (id: string | number) => [...queryKeys.role.all, 'detail', id] as const,
    permissionsGrouped: () => [...queryKeys.role.all, 'permissions', 'grouped'] as const,
    // Distinct key for edit pages to avoid reading cached grouped permissions
    permissionsGroupedFresh: () => [...queryKeys.role.all, 'permissions', 'grouped', 'edit'] as const,
  },
  profile: {
    all: ['profile'] as const,
    personalInfo: () => [...queryKeys.profile.all, 'personalInfo'] as const,
    businessDetails: () => [...queryKeys.profile.all, 'businessDetails'] as const,
    financialInfo: () => [...queryKeys.profile.all, 'financialInfo'] as const,
  },
  preQualification: {
    all: ['preQualification'] as const,
  },
  creditBuilder: {
    all: ['creditBuilder'] as const,
    progress: () => [...queryKeys.creditBuilder.all, 'progress'] as const,
    tierTaskList: () => [...queryKeys.creditBuilder.all, 'tierTaskList'] as const,
    taskOverview: () => [...queryKeys.creditBuilder.all, 'taskOverview'] as const,
  },
  capitalAccess: {
    all: ['capitalAccess'] as const,
    overview: () => [...queryKeys.capitalAccess.all, 'overview'] as const,
    strategies: () => [...queryKeys.capitalAccess.all, 'strategies'] as const,
    detail: (id: string | number) => [...queryKeys.capitalAccess.all, 'detail', id] as const,
    detailOverview: (id: string | number) => [...queryKeys.capitalAccess.all, 'detailOverview', id] as const,
    detailChecklist: (id: string | number) => [...queryKeys.capitalAccess.all, 'detailChecklist', id] as const,
    detailRoadmap: (id: string | number) => [...queryKeys.capitalAccess.all, 'detailRoadmap', id] as const,
    detailStep: (strategyId: string | number, sequenceId: string | number) => [...queryKeys.capitalAccess.all, 'detailStep', strategyId, sequenceId] as const,
  },
  documents: {
    all: ['documents'] as const,
    types: () => [...queryKeys.documents.all, 'types'] as const,
    list: () => [...queryKeys.documents.all, 'list'] as const,
  },
  fundingApplication: {
    all: ['fundingApplication'] as const,
    businessInfo: () => [...queryKeys.fundingApplication.all, 'businessInfo'] as const,
    ownershipInfo: () => [...queryKeys.fundingApplication.all, 'ownershipInfo'] as const,
    financialInfo: () => [...queryKeys.fundingApplication.all, 'financialInfo'] as const,
    disclosuresConsent: () => [...queryKeys.fundingApplication.all, 'disclosuresConsent'] as const,
    fundingRequest: () => [...queryKeys.fundingApplication.all, 'fundingRequest'] as const,
    federalCompliance: () => [...queryKeys.fundingApplication.all, 'federalCompliance'] as const,
    documents: (id: number | null) => [...queryKeys.fundingApplication.all, 'documents', id] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
    // Under `all`, so invalidating the dashboard refreshes the layout's banner too.
    activeFundingRequests: () => [...queryKeys.dashboard.all, 'activeFundingRequests'] as const,
  },
  agreement: {
    all: ['agreement'] as const,
    check: () => [...queryKeys.agreement.all, 'check'] as const,
  },
  account: {
    all: ['account'] as const,
    emailChangeLink: (action: string, user: string, hash: string, query: string) =>
      [...queryKeys.account.all, 'emailChangeLink', action, user, hash, query] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    lists: () => [...queryKeys.notifications.all, 'list'] as const,
    list: (params: object) => [...queryKeys.notifications.lists(), params] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unreadCount'] as const,
  },
} as const