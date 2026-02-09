/**
 * Telegram Auth Extension - useTelegramAuth Hook
 *
 * React hook for Telegram bot authentication.
 * Simple flow: button opens bot -> bot sends link -> callback page exchanges token.
 */
import { useState, useCallback, useEffect, useRef } from "react";

// =============================================================================
// TYPES
// =============================================================================

const REFRESH_TOKEN_KEY = "telegram_auth_refresh_token";

export interface User {
  id: number;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  telegram_id: string;
}

interface AuthApiUrls {
  callback: string;
  refresh: string;
  logout: string;
}

interface UseTelegramAuthOptions {
  apiUrls: AuthApiUrls;
  /** Telegram bot username (without @) */
  botUsername: string;
  onAuthChange?: (user: User | null) => void;
  autoRefresh?: boolean;
  refreshBeforeExpiry?: number;
}

interface UseTelegramAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  /** Opens Telegram bot in new tab */
  login: () => void;
  /** Exchange token for JWT (call from callback page) */
  handleCallback: (token: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  getAuthHeader: () => { Authorization: string } | Record<string, never>;
}

// =============================================================================
// LOCAL STORAGE
// =============================================================================

function getStoredRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

function setStoredRefreshToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

function clearStoredRefreshToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// =============================================================================
// HOOK
// =============================================================================

export function useTelegramAuth(options: UseTelegramAuthOptions): UseTelegramAuthReturn {
  const {
    apiUrls,
    botUsername,
    onAuthChange,
    autoRefresh = true,
    refreshBeforeExpiry = 60,
  } = options;

  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAuth = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
    setAccessToken(null);
    setUser(null);
    clearStoredRefreshToken();
  }, []);

  const scheduleRefresh = useCallback(
    (expiresInSeconds: number, refreshFn: () => Promise<boolean>) => {
      if (!autoRefresh) return;

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      const refreshIn = Math.max((expiresInSeconds - refreshBeforeExpiry) * 1000, 1000);

      refreshTimerRef.current = setTimeout(async () => {
        const success = await refreshFn();
        if (!success) {
          clearAuth();
        }
      }, refreshIn);
    },
    [autoRefresh, refreshBeforeExpiry, clearAuth]
  );

  const refreshTokenFn = useCallback(async (): Promise<boolean> => {
    const storedRefreshToken = getStoredRefreshToken();
    if (!storedRefreshToken) {
      return false;
    }

    try {
      const response = await fetch(apiUrls.refresh, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRefreshToken }),
      });

      if (!response.ok) {
        clearAuth();
        return false;
      }

      const data = await response.json();
      setAccessToken(data.access_token);
      setUser(data.user);
      scheduleRefresh(data.expires_in, refreshTokenFn);
      return true;
    } catch {
      clearAuth();
      return false;
    }
  }, [apiUrls.refresh, clearAuth, scheduleRefresh]);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const hasToken = !!getStoredRefreshToken();
      if (hasToken) {
        await refreshTokenFn();
      }
      setIsLoading(false);
    };

    restoreSession();

    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [refreshTokenFn]);

  // Notify on auth change
  useEffect(() => {
    onAuthChange?.(user);
  }, [user, onAuthChange]);

  const checkUserPetAndRedirect = useCallback(async (token: string) => {
    try {
      // Проверяем наличие питомца у пользователя
      const response = await fetch('https://functions.poehali.dev/c7b05c84-a7a2-404e-a1f0-a80c56816d60?action=my-pets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.pets && data.pets.length > 0) {
        // Питомец есть - направляем в ленту
        window.location.href = '/feed';
      } else {
        // Питомца нет - направляем на создание профиля
        window.location.href = '/profile/create-pet';
      }
    } catch (err) {
      console.error('Error checking pet:', err);
      // В случае ошибки направляем на главную
      window.location.href = '/feed';
    }
  }, []);

  const startAuthPolling = useCallback(async (sessionId: string) => {
    const maxAttempts = 60; // 5 минут (каждые 5 секунд)
    let attempts = 0;
    
    const pollInterval = setInterval(async () => {
      attempts++;
      
      if (attempts > maxAttempts) {
        clearInterval(pollInterval);
        localStorage.removeItem('telegram_auth_session_id');
        setError('Timeout: authorization not completed');
        return;
      }
      
      try {
        const response = await fetch(`${apiUrls.callback.replace('callback', 'check_auth')}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId })
        });
        
        const data = await response.json();
        
        if (data.authenticated) {
          clearInterval(pollInterval);
          localStorage.removeItem('telegram_auth_session_id');
          
          // Сохраняем токены и данные пользователя
          setAccessToken(data.access_token);
          setUser(data.user);
          setStoredRefreshToken(data.refresh_token);
          localStorage.setItem('access_token', data.access_token);
          localStorage.setItem('refresh_token', data.refresh_token);
          localStorage.setItem('user', JSON.stringify(data.user));
          scheduleRefresh(data.expires_in || 900, refreshTokenFn);
          
          // Проверяем, есть ли у пользователя питомец
          void checkUserPetAndRedirect(data.access_token);
        } else if (data.needs_username) {
          clearInterval(pollInterval);
          localStorage.removeItem('telegram_auth_session_id');
          // Перенаправляем на установку username
          window.location.href = `/auth/telegram/username?user_id=${data.user_id}`;
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000); // Проверка каждые 5 секунд
  }, [apiUrls, scheduleRefresh, refreshTokenFn]);

  /**
   * Open Telegram bot and start polling for auth
   */
  const login = useCallback(() => {
    // Генерируем уникальный session_id
    const sessionId = `${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Сохраняем session_id для polling
    localStorage.setItem('telegram_auth_session_id', sessionId);
    localStorage.setItem('telegram_auth_start_time', Date.now().toString());
    
    // Запускаем polling
    startAuthPolling(sessionId);
    
    // Используем прямой переход для открытия Telegram приложения
    const botUrl = `tg://resolve?domain=${botUsername}&start=web_auth_${sessionId}`;
    window.location.href = botUrl;
  }, [botUsername, startAuthPolling]);

  /**
   * Exchange token for JWT (call from callback page)
   */
  const handleCallback = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrls.callback, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Authentication failed");
        setIsLoading(false);
        return false;
      }

      // Set auth data
      setAccessToken(data.access_token);
      setUser(data.user);
      setStoredRefreshToken(data.refresh_token);
      scheduleRefresh(data.expires_in, refreshTokenFn);
      setIsLoading(false);
      return true;
    } catch (err) {
      setError("Network error");
      setIsLoading(false);
      return false;
    }
  }, [apiUrls.callback, scheduleRefresh, refreshTokenFn]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    const storedRefreshToken = getStoredRefreshToken();

    try {
      await fetch(apiUrls.logout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: storedRefreshToken || "" }),
      });
    } catch {
      // Ignore errors
    }

    clearAuth();
  }, [apiUrls.logout, clearAuth]);

  /**
   * Get Authorization header for API requests
   */
  const getAuthHeader = useCallback(() => {
    if (!accessToken) return {};
    return { Authorization: `Bearer ${accessToken}` };
  }, [accessToken]);

  return {
    user,
    isAuthenticated: !!user && !!accessToken,
    isLoading,
    error,
    accessToken,
    login,
    handleCallback,
    logout,
    refreshToken: refreshTokenFn,
    getAuthHeader,
  };
}

export default useTelegramAuth;