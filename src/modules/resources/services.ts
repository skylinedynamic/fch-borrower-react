import { apiClient } from '../../lib/http/apiClient';
import type { ResourceResponse } from './types';

export const fetchResources = async (): Promise<ResourceResponse> => {
  const { data } = await apiClient.get<ResourceResponse>('/borrower/resources');
  return data;
};

export const downloadResource = async (id: number) => {
  const response = await apiClient.get(`/borrower/resources/${id}/download`, {
    responseType: 'blob'
  });
  return response;
};
