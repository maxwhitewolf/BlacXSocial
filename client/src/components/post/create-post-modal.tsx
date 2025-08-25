import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const createPostSchema = z.object({
  caption: z.string().max(2200).optional(),
  media: z.array(z.object({
    url: z.string(),
    type: z.enum(['image', 'video']),
    width: z.number(),
    height: z.number(),
  })).min(1, "At least one image is required"),
  location: z.string().optional(),
});

type CreatePostData = z.infer<typeof createPostSchema>;

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePostModal({ isOpen, onClose }: CreatePostModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreatePostData>({
    resolver: zodResolver(createPostSchema),
    defaultValues: {
      caption: "",
      media: [],
      location: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: CreatePostData) => {
      const res = await apiRequest("POST", "/api/posts", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/explore"] });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create post",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validFiles = files.filter(file => 
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (validFiles.length !== files.length) {
      toast({
        title: "Invalid files",
        description: "Only images and videos are allowed.",
        variant: "destructive",
      });
      return;
    }

    setSelectedFiles(validFiles);

    // Create previews
    const newPreviews = validFiles.map(file => URL.createObjectURL(file));
    setPreviews(newPreviews);
  };

  const handleSubmit = async (data: CreatePostData) => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No media selected",
        description: "Please select at least one image or video.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Convert files to base64 for storage (simplified approach)
      const mediaObjects = await Promise.all(selectedFiles.map(async (file, index) => {
        return new Promise<{url: string, type: 'image' | 'video', width: number, height: number}>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              url: reader.result as string, // Base64 data URL
              type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
              width: 1080, // These would come from actual file analysis
              height: 1080,
            });
          };
          reader.readAsDataURL(file);
        });
      }));

      const postData = {
        ...data,
        media: mediaObjects,
      };

      createPostMutation.mutate(postData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload media files.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFiles([]);
    setPreviews([]);
    setUploading(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" data-testid="modal-create-post">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Create new post</DialogTitle>
            <button 
              className="text-neutral-400 hover:text-white"
              onClick={handleClose}
              data-testid="button-close-create-post"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          {/* Image Upload Area */}
          {selectedFiles.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-700 rounded-lg p-8 text-center">
              <i className="fas fa-camera text-4xl text-neutral-400 mb-4"></i>
              <p className="text-neutral-400 mb-2">Drag photos here</p>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <Button 
                  type="button"
                  className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                  data-testid="button-select-files"
                >
                  Select from computer
                </Button>
              </Label>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file-upload"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {/* Preview */}
              <div className="grid grid-cols-2 gap-2">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden">
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      data-testid={`preview-image-${index}`}
                    />
                    <button
                      type="button"
                      className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 hover:bg-opacity-75"
                      onClick={() => {
                        const newFiles = selectedFiles.filter((_, i) => i !== index);
                        const newPreviews = previews.filter((_, i) => i !== index);
                        setSelectedFiles(newFiles);
                        setPreviews(newPreviews);
                      }}
                      data-testid={`button-remove-image-${index}`}
                    >
                      <i className="fas fa-times text-white text-xs"></i>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add more button */}
              <Label htmlFor="file-upload-more" className="cursor-pointer">
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full border-neutral-700 hover:bg-neutral-800"
                  data-testid="button-add-more-files"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add more
                </Button>
              </Label>
              <input
                id="file-upload-more"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (files.length > 0) {
                    setSelectedFiles([...selectedFiles, ...files]);
                    const newPreviews = files.map(file => URL.createObjectURL(file));
                    setPreviews([...previews, ...newPreviews]);
                  }
                }}
                className="hidden"
              />
            </div>
          )}

          {/* Caption Input */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption..."
              {...form.register("caption")}
              className="w-full bg-transparent border border-neutral-700 rounded-lg p-3 text-sm resize-none focus:border-pink-500"
              rows={3}
              data-testid="textarea-caption"
            />
            {form.formState.errors.caption && (
              <p className="text-red-500 text-sm">{form.formState.errors.caption.message}</p>
            )}
          </div>

          {/* Location Input */}
          <div className="space-y-2">
            <Label htmlFor="location">Location (optional)</Label>
            <input
              id="location"
              type="text"
              placeholder="Add location"
              {...form.register("location")}
              className="w-full bg-transparent border border-neutral-700 rounded-lg p-3 text-sm focus:border-pink-500 focus:outline-none"
              data-testid="input-location"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit"
              disabled={selectedFiles.length === 0 || uploading || createPostMutation.isPending}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-6"
              data-testid="button-share-post"
            >
              {uploading || createPostMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Share
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
