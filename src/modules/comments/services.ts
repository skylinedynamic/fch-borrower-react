import { apiClient } from '../../lib/http/apiClient';
import type { CommentEntityType, CommentListResponse, Comment } from './types';

export const fetchComments = async (entityType: CommentEntityType, entityId: number): Promise<CommentListResponse> => {
    const { data } = await apiClient.get('/borrower/comments', { params: { entity_type: entityType, entity_id: entityId } });
    return data;
};

export const createComment = async (payload: { entity_type: CommentEntityType; entity_id: number; body: string }): Promise<{ status: boolean; data: Comment }> => {
    const { data } = await apiClient.post('/borrower/comments', payload);
    return data;
};
