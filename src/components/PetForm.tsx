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

    try {
      let photoUrl = '';

      if (photoFile) {
        const reader = new FileReader();
        const base64Photo = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(photoFile);
        });

        const photoResponse = await fetch(PETS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload_photo', image: base64Photo }),
        });
        const photoData = await photoResponse.json();
        photoUrl = photoData.url;
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
      const petData = await petResponse.json();

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
                <div className="w-32 h-32 rounded-full border-4 border-pink-200 overflow-hidden bg-pink-50 flex items-center justify-center">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="Camera" size={48} className="text-pink-400" />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Кличка *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="Рекс"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Порода</label>
                <select
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Выберите породу</option>
                  <option value="Хаски">Хаски</option>
                  <option value="Немецкая овчарка">Немецкая овчарка</option>
                  <option value="Лабрадор">Лабрадор</option>
                  <option value="Золотистый ретривер">Золотистый ретривер</option>
                  <option value="Французский бульдог">Французский бульдог</option>
                  <option value="Английский бульдог">Английский бульдог</option>
                  <option value="Корги">Корги</option>
                  <option value="Самоед">Самоед</option>
                  <option value="Йоркширский терьер">Йоркширский терьер</option>
                  <option value="Чихуахуа">Чихуахуа</option>
                  <option value="Мопс">Мопс</option>
                  <option value="Шпиц">Шпиц</option>
                  <option value="Такса">Такса</option>
                  <option value="Бишон фризе">Бишон фризе</option>
                  <option value="Пудель">Пудель</option>
                  <option value="Акита">Акита</option>
                  <option value="Алабай">Алабай</option>
                  <option value="Кавказская овчарка">Кавказская овчарка</option>
                  <option value="Бигль">Бигль</option>
                  <option value="Боксер">Боксер</option>
                  <option value="Доберман">Доберман</option>
                  <option value="Ротвейлер">Ротвейлер</option>
                  <option value="Джек рассел терьер">Джек рассел терьер</option>
                  <option value="Другая">Другая порода</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Возраст (лет)</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="male">Кобель</option>
                  <option value="female">Сука</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ранг/Титул</label>
                <select
                  value={formData.rank}
                  onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Без ранга</option>
                  <option value="Чемпион России">Чемпион России</option>
                  <option value="Чемпион РКФ">Чемпион РКФ</option>
                  <option value="Юный чемпион">Юный чемпион</option>
                  <option value="Кандидат в чемпионы">Кандидат в чемпионы</option>
                  <option value="Гранд чемпион">Гранд чемпион</option>
                  <option value="Чемпион НКП">Чемпион НКП</option>
                  <option value="Элитный производитель">Элитный производитель</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">Выберите город</option>
                  <option value="Москва">Москва</option>
                  <option value="Санкт-Петербург">Санкт-Петербург</option>
                  <option value="Новосибирск">Новосибирск</option>
                  <option value="Екатеринбург">Екатеринбург</option>
                  <option value="Казань">Казань</option>
                  <option value="Нижний Новгород">Нижний Новгород</option>
                  <option value="Челябинск">Челябинск</option>
                  <option value="Самара">Самара</option>
                  <option value="Омск">Омск</option>
                  <option value="Ростов-на-Дону">Ростов-на-Дону</option>
                  <option value="Уфа">Уфа</option>
                  <option value="Красноярск">Красноярск</option>
                  <option value="Воронеж">Воронеж</option>
                  <option value="Пермь">Пермь</option>
                  <option value="Волгоград">Волгоград</option>
                  <option value="Краснодар">Краснодар</option>
                  <option value="Саратов">Саратов</option>
                  <option value="Тюмень">Тюмень</option>
                  <option value="Тольятти">Тольятти</option>
                  <option value="Ижевск">Ижевск</option>
                </select>
              </div>

              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Цена за вязку (₽)</label>
                  {recommendedPrice && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, breeding_price: recommendedPrice.toString() })}
                      className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                    >
                      <Icon name="Sparkles" size={14} />
                      Рекомендуемая: {recommendedPrice.toLocaleString('ru-RU')} ₽
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  value={formData.breeding_price}
                  onChange={(e) => setFormData({ ...formData, breeding_price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder={recommendedPrice ? recommendedPrice.toString() : "10000"}
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {recommendedPrice 
                    ? `Рекомендация основана на породе, ранге и возрасте. Вы можете изменить цену.`
                    : 'Оставьте пустым, если бесплатно или договорная'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                rows={3}
                placeholder="Расскажите о вашем питомце"
              />
            </div>

            <div className="bg-pink-50 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Icon name="FileText" size={16} className="inline mr-2" />
                Паспорт питомца
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentChange}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-100 file:text-pink-700 hover:file:bg-pink-200"
              />
              {documentFile && (
                <p className="text-sm text-gray-600 mt-2">Выбран: {documentFile.name}</p>
              )}
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantsVerification}
                  onChange={(e) => setWantsVerification(e.target.checked)}
                  className="mt-1"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Icon name="ShieldCheck" size={20} className="text-yellow-600" />
                    <span className="font-semibold text-gray-800">Проверка документов</span>
                    <span className="text-yellow-700 font-bold">500 ₽</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Профессиональная проверка паспорта питомца. Повышает доверие к объявлению.
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <Icon name="Loader2" size={20} className="animate-spin" />
                ) : (
                  <Icon name="Check" size={20} />
                )}
                Опубликовать
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}