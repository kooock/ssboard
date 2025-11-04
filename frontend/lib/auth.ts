export const setAuth = (token: string, username: string, email: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    localStorage.setItem('email', email);
  }
};

export const getAuth = () => {
  if (typeof window !== 'undefined') {
    return {
      token: localStorage.getItem('token'),
      username: localStorage.getItem('username'),
      email: localStorage.getItem('email'),
    };
  }
  return { token: null, username: null, email: null };
};

export const clearAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
  }
};

export const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('token');
  }
  return false;
};

