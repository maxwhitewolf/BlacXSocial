import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const editProfileSchema = z.object({
  name: z.string().max(100).optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal("")),
});

type EditProfileData = z.infer<typeof editProfileSchema>;

export default function ProfileEditPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<EditProfileData>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: user?.name || "",
      username: user?.username || "",
      email: user?.email || "",
      bio: user?.bio || "",
      website: user?.website || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: EditProfileData & { avatar?: string }) => {
      const res = await apiRequest("PATCH", `/api/users/${user?.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setLocation(`/profile/${form.getValues("username")}`);
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (data: EditProfileData) => {
    let avatarData: string | undefined;

    // Handle avatar upload
    if (avatarFile) {
      try {
        avatarData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(avatarFile);
        });
      } catch (error) {
        toast({
          title: "Avatar upload failed",
          description: "Failed to upload avatar image",
          variant: "destructive",
        });
        return;
      }
    }

    updateProfileMutation.mutate({
      ...data,
      ...(avatarData && { avatar: avatarData }),
    });
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold" data-testid="heading-edit-profile">Edit Profile</h1>
            <Button 
              variant="ghost"
              onClick={() => setLocation(`/profile/${user.username}`)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full overflow-hidden">
                <img 
                  src={avatarPreview || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  data-testid="img-avatar-preview"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-2">{user.username}</h3>
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    className="border-neutral-700 hover:bg-neutral-800"
                    data-testid="button-change-avatar"
                  >
                    Change photo
                  </Button>
                </Label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  data-testid="input-avatar-upload"
                />
              </div>
            </div>

            <Separator className="bg-neutral-800" />

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  className="bg-neutral-800 border-neutral-700 focus:border-pink-500"
                  data-testid="input-name"
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm">{form.formState.errors.name.message}</p>
                )}
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  {...form.register("username")}
                  className="bg-neutral-800 border-neutral-700 focus:border-pink-500"
                  data-testid="input-username"
                />
                {form.formState.errors.username && (
                  <p className="text-red-500 text-sm">{form.formState.errors.username.message}</p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...form.register("email")}
                  className="bg-neutral-800 border-neutral-700 focus:border-pink-500"
                  data-testid="input-email"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm">{form.formState.errors.email.message}</p>
                )}
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  {...form.register("bio")}
                  placeholder="Write a bio..."
                  className="bg-neutral-800 border-neutral-700 focus:border-pink-500 resize-none"
                  rows={3}
                  data-testid="textarea-bio"
                />
                <p className="text-xs text-neutral-400">
                  {form.watch("bio")?.length || 0}/500 characters
                </p>
                {form.formState.errors.bio && (
                  <p className="text-red-500 text-sm">{form.formState.errors.bio.message}</p>
                )}
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  {...form.register("website")}
                  className="bg-neutral-800 border-neutral-700 focus:border-pink-500"
                  data-testid="input-website"
                />
                {form.formState.errors.website && (
                  <p className="text-red-500 text-sm">{form.formState.errors.website.message}</p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <Button 
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 px-8"
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}