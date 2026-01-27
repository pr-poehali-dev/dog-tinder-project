import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

const PETS_API_URL = 'https://functions.poehali.dev/2a5a65c0-df1b-4023-980c-b0601b7c462c';

interface Pet {
  id: number;
  user_id: number;
  name: string;
  breed?: string;
  age?: number;
  gender?: string;
  rank?: string;
  city?: string;
  description?: string;
  photo_url?: string;
  breeding_price?: number;
}

interface PetFormProps {
  userId: number;
  editingPet?: Pet;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function PetForm({ userId, editingPet, onSuccess, onCancel }: PetFormProps) {
  const [formData, setFormData] = useState({
    name: editingPet?.name || '',
    breed: editingPet?.breed || '',
    age: editingPet?.age?.toString() || '',
    gender: editingPet?.gender || 'male',
    rank: editingPet?.rank || '',
    city: editingPet?.city || '',
    description: editingPet?.description || '',
    breeding_price: editingPet?.breeding_price?.toString() || '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(editingPet?.photo_url || '');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [wantsVerification, setWantsVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  const [isCheckingPhoto, setIsCheckingPhoto] = useState(false);

  const calculateRecommendedPrice = (): number | null => {
    const breedPrices: { [key: string]: number } = {
      'хаски': 25000,
      'немецкая овчарка': 20000,
      'лабрадор': 18000,
      'золотистый ретривер': 22000,
      'бульдог': 30000,
      'чихуахуа': 15000,
      'йоркширский терьер': 20000,
      'мопс': 18000,
      'шпиц': 17000,
      'такса': 12000,
      'бишон фризе': 18000,
      'пудель': 16000,
      'корги': 28000,
      'самоед': 27000,
      'акита': 25000,
      'алабай': 15000,
      'кавказская овчарка': 18000,
      'бигль': 15000,
      'боксер': 16000,
      'доберман': 20000,
      'ротвейлер': 18000,
      'джек рассел терьер': 14000,
      'французский бульдог': 35000,
    };

    if (!formData.breed && !formData.rank && !formData.age) {
      return null;
    }

    let basePrice = 15000;

    if (formData.breed) {
      const breedLower = formData.breed.toLowerCase();
      for (const [breed, price] of Object.entries(breedPrices)) {
        if (breedLower.includes(breed)) {
          basePrice = price;
          break;
        }
      }
    }

    if (formData.rank) {
      const rankLower = formData.rank.toLowerCase();
      if (rankLower.includes('чемпион')) basePrice *= 1.5;
      else if (rankLower.includes('кандидат')) basePrice *= 1.3;
      else if (rankLower.includes('элит')) basePrice *= 1.4;
    }

    const age = parseInt(formData.age);
    if (!isNaN(age)) {
      if (age >= 2 && age <= 6) {
        basePrice *= 1.1;
      } else if (age > 8) {
        basePrice *= 0.8;
      }
    }

    return Math.round(basePrice);
  };

  const recommendedPrice = calculateRecommendedPrice();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDocumentFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      let photoUrl = '';

      if (photoFile) {
        setIsCheckingPhoto(true);
        const reader = new FileReader();
        const base64Photo = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        try {
          const photoResponse = await fetch(PETS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'upload_photo', image: base64Photo }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          setIsCheckingPhoto(false);
          
          if (!photoResponse.ok) {
            const errorData = await photoResponse.json();
            throw new Error(errorData.error || 'Не удалось загрузить фото');
          }
          
          const photoData = await photoResponse.json();
          photoUrl = photoData.url;
        } catch (err) {
          clearTimeout(timeoutId);
          setIsCheckingPhoto(false);
          if (err instanceof Error && err.name === 'AbortError') {
            throw new Error('Проверка фото заняла слишком много времени. Попробуйте ещё раз.');
          }
          throw err;
        }
      }

      const petResponse = await fetch(
        PETS_API_URL,
        {
          method: editingPet ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...(editingPet && { pet_id: editingPet.id }),
            user_id: userId,
            name: formData.name,
            breed: formData.breed,
            age: parseInt(formData.age) || null,
            gender: formData.gender,
            rank: formData.rank,
            city: formData.city,
            description: formData.description,
            breeding_price: parseInt(formData.breeding_price) || null,
            photo_url: photoUrl || (editingPet?.photo_url || ''),
          }),
        }
      );
      
      if (!petResponse.ok) {
        throw new Error('Не удалось сохранить данные питомца');
      }
      
      const petData = await petResponse.json();

      if (!petData.pet) {
        throw new Error('Ошибка при сохранении питомца');
      }

      if (documentFile && petData.pet) {
        const reader = new FileReader();
        const base64Doc = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(documentFile);
        });

        await fetch(PETS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'upload_document',
            pet_id: petData.pet.id,
            document: base64Doc,
            document_type: 'passport',
          }),
        });
      }

      if (wantsVerification && petData.pet) {
        await fetch(PETS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'pay_verification',
            pet_id: petData.pet.id,
          }),
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to create pet:', error);
      setError(error instanceof Error ? error.message : 'Произошла ошибка при публикации');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {editingPet ? 'Редактировать питомца' : 'Добавить питомца'}
            </h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <Icon name="X" size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex justify-center mb-4">
              <label className="cursor-pointer">
                <div className="w-32 h-32 rounded-full border-4 border-pink-200 overflow-hidden bg-pink-50 flex items-center justify-center relative">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Camera" size={48} className="text-pink-400" />
                  )}
                  {isCheckingPhoto && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Icon name="Loader2" className="animate-spin text-white" size={32} />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>
            
            {isCheckingPhoto && (
              <div className="text-center text-pink-600 font-medium">
                Проверяем фото... Это может занять до 30 секунд
              </div>
            )}
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Имя *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                required
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Порода</label>
              <input
                type="text"
                value={formData.breed}
                onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Например: Хаски"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Возраст</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                  placeholder="Лет"
                />
              </div>
              
              <div>
                <label className="block text-gray-700 font-medium mb-2">Пол</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="male">Мальчик</option>
                  <option value="female">Девочка</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Город</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Например: Москва"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Звание/Титул</label>
              <input
                type="text"
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Например: Чемпион России"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400 h-24"
                placeholder="Расскажите о своём питомце..."
              />
            </div>
            
            <div>
              <label className="block text-gray-700 font-medium mb-2">Цена вязки (₽)</label>
              <input
                type="number"
                value={formData.breeding_price}
                onChange={(e) => setFormData({ ...formData, breeding_price: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                placeholder="Укажите цену"
              />
              {recommendedPrice && (
                <p className="text-sm text-gray-500 mt-1">
                  Рекомендуемая цена: {recommendedPrice.toLocaleString()} ₽
                </p>
              )}
            </div>
            
            <div className="border-t pt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-800">Верификация</h3>
              
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">
                  Документы (паспорт, родословная)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleDocumentChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                {documentFile && (
                  <p className="text-sm text-green-600 mt-1">✓ {documentFile.name}</p>
                )}
              </div>
              
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsVerification}
                  onChange={(e) => setWantsVerification(e.target.checked)}
                  className="w-5 h-5 text-pink-500 rounded focus:ring-2 focus:ring-pink-400"
                />
                <span className="text-gray-700">
                  Оплатить верификацию (500 ₽) - получите галочку подтверждения
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting || isCheckingPhoto}
                className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-3 rounded-lg hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Сохранение...' : (editingPet ? 'Сохранить' : 'Опубликовать')}
              </Button>
              <Button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting || isCheckingPhoto}
                className="px-6 bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
