import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const PETS_API_URL = 'https://functions.poehali.dev/c7b05c84-a7a2-404e-a1f0-a80c56816d60';

export default function CreatePetProfile() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    breed: '',
    age: '',
    description: '',
    photos: [] as string[]
  });

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const accessToken = localStorage.getItem('access_token');
      
      if (!accessToken) {
        toast({
          title: "Ошибка",
          description: "Не удалось авторизоваться",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      const response = await fetch(`${PETS_API_URL}?action=create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: formData.name,
          gender: formData.gender,
          breed: formData.breed,
          age: parseInt(formData.age),
          description: formData.description,
          photos: formData.photos.length > 0 ? formData.photos : ['https://images.unsplash.com/photo-1560807707-8cc77767d783']
        })
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Профиль создан!",
          description: "Теперь можно искать друзей для питомца",
        });
        navigate('/feed', { replace: true });
      } else {
        toast({
          title: "Ошибка",
          description: data.error || "Не удалось создать профиль",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating pet:', error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать профиль",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = formData.name && formData.gender && formData.breed && formData.age;

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-pink-600 to-orange-600 rounded-full mb-4">
            <Icon name="Heart" className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-orange-600 bg-clip-text text-transparent mb-2">
            Создай профиль питомца
          </h1>
          <p className="text-gray-600">
            Расскажи о своем питомце, чтобы начать поиск друзей
          </p>
        </div>

        <div className="space-y-6">
          {/* Пол питомца */}
          <div className="space-y-3">
            <Label>Пол питомца</Label>
            <RadioGroup
              value={formData.gender}
              onValueChange={(value) => setFormData({ ...formData, gender: value })}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem value="male" id="male" className="peer sr-only" />
                <Label
                  htmlFor="male"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-blue-500 peer-data-[state=checked]:bg-blue-50 cursor-pointer transition-all"
                >
                  <Icon name="Dog" className="w-12 h-12 mb-2 text-blue-500" />
                  <span className="text-sm font-medium">Мальчик</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="female" id="female" className="peer sr-only" />
                <Label
                  htmlFor="female"
                  className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 bg-white p-4 hover:bg-gray-50 peer-data-[state=checked]:border-pink-500 peer-data-[state=checked]:bg-pink-50 cursor-pointer transition-all"
                >
                  <Icon name="Cat" className="w-12 h-12 mb-2 text-pink-500" />
                  <span className="text-sm font-medium">Девочка</span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Имя питомца */}
          <div className="space-y-2">
            <Label htmlFor="name">Кличка питомца</Label>
            <Input
              id="name"
              placeholder="Например: Барон"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Порода */}
          <div className="space-y-2">
            <Label htmlFor="breed">Порода</Label>
            <Input
              id="breed"
              placeholder="Например: Лабрадор"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
            />
          </div>

          {/* Возраст */}
          <div className="space-y-2">
            <Label htmlFor="age">Возраст (лет)</Label>
            <Input
              id="age"
              type="number"
              placeholder="Например: 3"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>

          {/* Описание */}
          <div className="space-y-2">
            <Label htmlFor="description">О питомце (необязательно)</Label>
            <Textarea
              id="description"
              placeholder="Расскажи о характере, привычках..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Кнопка создания */}
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            className="w-full bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700 text-white py-6 text-lg"
          >
            {loading ? (
              <>
                <Icon name="Loader2" className="w-5 h-5 mr-2 animate-spin" />
                Создаём профиль...
              </>
            ) : (
              <>
                <Icon name="Heart" className="w-5 h-5 mr-2" />
                Создать профиль
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
