import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

const steps = [
  { id: 1, title: 'Привет, давай знакомиться' },
  { id: 2, title: 'О твоем питомце' },
  { id: 3, title: 'Фото питомца' },
  { id: 4, title: 'Готово!' }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    petName: '',
    petGender: '',
    petBreed: '',
    petAge: '',
    petDescription: '',
    petPhoto: '',
    ownerName: '',
    ownerPhone: ''
  });

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('onboardingComplete', 'true');
      localStorage.setItem('userProfile', JSON.stringify(formData));
      toast({
        title: "Профиль создан!",
        description: "Теперь ты можешь искать друзей для своего питомца",
      });
      navigate('/');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.petGender !== '';
      case 2:
        return formData.petName && formData.petBreed && formData.petAge;
      case 3:
        return formData.petPhoto;
      case 4:
        return formData.ownerName && formData.ownerPhone;
      default:
        return false;
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => (
        <div
          key={step.id}
          className={`h-1 flex-1 rounded-full transition-all ${
            index < currentStep 
              ? 'bg-gradient-to-r from-pink-600 to-orange-600' 
              : 'bg-gray-200'
          }`}
        />
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Привет, давай знакомиться</h2>
              <p className="text-gray-600">
                Расскажи о себе — это поможет создать профиль и сразу начать общаться
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <RadioGroup
                value={formData.petGender}
                onValueChange={(value) => setFormData({ ...formData, petGender: value })}
                className="space-y-3"
              >
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-gray-200 hover:border-pink-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="flex items-center gap-2 cursor-pointer flex-1 text-lg">
                    <Icon name="Dog" size={24} />
                    Мой питомец — мальчик
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border-2 border-gray-200 hover:border-pink-300 transition-colors cursor-pointer">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="flex items-center gap-2 cursor-pointer flex-1 text-lg">
                    <Icon name="Cat" size={24} />
                    Мой питомец — девочка
                  </Label>
                </div>
              </RadioGroup>
            </div>


          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold">О твоем питомце</h2>
              <p className="text-gray-600">Заполни базовую информацию</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="petName">Кличка питомца</Label>
                <Input
                  id="petName"
                  placeholder="Например, Бобик"
                  value={formData.petName}
                  onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="petBreed">Порода</Label>
                <Input
                  id="petBreed"
                  placeholder="Например, Лабрадор"
                  value={formData.petBreed}
                  onChange={(e) => setFormData({ ...formData, petBreed: e.target.value })}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="petAge">Возраст</Label>
                <Input
                  id="petAge"
                  type="number"
                  placeholder="Например, 3"
                  value={formData.petAge}
                  onChange={(e) => setFormData({ ...formData, petAge: e.target.value })}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="petDescription">Описание (необязательно)</Label>
                <Textarea
                  id="petDescription"
                  placeholder="Расскажи немного о характере..."
                  value={formData.petDescription}
                  onChange={(e) => setFormData({ ...formData, petDescription: e.target.value })}
                  className="min-h-24 text-lg"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold">Добавь фото питомца</h2>
              <p className="text-gray-600">Лучшее фото твоего любимца</p>
            </div>

            <div className="space-y-4">
              {formData.petPhoto ? (
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-pink-300">
                  <img 
                    src={formData.petPhoto} 
                    alt="Pet" 
                    className="w-full h-full object-cover"
                  />
                  <Button
                    onClick={() => setFormData({ ...formData, petPhoto: '' })}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    size="icon"
                    variant="ghost"
                  >
                    <Icon name="X" size={20} />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-pink-400 transition-colors">
                  <Icon name="Upload" size={48} className="text-gray-400 mb-2" />
                  <span className="text-gray-600">Нажми чтобы загрузить</span>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormData({ ...formData, petPhoto: reader.result as string });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="text-3xl font-bold">Почти готово!</h2>
              <p className="text-gray-600">Как с тобой связаться?</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ownerName">Твое имя</Label>
                <Input
                  id="ownerName"
                  placeholder="Например, Александр"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="h-12 text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Телефон</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  placeholder="+7 (999) 123-45-67"
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="h-12 text-lg"
                />
              </div>
            </div>

            <div className="pt-8 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 mb-4">
                <Icon name="Heart" size={48} className="text-white" fill="white" />
              </div>
              <p className="text-gray-600">
                После создания профиля ты сможешь сразу начать искать друзей для своего питомца!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-orange-50 p-6 flex flex-col">
      <div className="max-w-md mx-auto w-full flex-1 flex flex-col">
        {currentStep > 1 && (
          <Button
            onClick={handleBack}
            variant="ghost"
            size="icon"
            className="mb-4 self-start"
          >
            <Icon name="ArrowLeft" size={24} />
          </Button>
        )}

        {renderStepIndicator()}

        <div className="flex-1 flex flex-col">
          {renderStep()}
        </div>

        <div className="pt-6 space-y-3">
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="w-full h-14 text-lg bg-gradient-to-r from-pink-600 to-orange-600 hover:from-pink-700 hover:to-orange-700"
          >
            {currentStep === steps.length ? 'Завершить' : 'Продолжить'}
          </Button>

          {currentStep === 1 && (
            <Button
              onClick={() => {
                localStorage.setItem('onboardingComplete', 'true');
                navigate('/');
              }}
              variant="ghost"
              className="w-full"
            >
              У меня уже есть профиль
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}