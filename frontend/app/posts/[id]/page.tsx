'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { posts, comments as commentsApi } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { formatDistanceToNow } from '@/lib/utils';
import CommentSection from '@/components/CommentSection';

interface Post {
  id: number;
  title: string;
  content: string;
  authorUsername: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Number(params.id);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
    fetchComments();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const response = await posts.getById(postId);
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('게시글을 불러오는데 실패했습니다.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentsApi.getByPostId(postId);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleDelete = async () => {
    if (!confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      await posts.delete(postId);
      router.push('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">게시글을 찾을 수 없습니다.</p>
      </div>
    );
  }

  const currentUsername = getAuth().username;
  const isAuthor = currentUsername === post.authorUsername;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="border-b pb-4 mb-4">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          <div className="flex justify-between items-center text-sm text-gray-600">
            <div className="space-x-4">
              <span className="font-semibold">{post.authorUsername}</span>
              <span>조회 {post.viewCount}</span>
              <span>{formatDistanceToNow(post.createdAt)}</span>
            </div>
            {isAuthor && (
              <div className="space-x-2">
                <Link
                  href={`/posts/edit/${post.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  수정
                </Link>
                <button
                  onClick={handleDelete}
                  className="text-red-600 hover:text-red-800"
                >
                  삭제
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="prose max-w-none mb-8">
          <p className="whitespace-pre-wrap text-gray-800 leading-relaxed">
            {post.content}
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-center border-t pt-4">
          <Link
            href="/"
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
          >
            목록으로
          </Link>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
        <CommentSection postId={postId} initialComments={comments} />
      </div>
    </div>
  );
}

