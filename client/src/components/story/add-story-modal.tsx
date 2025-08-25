import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const addStorySchema = z.object({
  media: z.object({
    url: z.string(),
    type: z.enum(['image', 'video']),
  }),
});

type AddStoryData = z.infer<typeof addStorySchema>;

interface AddStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddStoryModal({ isOpen, onClose }: AddStoryModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddStoryData>({
    resolver: zodResolver(addStorySchema),
  });

  const createStoryMutation = useMutation({
    mutationFn: async (data: AddStoryData) => {
      const res = await apiRequest("POST", "/api/stories", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Story added!",
        description: "Your story has been shared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stories"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stories/following"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add story",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast({
        title: "Invalid file",
        description: "Only images and videos are allowed.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);

    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
  };

  const handleSubmit = async () => {
    if (!selectedFile) {
      toast({
        title: "No media selected",
        description: "Please select an image or video.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Convert file to base64 for storage (simplified approach)
      const mediaData = await new Promise<{url: string, type: 'image' | 'video'}>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            url: reader.result as string, // Base64 data URL
            type: selectedFile.type.startsWith('image/') ? 'image' as const : 'video' as const,
          });
        };
        reader.readAsDataURL(selectedFile);
      });

      createStoryMutation.mutate({ media: mediaData });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload media file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setPreview(null);
    setUploading(false);
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-md w-full mx-4" data-testid="modal-add-story">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Add to story</DialogTitle>
            <button 
              className="text-neutral-400 hover:text-white"
              onClick={handleClose}
              data-testid="button-close-add-story"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Upload Area */}
          {!selectedFile ? (
            <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center">
              <i className="fas fa-camera text-4xl text-neutral-400 mb-4"></i>
              <p className="text-neutral-400 mb-2">Add a photo or video</p>
              <Label htmlFor="story-file-upload" className="cursor-pointer">
                <Button 
                  type="button"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  data-testid="button-select-story-file"
                >
                  Select from computer
                </Button>
              </Label>
              <input
                id="story-file-upload"
                type="file"
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-story-file-upload"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-[9/16] max-h-96 rounded-lg overflow-hidden bg-neutral-800">
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={preview!} 
                    alt="Story preview"
                    className="w-full h-full object-cover"
                    data-testid="preview-story-image"
                  />
                ) : (
                  <video 
                    src={preview!} 
                    className="w-full h-full object-cover"
                    controls
                    data-testid="preview-story-video"
                  />
                )}
                
                {/* Remove button */}
                <button
                  type="button"
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-75"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    if (preview) {
                      URL.revokeObjectURL(preview);
                    }
                  }}
                  data-testid="button-remove-story-file"
                >
                  <i className="fas fa-times text-white text-sm"></i>
                </button>
              </div>

              {/* Story duration info */}
              <div className="text-center text-sm text-neutral-400">
                <i className="fas fa-clock mr-1"></i>
                Stories disappear after 24 hours
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              variant="ghost"
              onClick={handleClose}
              data-testid="button-cancel-story"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!selectedFile || uploading || createStoryMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6"
              data-testid="button-share-story"
            >
              {uploading || createStoryMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Share to story
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}