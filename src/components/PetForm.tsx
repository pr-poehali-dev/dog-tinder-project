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

        const photoResponse = await fetch(PETS_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upload_photo', image: base64Photo }),
        });
        
        setIsCheckingPhoto(false);
        
        if (!photoResponse.ok) {
          const errorData = await photoResponse.json();
          throw new Error(errorData.error || 'Не удалось загрузить фото');
        }
        
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
                      <Icon name="Loader2" size={32} className="animate-spin text-white" />
                    </div>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </label>
            </div>
            <p className="text-center text-sm text-gray-500 mb-4">
              Загрузите фото вашей собаки
            </p>

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
                <input
                  list="breeds-list"
                  value={formData.breed}
                  onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                  placeholder="Начните вводить породу..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <datalist id="breeds-list">
                  <option value="">Выберите породу</option>
                  <option value="Австралийская овчарка">Австралийская овчарка</option>
                  <option value="Австралийский терьер">Австралийский терьер</option>
                  <option value="Акита-ину">Акита-ину</option>
                  <option value="Аляскинский маламут">Аляскинский маламут</option>
                  <option value="Американский бульдог">Американский бульдог</option>
                  <option value="Американский кокер-спаниель">Американский кокер-спаниель</option>
                  <option value="Американский питбультерьер">Американский питбультерьер</option>
                  <option value="Американский стаффордширский терьер">Американский стаффордширский терьер</option>
                  <option value="Английский бульдог">Английский бульдог</option>
                  <option value="Английский кокер-спаниель">Английский кокер-спаниель</option>
                  <option value="Английский мастиф">Английский мастиф</option>
                  <option value="Английский сеттер">Английский сеттер</option>
                  <option value="Аргентинский дог">Аргентинский дог</option>
                  <option value="Афганская борзая">Афганская борзая</option>
                  <option value="Басенджи">Басенджи</option>
                  <option value="Бассет-хаунд">Бассет-хаунд</option>
                  <option value="Бедлингтон-терьер">Бедлингтон-терьер</option>
                  <option value="Белая швейцарская овчарка">Белая швейцарская овчарка</option>
                  <option value="Бельгийская овчарка">Бельгийская овчарка</option>
                  <option value="Бернский зенненхунд">Бернский зенненхунд</option>
                  <option value="Бигль">Бигль</option>
                  <option value="Бишон фризе">Бишон фризе</option>
                  <option value="Бладхаунд">Бладхаунд</option>
                  <option value="Бобтейл">Бобтейл</option>
                  <option value="Боксер">Боксер</option>
                  <option value="Большой пудель">Большой пудель</option>
                  <option value="Бордер-колли">Бордер-колли</option>
                  <option value="Бордер-терьер">Бордер-терьер</option>
                  <option value="Бордоский дог">Бордоский дог</option>
                  <option value="Бостон-терьер">Бостон-терьер</option>
                  <option value="Бульмастиф">Бульмастиф</option>
                  <option value="Бультерьер">Бультерьер</option>
                  <option value="Вельш-корги кардиган">Вельш-корги кардиган</option>
                  <option value="Вельш-корги пемброк">Вельш-корги пемброк</option>
                  <option value="Венгерская выжла">Венгерская выжла</option>
                  <option value="Вест-хайленд-уайт-терьер">Вест-хайленд-уайт-терьер</option>
                  <option value="Восточноевропейская овчарка">Восточноевропейская овчарка</option>
                  <option value="Голден ретривер">Голден ретривер</option>
                  <option value="Далматин">Далматин</option>
                  <option value="Джек-рассел-терьер">Джек-рассел-терьер</option>
                  <option value="Доберман">Доберман</option>
                  <option value="Дратхаар">Дратхаар</option>
                  <option value="Ирландский волкодав">Ирландский волкодав</option>
                  <option value="Ирландский сеттер">Ирландский сеттер</option>
                  <option value="Йоркширский терьер">Йоркширский терьер</option>
                  <option value="Кавалер-кинг-чарльз-спаниель">Кавалер-кинг-чарльз-спаниель</option>
                  <option value="Кавказская овчарка">Кавказская овчарка</option>
                  <option value="Кане-корсо">Кане-корсо</option>
                  <option value="Карликовый пинчер">Карликовый пинчер</option>
                  <option value="Карликовый пудель">Карликовый пудель</option>
                  <option value="Карликовый шпиц">Карликовый шпиц</option>
                  <option value="Китайская хохлатая">Китайская хохлатая</option>
                  <option value="Колли">Колли</option>
                  <option value="Курцхаар">Курцхаар</option>
                  <option value="Лабрадор">Лабрадор</option>
                  <option value="Левретка">Левретка</option>
                  <option value="Леонбергер">Леонбергер</option>
                  <option value="Мальтезе">Мальтезе</option>
                  <option value="Мастино неаполитано">Мастино неаполитано</option>
                  <option value="Миттельшнауцер">Миттельшнауцер</option>
                  <option value="Мопс">Мопс</option>
                  <option value="Московская сторожевая">Московская сторожевая</option>
                  <option value="Немецкая овчарка">Немецкая овчарка</option>
                  <option value="Немецкий дог">Немецкий дог</option>
                  <option value="Немецкий шпиц">Немецкий шпиц</option>
                  <option value="Ньюфаундленд">Ньюфаундленд</option>
                  <option value="Папильон">Папильон</option>
                  <option value="Пекинес">Пекинес</option>
                  <option value="Померанский шпиц">Померанский шпиц</option>
                  <option value="Пудель">Пудель</option>
                  <option value="Ризеншнауцер">Ризеншнауцер</option>
                  <option value="Родезийский риджбек">Родезийский риджбек</option>
                  <option value="Ротвейлер">Ротвейлер</option>
                  <option value="Русская псовая борзая">Русская псовая борзая</option>
                  <option value="Русский той">Русский той</option>
                  <option value="Русский черный терьер">Русский черный терьер</option>
                  <option value="Самоедская собака">Самоедская собака</option>
                  <option value="Сенбернар">Сенбернар</option>
                  <option value="Сиба-ину">Сиба-ину</option>
                  <option value="Сибирский хаски">Сибирский хаски</option>
                  <option value="Стаффордширский бультерьер">Стаффордширский бультерьер</option>
                  <option value="Такса">Такса</option>
                  <option value="Тибетский мастиф">Тибетский мастиф</option>
                  <option value="Той-пудель">Той-пудель</option>
                  <option value="Уиппет">Уиппет</option>
                  <option value="Фараонова собака">Фараонова собака</option>
                  <option value="Фокстерьер">Фокстерьер</option>
                  <option value="Французский бульдог">Французский бульдог</option>
                  <option value="Цвергшнауцер">Цвергшнауцер</option>
                  <option value="Чау-чау">Чау-чау</option>
                  <option value="Чихуахуа">Чихуахуа</option>
                  <option value="Шарпей">Шарпей</option>
                  <option value="Ши-тцу">Ши-тцу</option>
                  <option value="Шелти">Шелти</option>
                  <option value="Эрдельтерьер">Эрдельтерьер</option>
                  <option value="Южноафриканский бурбуль">Южноафриканский бурбуль</option>
                  <option value="Японский хин">Японский хин</option>
                  <option value="Метис">Метис</option>
                  <option value="Другая порода">Другая порода</option>
                </datalist>
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
                <input
                  list="cities-list"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Начните вводить город..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                <datalist id="cities-list">
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
                  <option value="Барнаул">Барнаул</option>
                  <option value="Ульяновск">Ульяновск</option>
                  <option value="Иркутск">Иркутск</option>
                  <option value="Хабаровск">Хабаровск</option>
                  <option value="Ярославль">Ярославль</option>
                  <option value="Владивосток">Владивосток</option>
                  <option value="Махачкала">Махачкала</option>
                  <option value="Томск">Томск</option>
                  <option value="Оренбург">Оренбург</option>
                  <option value="Кемерово">Кемерово</option>
                  <option value="Новокузнецк">Новокузнецк</option>
                  <option value="Рязань">Рязань</option>
                  <option value="Астрахань">Астрахань</option>
                  <option value="Набережные Челны">Набережные Челны</option>
                  <option value="Пенза">Пенза</option>
                  <option value="Липецк">Липецк</option>
                  <option value="Киров">Киров</option>
                  <option value="Чебоксары">Чебоксары</option>
                  <option value="Калининград">Калининград</option>
                  <option value="Тула">Тула</option>
                  <option value="Курск">Курск</option>
                  <option value="Ставрополь">Ставрополь</option>
                  <option value="Улан-Удэ">Улан-Удэ</option>
                  <option value="Сочи">Сочи</option>
                  <option value="Магнитогорск">Магнитогорск</option>
                  <option value="Брянск">Брянск</option>
                  <option value="Иваново">Иваново</option>
                  <option value="Белгород">Белгород</option>
                  <option value="Архангельск">Архангельск</option>
                  <option value="Владимир">Владимир</option>
                  <option value="Сургут">Сургут</option>
                  <option value="Калуга">Калуга</option>
                  <option value="Чита">Чита</option>
                  <option value="Смоленск">Смоленск</option>
                  <option value="Волжский">Волжский</option>
                  <option value="Курган">Курган</option>
                  <option value="Орел">Орел</option>
                  <option value="Череповец">Череповец</option>
                  <option value="Вологда">Вологда</option>
                  <option value="Владикавказ">Владикавказ</option>
                  <option value="Мурманск">Мурманск</option>
                  <option value="Саранск">Саранск</option>
                  <option value="Якутск">Якутск</option>
                  <option value="Тамбов">Тамбов</option>
                  <option value="Грозный">Грозный</option>
                  <option value="Стерлитамак">Стерлитамак</option>
                  <option value="Кострома">Кострома</option>
                  <option value="Петрозаводск">Петрозаводск</option>
                  <option value="Нижний Тагил">Нижний Тагил</option>
                  <option value="Новороссийск">Новороссийск</option>
                  <option value="Йошкар-Ола">Йошкар-Ола</option>
                  <option value="Химки">Химки</option>
                  <option value="Таганрог">Таганрог</option>
                  <option value="Комсомольск-на-Амуре">Комсомольск-на-Амуре</option>
                  <option value="Сыктывкар">Сыктывкар</option>
                  <option value="Нижневартовск">Нижневартовск</option>
                  <option value="Нальчик">Нальчик</option>
                  <option value="Шахты">Шахты</option>
                  <option value="Дзержинск">Дзержинск</option>
                  <option value="Энгельс">Энгельс</option>
                  <option value="Благовещенск">Благовещенск</option>
                  <option value="Подольск">Подольск</option>
                  <option value="Псков">Псков</option>
                  <option value="Балашиха">Балашиха</option>
                  <option value="Орск">Орск</option>
                  <option value="Армавир">Армавир</option>
                  <option value="Королев">Королев</option>
                  <option value="Мытищи">Мытищи</option>
                  <option value="Люберцы">Люберцы</option>
                  <option value="Петропавловск-Камчатский">Петропавловск-Камчатский</option>
                  <option value="Северодвинск">Северодвинск</option>
                  <option value="Новочеркасск">Новочеркасск</option>
                  <option value="Абакан">Абакан</option>
                  <option value="Бийск">Бийск</option>
                  <option value="Прокопьевск">Прокопьевск</option>
                  <option value="Рыбинск">Рыбинск</option>
                  <option value="Великий Новгород">Великий Новгород</option>
                </datalist>
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

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-2">
                <Icon name="AlertCircle" size={20} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isSubmitting || isCheckingPhoto} className="flex-1">
                {isSubmitting || isCheckingPhoto ? (
                  <>
                    <Icon name="Loader2" size={20} className="animate-spin" />
                    {isCheckingPhoto ? 'Проверка фото...' : 'Публикация...'}
                  </>
                ) : (
                  <>
                    <Icon name="Check" size={20} />
                    Опубликовать
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting || isCheckingPhoto} className="flex-1">
                Отмена
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}