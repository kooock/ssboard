'use client';

import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils';

interface Post {
  id: number;
  title: string;
  content: string;
  authorUsername: string;
  viewCount: number;
  createdAt: string;
}

interface PostListProps {
  posts: Post[];
}

export default function PostList({ posts }: PostListProps) {
  if (!posts || posts.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        게시글이 없습니다.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={`/posts/${post.id}`}
          className="block hover:bg-gray-50 transition-colors"
        >
          <div className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                  {post.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                  {post.content}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>{post.authorUsername}</span>
                  <span>조회 {post.viewCount}</span>
                  <span>{formatDistanceToNow(post.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

