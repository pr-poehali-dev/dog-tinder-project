import { ChatGPTPlayground } from '@/components/extensions/chatgpt-polza/ChatGPTPlayground';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const API_URL = 'https://functions.poehali.dev/6d3cd242-9636-4e54-8c4e-4a4eef817b6f';

const SYSTEM_PROMPT = `Ты — эксперт-консультант по вязке собак на платформе TinDog. 

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
- Дружелюбный, понятный язык без сложных терминов
- Конкретные советы и рекомендации
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

export default function ChatGPTPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-2 rounded-xl">
                <Icon name="Bot" size={28} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent">
                  Поддержка TinDog
                </h1>
                <p className="text-sm text-gray-600">Консультации по вязке собак</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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

      <div className="container mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <ChatGPTPlayground
            apiUrl={API_URL}
            defaultModel="openai/gpt-4o-mini"
            systemPrompt={SYSTEM_PROMPT}
            title="Чат с экспертом"
            placeholder="Задайте вопрос о вязке, здоровье собаки или процессе..."
            quickQuestions={QUICK_QUESTIONS}
          />
        </div>
      </div>
    </div>
  );
}