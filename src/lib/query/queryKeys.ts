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
  documents: {
    all: ['documents'] as const,
    types: () => [...queryKeys.documents.all, 'types'] as const,
    list: () => [...queryKeys.documents.all, 'list'] as const,
  },
} as const