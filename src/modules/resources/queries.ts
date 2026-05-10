import { useQuery } from '@tanstack/react-query';
import { fetchResources, fetchResource } from './services';

export const resourceKeys = {
  all: ['resources'] as const,
  detail: (id: string | number) => ['resources', id] as const,
};

export const useResources = () => {
  return useQuery({
    queryKey: resourceKeys.all,
    queryFn: fetchResources,
    select: (response) => response.data,
  });
};

export const useResource = (id: string | number | undefined) => {
  return useQuery({
    queryKey: resourceKeys.detail(id!),
    queryFn: () => fetchResource(id!),
    enabled: !!id,
  });
};
