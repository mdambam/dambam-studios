'use client';

import { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Slider } from './ui/slider';
import { Loader2, Upload, Download } from 'lucide-react';

export default function ImageUpscaler() {
  const [originalImage, setOriginalImage] = useState(null);
  const [upscaledImage, setUpscaledImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(2);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setOriginalImage(event.target.result);
      setUpscaledImage(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleUpscale = async () => {
    if (!originalImage) {
      setError('Please upload an image first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/image/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          image: originalImage,
          scale: scale,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upscale image');
      }

      const data = await response.json();
      if (data?.status === 'success' && data?.data?.image) {
        setUpscaledImage(data.data.image);
      } else {
        throw new Error(data?.message || 'Failed to process image');
      }
    } catch (err) {
      console.error('Upscaling error:', err);
      setError(err.message || 'Failed to upscale image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (!upscaledImage) return;
    
    const link = document.createElement('a');
    link.href = upscaledImage;
    link.download = `upscaled-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Image Upscaler</CardTitle>
          <CardDescription>
            Enhance your images with AI-powered upscaling
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Upscale Factor: {scale}x</label>
            </div>
            <Slider
              min={2}
              max={4}
              step={1}
              value={[scale]}
              onValueChange={([value]) => setScale(value)}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Higher values may take longer to process
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Original Image</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={isLoading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              <div className="border-2 border-dashed rounded-lg aspect-square flex items-center justify-center bg-muted/50 overflow-hidden">
                {originalImage ? (
                  <img
                    src={originalImage}
                    alt="Original"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-center p-4">
                    <p>Upload an image to get started</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Upscaled Image</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  disabled={!upscaledImage || isLoading}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              <div className="border-2 border-dashed rounded-lg aspect-square flex items-center justify-center bg-muted/50 overflow-hidden">
                {isLoading ? (
                  <div className="flex flex-col items-center space-y-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm text-muted-foreground">Upscaling...</p>
                  </div>
                ) : upscaledImage ? (
                  <img
                    src={upscaledImage}
                    alt="Upscaled"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-muted-foreground text-center p-4">
                    <p>Upscaled result will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="pt-4">
            <Button
              onClick={handleUpscale}
              disabled={!originalImage || isLoading}
              className="w-full md:w-auto"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Upscale Image'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}