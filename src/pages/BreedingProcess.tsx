import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const BREEDING_API_URL = 'https://functions.poehali.dev/9e55c198-d835-49ca-a996-fcdab68dad27';

interface User {
  id: number;
  name?: string;
}

interface BreedingStage {
  id: string;
  name: string;
  description: string;
  icon: string;
  completed: boolean;
}

interface BreedingProcessData {
  id: number;
  chat_id: number;
  current_stage: string;
  meeting_date: string;
  meeting_time: string;
  location: string;
  address?: string;
  with_vet: boolean;
  vet_id?: number;
  vet_name?: string;
  pet1_name: string;
  pet2_name: string;
  owner1_name: string;
  owner2_name: string;
  stages: BreedingStage[];
}

export default function BreedingProcess() {
  const [user, setUser] = useState<User | null>(null);
  const [process, setProcess] = useState<BreedingProcessData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const STAGES: BreedingStage[] = [
    {
      id: 'planning',
      name: 'Планирование',
      description: 'Согласование деталей встречи',
      icon: 'Calendar',
      completed: false,
    },
    {
      id: 'acquaintance',
      name: 'Знакомство',
      description: 'Собаки знакомятся друг с другом',
      icon: 'Users',
      completed: false,
    },
    {
      id: 'first_mating',
      name: 'Первая вязка',
      description: 'Основной процесс вязки',
      icon: 'Heart',
      completed: false,
    },
    {
      id: 'control_mating',
      name: 'Контрольная вязка',
      description: 'Повторная вязка через 24-48 часов',
      icon: 'RefreshCw',
      completed: false,
    },
    {
      id: 'completed',
      name: 'Завершение',
      description: 'Процесс успешно завершен',
      icon: 'CheckCircle',
      completed: false,
    },
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadProcess();
    }
  }, [user]);

  const loadProcess = async () => {
    setIsLoading(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const processId = urlParams.get('id');
      
      if (!processId) {
        window.location.href = '/chats';
        return;
      }

      const response = await fetch(`${BREEDING_API_URL}?process_id=${processId}`);
      const data = await response.json();
      setProcess(data);
    } catch (error) {
      console.error('Failed to load process:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStage = async (stageId: string) => {
    if (!process || !user) return;

    try {
      await fetch(BREEDING_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_stage',
          process_id: process.id,
          stage_id: stageId,
          user_id: user.id,
        }),
      });

      loadProcess();
    } catch (error) {
      console.error('Failed to update stage:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Войдите в аккаунт</h2>
          <Button onClick={() => (window.location.href = '/profile')}>Войти</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <Icon name="Loader2" size={48} className="animate-spin text-pink-600" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Icon name="AlertCircle" size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Процесс не найден</h2>
          <Button onClick={() => (window.location.href = '/chats')}>Вернуться к чатам</Button>
        </div>
      </div>
    );
  }

  const currentStageIndex = STAGES.findIndex((s) => s.id === process.current_stage);
  const updatedStages = STAGES.map((stage, index) => ({
    ...stage,
    completed: index < currentStageIndex,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => (window.location.href = '/chats')}
            className="mb-4"
          >
            <Icon name="ArrowLeft" size={20} />
            Назад к чатам
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Процесс вязки</h1>
          <p className="text-gray-600 mt-1">
            {process.pet1_name} и {process.pet2_name}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Icon name="Info" size={24} className="text-pink-600" />
            Детали встречи
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Icon name="Calendar" size={20} className="text-gray-600 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Дата и время</div>
                <div className="font-semibold text-gray-800">
                  {new Date(process.meeting_date).toLocaleDateString('ru-RU')} в {process.meeting_time}
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Icon name="MapPin" size={20} className="text-gray-600 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Место</div>
                <div className="font-semibold text-gray-800">
                  {process.location === 'male_home' ? 'Дом самца' : process.address || 'Нейтральная территория'}
                </div>
              </div>
            </div>
            {process.with_vet && (
              <div className="flex items-start gap-3">
                <Icon name="Stethoscope" size={20} className="text-blue-600 mt-1" />
                <div>
                  <div className="text-sm text-gray-600">Ветеринар</div>
                  <div className="font-semibold text-gray-800">{process.vet_name || 'Не назначен'}</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3">
              <Icon name="Users" size={20} className="text-gray-600 mt-1" />
              <div>
                <div className="text-sm text-gray-600">Владельцы</div>
                <div className="font-semibold text-gray-800">
                  {process.owner1_name} и {process.owner2_name}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Icon name="ListChecks" size={24} className="text-pink-600" />
            Этапы процесса
          </h2>

          <div className="space-y-4">
            {updatedStages.map((stage, index) => {
              const isCurrent = stage.id === process.current_stage;
              const isCompleted = stage.completed;
              const isNext = index === currentStageIndex + 1;

              return (
                <div
                  key={stage.id}
                  className={`relative p-6 rounded-xl border-2 transition-all ${
                    isCurrent
                      ? 'border-pink-600 bg-pink-50'
                      : isCompleted
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        isCurrent
                          ? 'bg-pink-600 text-white'
                          : isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? (
                        <Icon name="Check" size={24} />
                      ) : (
                        <Icon name={stage.icon as any} size={24} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-bold text-gray-800">{stage.name}</h3>
                        {isCurrent && (
                          <span className="px-3 py-1 bg-pink-600 text-white text-sm font-semibold rounded-full">
                            Текущий этап
                          </span>
                        )}
                        {isCompleted && (
                          <span className="px-3 py-1 bg-green-600 text-white text-sm font-semibold rounded-full">
                            Завершен
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{stage.description}</p>
                      {isCurrent && isNext === false && (
                        <Button
                          onClick={() => handleUpdateStage(updatedStages[index + 1]?.id)}
                          className="bg-gradient-to-r from-pink-600 to-orange-600"
                          size="sm"
                        >
                          <Icon name="Check" size={16} />
                          Завершить этап
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {process.current_stage === 'completed' && (
          <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-8 text-center">
            <Icon name="PartyPopper" size={64} className="mx-auto mb-4 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Поздравляем!</h2>
            <p className="text-gray-600 mb-4">
              Процесс вязки успешно завершен. Желаем здорового потомства!
            </p>
            <Button onClick={() => (window.location.href = '/chats')}>
              Вернуться к чатам
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}