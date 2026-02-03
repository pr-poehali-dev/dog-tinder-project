import { Button } from '@/components/ui/button';

interface Filters {
  city: string;
  gender: string;
  breed: string;
  rank: string;
  minAge: number;
  maxAge: number;
  maxDistance: number;
  minPrice: number;
  maxPrice: number;
}

interface FiltersPanelProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function FiltersPanel({ filters, onFiltersChange, onReset, onClose }: FiltersPanelProps) {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Город</label>
            <input
              list="filter-cities-list"
              value={filters.city}
              onChange={(e) => onFiltersChange({ ...filters, city: e.target.value })}
              placeholder="Начните вводить город..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <datalist id="filter-cities-list">
              <option value="">Все города</option>
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
              <option value="Братск">Братск</option>
              <option value="Южно-Сахалинск">Южно-Сахалинск</option>
            </datalist>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Пол</label>
            <select
              value={filters.gender}
              onChange={(e) => onFiltersChange({ ...filters, gender: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Все</option>
              <option value="Кобель">Кобель</option>
              <option value="Сука">Сука</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Порода</label>
            <input
              type="text"
              value={filters.breed}
              onChange={(e) => onFiltersChange({ ...filters, breed: e.target.value })}
              placeholder="Например: хаски"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ранг/Титул</label>
            <select
              value={filters.rank}
              onChange={(e) => onFiltersChange({ ...filters, rank: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              <option value="">Все ранги</option>
              <option value="Чемпион России">Чемпион России</option>
              <option value="Чемпион РКФ">Чемпион РКФ</option>
              <option value="Юный чемпион">Юный чемпион</option>
              <option value="Кандидат в чемпионы">Кандидат в чемпионы</option>
              <option value="Гранд чемпион">Гранд чемпион</option>
              <option value="Чемпион НКП">Чемпион НКП</option>
              <option value="Элитный производитель">Элитный производитель</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Возраст: {filters.minAge} - {filters.maxAge} лет
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="0"
                max="15"
                value={filters.minAge}
                onChange={(e) => onFiltersChange({ ...filters, minAge: Number(e.target.value) })}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="15"
                value={filters.maxAge}
                onChange={(e) => onFiltersChange({ ...filters, maxAge: Number(e.target.value) })}
                className="flex-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Расстояние: до {filters.maxDistance} км
            </label>
            <input
              type="range"
              min="10"
              max="500"
              step="10"
              value={filters.maxDistance}
              onChange={(e) => onFiltersChange({ ...filters, maxDistance: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цена за вязку: {filters.minPrice.toLocaleString('ru-RU')} - {filters.maxPrice.toLocaleString('ru-RU')} ₽
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={filters.minPrice}
                onChange={(e) => onFiltersChange({ ...filters, minPrice: Number(e.target.value) })}
                className="flex-1"
              />
              <input
                type="range"
                min="0"
                max="100000"
                step="5000"
                value={filters.maxPrice}
                onChange={(e) => onFiltersChange({ ...filters, maxPrice: Number(e.target.value) })}
                className="flex-1"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">0 ₽ = бесплатно или договорная</p>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onReset} className="flex-1">
            Сбросить
          </Button>
          <Button onClick={onClose} className="flex-1">
            Применить
          </Button>
        </div>
      </div>
    </div>
  );
}
