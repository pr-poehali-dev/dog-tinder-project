const AUTH_API_URL = 'https://functions.poehali.dev/1a398d28-e1ae-4c80-9ea4-195ae0eafaf2';

interface User {
  id: number;
  email: string;
  name?: string;
  created_at?: string;
}

export const getCurrentUser = (): User | null => {
  const userId = localStorage.getItem('userId');
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');
  const token = localStorage.getItem('authToken');

  if (!userId || !userEmail || !token) {
    return null;
  }

  return {
    id: parseInt(userId),
    email: userEmail,
    name: userName || undefined,
  };
};

export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userId');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
};

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('authToken');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const verifyToken = async (): Promise<User | null> => {
  const token = getAuthToken();
  const userId = localStorage.getItem('userId');

  if (!token || !userId) {
    return null;
  }

  try {
    const response = await fetch(AUTH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        action: 'verify',
        user_id: parseInt(userId),
        token,
      }),
    });

    if (!response.ok) {
      logout();
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('Token verification failed:', error);
    logout();
    return null;
  }
};
