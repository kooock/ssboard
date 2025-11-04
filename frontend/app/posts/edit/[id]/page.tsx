'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { posts } from '@/lib/api';
import { isAuthenticated, getAuth } from '@/lib/auth';

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = Number(params.id);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      alert('로그인이 필요합니다.');
      router.push('/login');
      return;
    }
    fetchPost();
  }, [postId, router]);

  const fetchPost = async () => {
    try {
      const response = await posts.getById(postId);
      const post = response.data;
      
      const currentUsername = getAuth().username;
      if (currentUsername !== post.authorUsername) {
        alert('수정 권한이 없습니다.');
        router.push(`/posts/${postId}`);
        return;
      }

      setTitle(post.title);
      setContent(post.content);
    } catch (error) {
      console.error('Error fetching post:', error);
      alert('게시글을 불러오는데 실패했습니다.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    setSubmitting(true);

    try {
      await posts.update(postId, title, content);
      router.push(`/posts/${postId}`);
    } catch (error: any) {
      console.error('Error updating post:', error);
      setError(error.response?.data || '게시글 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">게시글 수정</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            제목
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '수정 중...' : '수정하기'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 bg-gray-500 text-white py-3 rounded-lg hover:bg-gray-600"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}

