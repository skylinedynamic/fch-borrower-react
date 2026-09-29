import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { fetchComments, createComment } from '../../../modules/comments/services';
import type { Comment, CommentEntityType } from '../../../modules/comments/types';

interface CommentPanelProps {
    entityType: CommentEntityType;
    entityId: number | string | undefined;
}

export default function CommentPanel({ entityType, entityId }: CommentPanelProps) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState('');
    const [posting, setPosting] = useState(false);

    useEffect(() => {
        if (!entityId) return;
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityType, entityId]);

    const load = async () => {
        try {
            setLoading(true);
            const response = await fetchComments(entityType, Number(entityId));
            setComments(response.data || []);
        } catch (error) {
            console.error('Failed to load comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = body.trim();
        if (!text || posting || !entityId) return;

        setPosting(true);
        try {
            await createComment({ entity_type: entityType, entity_id: Number(entityId), body: text });
            setBody('');
            await load();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || 'Failed to post comment.');
        } finally {
            setPosting(false);
        }
    };

    return (
        <div>
            {loading ? (
                <p className="text-muted fs-13 mb-0 py-2">Loading comments…</p>
            ) : comments.length === 0 ? (
                <div className="text-center py-4 text-muted">
                    <i className="ri-chat-3-line fs-24 d-block mb-1 text-muted opacity-50"></i>
                    <p className="mb-0 fs-12 fw-semibold">No comments yet.</p>
                </div>
            ) : (
                <div className="mb-3">
                    {comments.map((c) => (
                        <div key={c.id} className="border-bottom py-2">
                            <div className="fw-medium fs-13">{c.user?.name || 'Support'}</div>
                            <div className="fs-13 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{c.body}</div>
                            <div className="text-muted fs-11">{new Date(c.created_at).toLocaleString()}</div>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handlePost} className="d-flex gap-2 mt-2">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Add a comment…"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    disabled={posting}
                />
                <button type="submit" className="btn btn-sm btn-primary" disabled={posting || !body.trim()}>
                    Post
                </button>
            </form>
        </div>
    );
}
