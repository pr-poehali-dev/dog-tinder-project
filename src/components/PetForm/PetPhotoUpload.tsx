import Icon from '@/components/ui/icon';

interface PetPhotoUploadProps {
  photoPreview: string;
  isCheckingPhoto: boolean;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function PetPhotoUpload({ 
  photoPreview, 
  isCheckingPhoto, 
  onPhotoChange 
}: PetPhotoUploadProps) {
  return (
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
              <Icon name="Loader2" size={32} className="text-white animate-spin" />
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={onPhotoChange}
          className="hidden"
        />
      </label>
    </div>
  );
}
