'use client';

import { useState } from 'react';
import { formatDistanceToNow } from '@/lib/utils';
import { comments as commentsApi } from '@/lib/api';
import { isAuthenticated, getAuth } from '@/lib/auth';

interface Comment {
  id: number;
  content: string;
  authorUsername: string;
  postId: number;
  parentId: number | null;
  createdAt: string;
}

interface CommentSectionProps {
  postId: number;
  initialComments: Comment[];
}

export default function CommentSection({ postId, initialComments }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!isAuthenticated()) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      await commentsApi.create(postId, newComment);
      setNewComment('');
      // Refresh comments
      const response = await commentsApi.getByPostId(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Error creating comment:', error);
      alert('댓글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent, parentId: number) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    if (!isAuthenticated()) {
      alert('로그인이 필요합니다.');
      return;
    }

    setLoading(true);
    try {
      await commentsApi.create(postId, replyContent, parentId);
      setReplyContent('');
      setReplyTo(null);
      // Refresh comments
      const response = await commentsApi.getByPostId(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Error creating reply:', error);
      alert('답글 작성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await commentsApi.delete(postId, commentId);
      // Refresh comments
      const response = await commentsApi.getByPostId(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const rootComments = comments.filter(c => !c.parentId);
  const getReplies = (commentId: number) => 
    comments.filter(c => c.parentId === commentId);

  const currentUsername = getAuth().username;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">
        댓글 ({comments.length})
      </h2>

      {/* Comment form */}
      <form onSubmit={handleSubmitComment} className="mb-8">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder={isAuthenticated() ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
          disabled={!isAuthenticated() || loading}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="submit"
            disabled={!isAuthenticated() || loading || !newComment.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '작성 중...' : '댓글 작성'}
          </button>
        </div>
      </form>

      {/* Comments list */}
      <div className="space-y-4">
        {rootComments.map((comment) => (
          <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span className="font-semibold">{comment.authorUsername}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(comment.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-gray-800">{comment.content}</p>
                  <div className="mt-2 flex space-x-2">
                    <button
                      onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      답글
                    </button>
                    {currentUsername === comment.authorUsername && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Reply form */}
              {replyTo === comment.id && (
                <form onSubmit={(e) => handleSubmitReply(e, comment.id)} className="mt-4">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="답글을 입력하세요..."
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                  <div className="mt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        setReplyTo(null);
                        setReplyContent('');
                      }}
                      className="px-4 py-1 text-gray-600 hover:text-gray-800"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={loading || !replyContent.trim()}
                      className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      답글 작성
                    </button>
                  </div>
                </form>
              )}

              {/* Replies */}
              {getReplies(comment.id).map((reply) => (
                <div key={reply.id} className="mt-4 ml-6 border-l-2 border-blue-200 pl-4">
                  <div className="bg-white p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <span className="font-semibold">{reply.authorUsername}</span>
                          <span>•</span>
                          <span>{formatDistanceToNow(reply.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-gray-800">{reply.content}</p>
                        {currentUsername === reply.authorUsername && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="mt-2 text-sm text-red-600 hover:text-red-800"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

