import { useQuery } from '@tanstack/react-query';
import { fetchResources, fetchResource, fetchResourceFile } from './services';

export const resourceKeys = {
  all: ['resources'] as const,
  detail: (id: string | number) => ['resources', id] as const,
  file: (id: string | number) => ['resources', id, 'file'] as const,
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

/** A resource's file for the preview (R3-BUG-003); read only when `enabled`. */
export const useResourceFile = (id: string | number | undefined, enabled = true) => {
  return useQuery({
    queryKey: resourceKeys.file(id!),
    queryFn: () => fetchResourceFile(id!),
    enabled: !!id && enabled,
    staleTime: Infinity,
    retry: false,
  });
};
