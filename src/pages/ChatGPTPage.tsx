import { useState, useEffect, useRef, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { useChatGPT } from '@/components/extensions/chatgpt-polza/useChatGPT';

const API_URL = 'https://functions.poehali.dev/6d3cd242-9636-4e54-8c4e-4a4eef817b6f';

const SYSTEM_PROMPT = `Ты — Анна, эксперт-консультант по вязке собак на платформе TinDog. 

ВАЖНО: Ты реальный человек, не ИИ. Представляйся как Анна, консультант TinDog.

Твоя задача — помогать владельцам собак в вопросах:
- Подготовка к вязке (когда лучше вязать, как подготовить собаку)
- Процесс вязки (как проходит встреча, что нужно знать)
- Выбор партнёра (на что обратить внимание, совместимость пород)
- Документы и родословные (РКФ, паспорта, родословные)
- Здоровье и ветеринарные вопросы (анализы, прививки, противопоказания)
- Договорённости между владельцами (оплата, условия, алиментные щенки)
- Беременность и роды (признаки, подготовка, уход)
- Юридические аспекты и законодательство

Стиль общения:
- Тёплый, человечный стиль (как будто пишешь другу)
- Используй эмодзи там где уместно 🐕
- Обращайся на "ты", будь дружелюбной
- Иногда используй разговорные фразы
- Можешь написать "Понимаю вашу ситуацию", "Отличный вопрос!"
- Если нужно — рекомендуй обратиться к ветеринару или кинологу
- При необходимости уточняй детали (порода, возраст, опыт владельца)

Помни: ты помогаешь реальным людям принимать важные решения о здоровье и разведении их питомцев.`;

const QUICK_QUESTIONS = [
  'Когда лучше вязать собаку в первый раз?',
  'Какие анализы нужны перед вязкой?',
  'Как проходит процесс вязки?',
  'Что такое алиментные щенки?',
  'Нужна ли родословная РКФ?',
  'Как выбрать подходящего партнёра?',
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatGPTPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { generate, isLoading } = useChatGPT({ apiUrl: API_URL });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    const apiMessages = [{ role: 'system' as const, content: SYSTEM_PROMPT }];
    messages.forEach((msg) => {
      apiMessages.push({ role: msg.role, content: msg.content });
    });
    apiMessages.push({ role: 'user' as const, content: text });

    const result = await generate({ messages: apiMessages, model: 'openai/gpt-4o-mini' });

    if (result.success && result.content) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: result.content!,
          timestamp: new Date(),
        },
      ]);
    } else {
      console.error('ChatGPT error:', result.error);
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Извините, произошла ошибка. Попробуйте еще раз 😔',
          timestamp: new Date(),
        },
      ]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => (window.location.href = '/chats')} className="lg:hidden">
                <Icon name="ArrowLeft" size={24} className="text-gray-600" />
              </button>
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">А</span>
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Анна</h1>
                <p className="text-sm text-gray-500">Консультант • онлайн</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" onClick={() => (window.location.href = '/')}>
                <Icon name="Home" size={24} />
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/likes')}>
                <Icon name="Heart" size={24} />
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/chats')}>
                <Icon name="MessageCircle" size={24} />
              </Button>
              <Button variant="ghost" onClick={() => (window.location.href = '/profile')}>
                <Icon name="User" size={24} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4" style={{ height: 'calc(100vh - 88px)' }}>
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center mb-4">
                  <span className="text-white font-bold text-3xl">А</span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Привет! Я Анна 👋
                </h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  Эксперт по вязке собак. Помогу с подготовкой, документами и всеми вопросами о разведении
                </p>

                <div className="w-full max-w-2xl">
                  <p className="text-sm text-gray-500 mb-3">Популярные вопросы:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {QUICK_QUESTIONS.map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickQuestion(question)}
                        className="px-4 py-3 bg-white hover:bg-pink-50 rounded-xl text-sm text-left transition-all border border-gray-200 hover:border-pink-300 hover:shadow-sm"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">А</span>
                      </div>
                    )}
                    <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[75%]`}>
                      <div
                        className={`px-4 py-3 rounded-2xl ${
                          msg.role === 'user'
                            ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                      <span className="text-xs text-gray-400 mt-1 px-2">{formatTime(msg.timestamp)}</span>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                        <Icon name="User" size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-orange-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">А</span>
                    </div>
                    <div className="bg-white border border-gray-200 px-6 py-4 rounded-2xl">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-3">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder="Напишите сообщение..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm focus:outline-none placeholder-gray-400 disabled:opacity-50 max-h-[120px]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="p-3 bg-gradient-to-r from-pink-500 to-orange-500 text-white rounded-xl hover:from-pink-600 hover:to-orange-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Icon name="Send" size={20} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}