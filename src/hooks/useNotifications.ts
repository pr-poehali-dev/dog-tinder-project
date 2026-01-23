import { useState, useEffect, useCallback, useRef } from 'react';
import { playNotificationSound, showBrowserNotification } from '@/utils/notifications';

const LIKES_API_URL = 'https://functions.poehali.dev/4e6641e2-0060-48bf-8259-7b7f08c84498';
const POLL_INTERVAL = 30000; // 30 секунд

interface NotificationCounts {
  newLikes: number;
  newMatches: number;
  unreadMessages: number;
}

export function useNotifications(userId: number | null) {
  const [counts, setCounts] = useState<NotificationCounts>({
    newLikes: 0,
    newMatches: 0,
    unreadMessages: 0,
  });

  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const prevCountsRef = useRef<NotificationCounts>({ newLikes: 0, newMatches: 0, unreadMessages: 0 });

  const checkNotifications = useCallback(async () => {
    if (!userId) return;

    try {
      const [likesRes, matchesRes] = await Promise.all([
        fetch(`${LIKES_API_URL}?action=incoming&user_id=${userId}`),
        fetch(`${LIKES_API_URL}?action=matches&user_id=${userId}`),
      ]);

      const likes = await likesRes.json();
      const matches = await matchesRes.json();

      const newLikesCount = likes.filter(
        (like: any) => new Date(like.created_at) > lastChecked
      ).length;

      const newMatchesCount = matches.filter(
        (match: any) => new Date(match.matched_at) > lastChecked
      ).length;

      const newCounts = {
        newLikes: newLikesCount,
        newMatches: newMatchesCount,
        unreadMessages: 0,
      };

      // Проверяем, появились ли новые уведомления
      if (newLikesCount > prevCountsRef.current.newLikes) {
        playNotificationSound();
        showBrowserNotification(
          '❤️ Новый лайк!',
          `Кому-то понравился ваш питомец! (+${newLikesCount - prevCountsRef.current.newLikes})`
        );
      }

      if (newMatchesCount > prevCountsRef.current.newMatches) {
        playNotificationSound();
        showBrowserNotification(
          '🎉 Новый матч!',
          'У вас взаимная симпатия! Теперь можно писать в чат.'
        );
      }

      prevCountsRef.current = newCounts;
      setCounts(newCounts);
    } catch (error) {
      console.error('Failed to check notifications:', error);
    }
  }, [userId, lastChecked]);

  useEffect(() => {
    if (!userId) return;

    checkNotifications();

    const interval = setInterval(checkNotifications, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [userId, checkNotifications]);

  const markAsRead = useCallback(() => {
    setLastChecked(new Date());
    setCounts({ newLikes: 0, newMatches: 0, unreadMessages: 0 });
  }, []);

  return { counts, markAsRead, refresh: checkNotifications };
}