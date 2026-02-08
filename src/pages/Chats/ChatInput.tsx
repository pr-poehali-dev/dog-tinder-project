import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

interface ChatInputProps {
  newMessage: string;
  isSending: boolean;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}

export default function ChatInput({
  newMessage,
  isSending,
  onMessageChange,
  onSendMessage,
}: ChatInputProps) {
  return (
    <form onSubmit={onSendMessage} className="p-4 border-t bg-white">
      <div className="flex gap-2">
        <Input
          value={newMessage}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Написать сообщение..."
          className="flex-1"
          disabled={isSending}
        />
        <Button
          type="submit"
          disabled={!newMessage.trim() || isSending}
          className="bg-gradient-to-r from-pink-600 to-orange-600"
        >
          {isSending ? (
            <Icon name="Loader2" size={20} className="animate-spin" />
          ) : (
            <Icon name="Send" size={20} />
          )}
        </Button>
      </div>
    </form>
  );
}
