import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from './services';

export const useDashboard = () => {
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: fetchDashboardData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Meetings and invoices change from other screens (and other people), so
        // every visit re-checks. The cached copy still paints at once.
        refetchOnMount: 'always',
    });
};
