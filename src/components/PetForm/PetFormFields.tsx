import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormData {
  name: string;
  breed: string;
  age: string;
  gender: string;
  rank: string;
  city: string;
  description: string;
  breeding_price: string;
}

interface PetFormFieldsProps {
  formData: FormData;
  onFormChange: (field: keyof FormData, value: string) => void;
  recommendedPrice: number | null;
}

export default function PetFormFields({ 
  formData, 
  onFormChange, 
  recommendedPrice 
}: PetFormFieldsProps) {
  return (
    <>
      <div>
        <Label htmlFor="name">Кличка питомца</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => onFormChange('name', e.target.value)}
          required
          placeholder="Например: Бобик"
        />
      </div>

      <div>
        <Label htmlFor="breed">Порода</Label>
        <Input
          id="breed"
          value={formData.breed}
          onChange={(e) => onFormChange('breed', e.target.value)}
          placeholder="Например: Хаски"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="age">Возраст (лет)</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => onFormChange('age', e.target.value)}
            placeholder="3"
          />
        </div>

        <div>
          <Label htmlFor="gender">Пол</Label>
          <Select value={formData.gender} onValueChange={(value) => onFormChange('gender', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Мальчик</SelectItem>
              <SelectItem value="female">Девочка</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="city">Город</Label>
        <Input
          id="city"
          value={formData.city}
          onChange={(e) => onFormChange('city', e.target.value)}
          placeholder="Москва"
        />
      </div>

      <div>
        <Label htmlFor="rank">Звание/награды</Label>
        <Input
          id="rank"
          value={formData.rank}
          onChange={(e) => onFormChange('rank', e.target.value)}
          placeholder="Чемпион России"
        />
      </div>

      <div>
        <Label htmlFor="description">Описание</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => onFormChange('description', e.target.value)}
          placeholder="Расскажите о характере и особенностях..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="breeding_price">Стоимость вязки (₽)</Label>
        <Input
          id="breeding_price"
          type="number"
          value={formData.breeding_price}
          onChange={(e) => onFormChange('breeding_price', e.target.value)}
          placeholder={recommendedPrice ? recommendedPrice.toString() : "15000"}
        />
        {recommendedPrice && (
          <p className="text-sm text-gray-500 mt-1">
            Рекомендуемая цена: {recommendedPrice.toLocaleString()} ₽
          </p>
        )}
      </div>
    </>
  );
}
