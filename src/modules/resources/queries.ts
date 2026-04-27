import { useQuery } from '@tanstack/react-query';
import { fetchResources } from './services';

export const resourceKeys = {
  all: ['resources'] as const,
};

export const useResources = () => {
  return useQuery({
    queryKey: resourceKeys.all,
    queryFn: fetchResources,
    select: (response) => response.data,
  });
};
