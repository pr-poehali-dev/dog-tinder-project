export function playNotificationSound() {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIF2S57OqkUhMNUKXh8LJoHgU2jdXwzX4yBSZ+zPLaizsIHGy37OmiUBELTKHd77FrJAU7ldz0yoU2Byp7yvDZjUEJH3G+8+ibUhENT6fj8LNpIAU5lNny0Ys8CCh8zPDaj0IJIHa/8+ObVBQLUani77VqJAU8mN30zYg5Byh+zPHYkEQKInq/8+SdVRQJTqTh77doJgU9md700Y08CSl+zfHYk0YKJ3m+8+adVhQJT6bi77loJwU+mt/z05E9CSp/zvHYlkgKKHm98+WdVxQJUKbh7rloKAU/m9/y05A+CSp/z/HYl0kKKXm98+SeVxQJUKfh7rlnKAU/m9/y05E+CSp/z/DYlkkKKXq98+SeVxQJUKfh77lnKAVAm9/y05E+CSp/zvDYlkgKKXm98+SeVxQJUKbh77lnKAVAmt/y05E+CSp/zvDYlkgKKXm98+SeVxQJT6bh77lnKAVAmN/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmN/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmN/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKAVAmd/y05E+CSp/zvDZlkgKKXm98+SeVxQJT6bh77lnKA==');
  audio.volume = 0.3;
  audio.play().catch(() => {
    // Ignore errors if audio playback is blocked
  });
}

export function showBrowserNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'tindog-notification',
    });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'tindog-notification',
        });
      }
    });
  }
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}
