import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface PetVerificationSectionProps {
  wantsVerification: boolean;
  documentFile: File | null;
  onVerificationChange: (checked: boolean) => void;
  onDocumentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PetVerificationSection({
  wantsVerification,
  documentFile,
  onVerificationChange,
  onDocumentChange,
}: PetVerificationSectionProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg space-y-4">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="verification"
          checked={wantsVerification}
          onCheckedChange={onVerificationChange}
        />
        <div className="flex-1">
          <Label htmlFor="verification" className="cursor-pointer font-medium">
            Верифицировать питомца
          </Label>
          <p className="text-sm text-gray-600 mt-1">
            Получите галочку верификации за 299 ₽. Это повысит доверие и увеличит количество откликов.
          </p>
        </div>
      </div>

      {wantsVerification && (
        <div>
          <Label htmlFor="document" className="block mb-2">
            Загрузите ветеринарный паспорт или родословную
          </Label>
          <label className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition-colors">
            <Icon name="Upload" size={20} className="mr-2" />
            <span className="text-sm text-gray-600">
              {documentFile ? documentFile.name : 'Выберите файл'}
            </span>
            <input
              id="document"
              type="file"
              accept="image/*,.pdf"
              onChange={onDocumentChange}
              className="hidden"
            />
          </label>
        </div>
      )}
    </div>
  );
}
