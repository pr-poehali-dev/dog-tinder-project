import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  user: { id: number } | null;
  counts: {
    newLikes: number;
    newMatches: number;
    unreadMessages: number;
  };
  onLoginClick: () => void;
}

export default function Header({ user, counts, onLoginClick }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-2 rounded-xl">
              <Icon name="Heart" size={28} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
              TinDog
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="relative" onClick={() => (window.location.href = '/likes')}>
              <Icon name="Heart" size={24} />
              {(counts.newLikes > 0 || counts.newMatches > 0) && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {counts.newLikes + counts.newMatches}
                </span>
              )}
            </Button>
            <Button variant="ghost" className="relative" onClick={() => (window.location.href = '/chats')}>
              <Icon name="MessageCircle" size={24} />
              {counts.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {counts.unreadMessages}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={() => (window.location.href = '/chatgpt')} title="Поддержка">
              <Icon name="Headphones" size={24} />
            </Button>
            <Button variant="ghost" onClick={() => {
              if (!user) {
                onLoginClick();
              } else {
                window.location.href = '/profile';
              }
            }}>
              <Icon name="User" size={24} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
