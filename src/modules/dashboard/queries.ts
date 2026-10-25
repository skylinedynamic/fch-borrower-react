import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query';
import { fetchActiveFundingRequests, fetchDashboardData } from './services';

export const useDashboard = () => {
    return useQuery({
        queryKey: queryKeys.dashboard.all,
        queryFn: fetchDashboardData,
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Meetings and invoices change from other screens (and other people), so
        // every visit re-checks. The cached copy still paints at once.
        refetchOnMount: 'always',
    });
};

/**
 * Approved funding requests not yet started, for the layout's banner and the
 * sidebar badge on every page. Its own light endpoint, so a page other than the
 * dashboard never loads the whole dashboard.
 */
export const useActiveFundingRequests = () => {
    return useQuery({
        queryKey: queryKeys.dashboard.activeFundingRequests(),
        queryFn: fetchActiveFundingRequests,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};
