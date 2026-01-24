import { ChatGPTPlaygroundPage } from '@/components/extensions/chatgpt-polza/ChatGPTPlaygroundPage';

const API_URL = 'https://functions.poehali.dev/6d3cd242-9636-4e54-8c4e-4a4eef817b6f';

export default function ChatGPTPage() {
  return (
    <ChatGPTPlaygroundPage
      apiUrl={API_URL}
      defaultModel="openai/gpt-4o-mini"
    />
  );
}
