'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getAuth, clearAuth, isAuthenticated } from '@/lib/auth';

export default function Navbar() {
  const router = useRouter();
  const [auth, setAuth] = useState<{ username: string | null }>({ username: null });
  const [mounted, setMounted] = useState(false);

  // 인증 상태 업데이트 함수
  const updateAuth = () => {
    const authData = getAuth();
    setAuth({ username: authData.username });
  };

  useEffect(() => {
    setMounted(true);
    updateAuth();

    // 로그인 이벤트 리스너 추가
    window.addEventListener('auth-changed', updateAuth);
    
    return () => {
      window.removeEventListener('auth-changed', updateAuth);
    };
  }, []);

  const handleLogout = () => {
    clearAuth();
    setAuth({ username: null });
    // 로그아웃 이벤트 발생
    window.dispatchEvent(new Event('auth-changed'));
    router.push('/');
    router.refresh();
  };

  if (!mounted) {
    return null;
  }

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold">
            게시판
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link href="/" className="hover:text-blue-200">
              홈
            </Link>
            
            {isAuthenticated() ? (
              <>
                <Link href="/posts/create" className="hover:text-blue-200">
                  글쓰기
                </Link>
                <span className="text-blue-200">
                  {auth.username}님
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hover:text-blue-200"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

