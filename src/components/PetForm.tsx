import { useState } from 'react';
import { Button } from '@/components/ui/button';
import PetFormHeader from './PetForm/PetFormHeader';
import PetPhotoUpload from './PetForm/PetPhotoUpload';
import PetFormFields from './PetForm/PetFormFields';
import PetVerificationSection from './PetForm/PetVerificationSection';

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

  const handleFormChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <PetFormHeader isEditing={!!editingPet} onCancel={onCancel} />

          <form onSubmit={handleSubmit} className="space-y-4">
            <PetPhotoUpload
              photoPreview={photoPreview}
              isCheckingPhoto={isCheckingPhoto}
              onPhotoChange={handlePhotoChange}
            />

            <PetFormFields
              formData={formData}
              onFormChange={handleFormChange}
              recommendedPrice={recommendedPrice}
            />

            <PetVerificationSection
              wantsVerification={wantsVerification}
              documentFile={documentFile}
              onVerificationChange={setWantsVerification}
              onDocumentChange={handleDocumentChange}
            />

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-pink-600 to-orange-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Сохранение...' : editingPet ? 'Сохранить' : 'Опубликовать'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
