import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  currentImages?: File[];
}

export function ImageUpload({ 
  onImagesChange, 
  maxImages = 3,
  currentImages = []
}: ImageUploadProps) {
  const [images, setImages] = useState<File[]>(currentImages);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    // Validate files
    for (const file of fileArray) {
      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      // Check if we've reached max images
      if (images.length + validFiles.length >= maxImages) {
        toast.error(`Maximum ${maxImages} images allowed`);
        break;
      }

      validFiles.push(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      const updatedImages = [...images, ...validFiles];
      setImages(updatedImages);
      onImagesChange(updatedImages);
      toast.success(`Added ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}`);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setImages(updatedImages);
    setPreviews(updatedPreviews);
    onImagesChange(updatedImages);
    toast.success('Image removed');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {/* Camera Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => cameraInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="flex-1"
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>

        {/* Upload Button */}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={images.length >= maxImages}
          className="flex-1"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Images
        </Button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Image Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {previews.map((preview, index) => (
            <div key={index} className="relative group aspect-square">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-cover rounded-lg border"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Instructions */}
      {images.length === 0 && (
        <div className="border-2 border-dashed rounded-lg p-6 text-center">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Add photos of price tags or products
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum {maxImages} images • Max 5MB each • JPG, PNG, WEBP
          </p>
        </div>
      )}

      {/* Image Counter */}
      {images.length > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          {images.length} / {maxImages} images uploaded
        </p>
      )}
    </div>
  );
}
