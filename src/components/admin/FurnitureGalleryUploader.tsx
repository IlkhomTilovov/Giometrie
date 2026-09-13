import { useRef, useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiUpload } from '@/integrations/api/client';
import { convertImageToWebP } from '@/lib/imageToWebp';
import { useToast } from '@/hooks/use-toast';
import { MediaGrid } from '@/components/admin/MediaGrid';
import type { MediaItem } from '@/components/admin/AddMediaModal';

interface FurnitureGalleryUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  uploadLabel: string;
  errorTitle: string;
}

export function FurnitureGalleryUploader({ images, onChange, uploadLabel, errorTitle }: FurnitureGalleryUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const items: MediaItem[] = images.map((url) => ({ type: 'image', url }));

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const original = files[i];
        const file = await convertImageToWebP(original);
        const fileExt = file.name.split('.').pop();
        const fileName = `furniture-gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${fileExt}`;
        const fd = new FormData();
        fd.append('file', file);
        fd.append('path', `furniture/${fileName}`);
        const { url } = await apiUpload<{ url: string }>('/api/uploads', fd);
        uploaded.push(url);
      }
      onChange([...images, ...uploaded]);
    } catch (error: any) {
      toast({ variant: 'destructive', title: errorTitle, description: error.message });
    } finally {
      setUploading(false);
    }
  };

  const removeAt = (index: number) => onChange(images.filter((_, i) => i !== index));
  const move = (from: number, to: number) => {
    const next = [...images];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
          e.target.value = '';
        }}
      />
      {items.length > 0 && <MediaGrid items={items} onRemove={removeAt} onMove={move} />}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        {uploadLabel}
      </Button>
    </div>
  );
}
