import { apiClient } from '../../lib/http/apiClient';
import type { ResourceResponse } from './types';

export const fetchResources = async (): Promise<ResourceResponse> => {
  const { data } = await apiClient.get<ResourceResponse>('/borrower/resources');
  return data;
};

export const fetchResource = async (id: string | number): Promise<any> => {
  const { data } = await apiClient.get<any>(`/borrower/resources/${id}`);
  return data;
};

export const downloadResource = async (id: number) => {
  const response = await apiClient.get(`/borrower/resources/${id}/download`, {
    responseType: 'blob'
  });
  return response;
};

/**
 * A resource's file, read through the API (R3-BUG-003). Its signed link can't
 * be shown in an iframe - the API refuses to be framed by another origin - so
 * the preview shows this blob instead.
 */
export const fetchResourceFile = async (id: number | string): Promise<Blob> => {
  const { data } = await apiClient.get<Blob>(`/borrower/resources/${id}/download`, {
    responseType: 'blob'
  });
  if (data.type.includes('application/json')) {
    throw new Error('The resource file could not be read.');
  }
  return data;
};
