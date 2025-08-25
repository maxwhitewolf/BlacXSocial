import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function UserProfileModal({ isOpen, onClose, username }: UserProfileModalProps) {
  const { user: currentUser } = useAuth();
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", username],
    enabled: isOpen && !!username,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "posts"],
    enabled: !!user?.id,
  });

  const { data: savedPosts } = useQuery({
    queryKey: ["/api/saved"],
    enabled: user?.id === currentUser?.id,
  });

  const { data: isFollowing } = useQuery({
    queryKey: ["/api/users", user?.id, "following"],
    enabled: !!user?.id && user?.id !== currentUser?.id,
    queryFn: async () => {
      // This would need to be implemented in the backend
      return false;
    },
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      if (isFollowing) {
        await apiRequest("DELETE", `/api/users/${user!.id}/follow`);
      } else {
        await apiRequest("POST", `/api/users/${user!.id}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", username] });
      toast({
        title: isFollowing ? "Unfollowed" : "Following",
        description: isFollowing ? `You unfollowed ${user?.username}` : `You are now following ${user?.username}`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update follow status",
        variant: "destructive",
      });
    },
  });

  const handleFollow = () => {
    if (user) {
      followMutation.mutate();
    }
  };

  if (!isOpen) return null;

  if (userLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-neutral-900 border-neutral-800 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-testid="modal-user-profile">
          <div className="p-6">
            <div className="flex items-start space-x-8 mb-8">
              <Skeleton className="w-32 h-32 rounded-full" />
              <div className="flex-1 space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-8 w-24" />
                </div>
                <div className="flex space-x-8">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-neutral-900 border-neutral-800 max-w-md w-full mx-4" data-testid="modal-user-not-found">
          <div className="p-6 text-center">
            <h2 className="text-xl font-bold mb-2">User not found</h2>
            <p className="text-neutral-400 mb-4">The profile you're looking for doesn't exist.</p>
            <Button onClick={onClose} data-testid="button-close-modal">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto" data-testid="modal-user-profile">
        <div className="p-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-8 mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
                alt="Profile" 
                className="w-full h-full object-cover"
                data-testid="img-modal-profile-avatar"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-2xl font-light" data-testid="text-modal-username">{user.username}</h1>
                {isOwnProfile ? (
                  <Button 
                    variant="outline" 
                    className="border-neutral-700 hover:bg-neutral-800"
                    data-testid="button-modal-edit-profile"
                  >
                    Edit profile
                  </Button>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    onClick={handleFollow}
                    disabled={followMutation.isPending}
                    data-testid="button-modal-follow"
                  >
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
                <button 
                  className="text-neutral-400 hover:text-white"
                  onClick={onClose}
                  data-testid="button-modal-close"
                >
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              
              {/* Stats */}
              <div className="flex space-x-8 mb-4">
                <div className="text-center">
                  <span className="font-semibold" data-testid="text-modal-posts-count">{user.postsCount || 0}</span>
                  <span className="text-neutral-400 text-sm ml-1">posts</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold" data-testid="text-modal-followers-count">{user.followersCount || 0}</span>
                  <span className="text-neutral-400 text-sm ml-1">followers</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold" data-testid="text-modal-following-count">{user.followingCount || 0}</span>
                  <span className="text-neutral-400 text-sm ml-1">following</span>
                </div>
              </div>
              
              {/* Bio */}
              <div className="space-y-1">
                {user.name && (
                  <h2 className="font-semibold" data-testid="text-modal-display-name">{user.name}</h2>
                )}
                {user.bio && (
                  <p className="text-neutral-300" data-testid="text-modal-bio">{user.bio}</p>
                )}
                {user.website && (
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-400 transition-colors"
                    data-testid="link-modal-website"
                  >
                    {user.website}
                  </a>
                )}
              </div>
            </div>
          </div>
          
          {/* Posts Grid */}
          <div className="border-t border-neutral-800 pt-6">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-transparent">
                <TabsTrigger 
                  value="posts" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  data-testid="tab-modal-posts"
                >
                  <i className="fas fa-th-large mr-2"></i>
                  POSTS
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger 
                    value="saved" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                    data-testid="tab-modal-saved"
                  >
                    <i className="fas fa-bookmark mr-2"></i>
                    SAVED
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="tagged" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  data-testid="tab-modal-tagged"
                >
                  <i className="fas fa-user-tag mr-2"></i>
                  TAGGED
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="posts" className="mt-6">
                {postsLoading ? (
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))}
                  </div>
                ) : posts?.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                      <i className="fas fa-camera text-2xl text-neutral-400"></i>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                    <p className="text-neutral-400">
                      {isOwnProfile ? "Share your first post!" : "This user hasn't posted anything yet."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {posts?.map((post: any) => (
                      <div 
                        key={post.id} 
                        className="aspect-square bg-neutral-800 relative cursor-pointer group"
                        onClick={() => setSelectedPost(post)}
                        data-testid={`modal-post-thumbnail-${post.id}`}
                      >
                        <img 
                          src={post.media[0]?.url} 
                          alt="Post" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="flex items-center space-x-4 text-white">
                            <div className="flex items-center space-x-1">
                              <i className="fas fa-heart"></i>
                              <span>{post.likeCount || 0}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <i className="fas fa-comment"></i>
                              <span>{post.commentCount || 0}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              {isOwnProfile && (
                <TabsContent value="saved" className="mt-6">
                  {savedPosts?.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                        <i className="fas fa-bookmark text-2xl text-neutral-400"></i>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">No saved posts</h3>
                      <p className="text-neutral-400">Posts you save will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1">
                      {savedPosts?.map((save: any) => (
                        <div 
                          key={save.id} 
                          className="aspect-square bg-neutral-800 relative cursor-pointer group"
                          onClick={() => setSelectedPost(save.post)}
                          data-testid={`modal-saved-post-${save.post.id}`}
                        >
                          <img 
                            src={save.post.media[0]?.url} 
                            alt="Saved post" 
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="flex items-center space-x-4 text-white">
                              <div className="flex items-center space-x-1">
                                <i className="fas fa-heart"></i>
                                <span>{save.post.likeCount || 0}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <i className="fas fa-comment"></i>
                                <span>{save.post.commentCount || 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              )}
              
              <TabsContent value="tagged" className="mt-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                    <i className="fas fa-user-tag text-2xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">No tagged posts</h3>
                  <p className="text-neutral-400">Posts where this user is tagged will appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>

      {/* Post Detail Modal */}
      {selectedPost && (
        <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
          <DialogContent className="bg-neutral-900 border-neutral-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex p-0" data-testid="modal-post-detail">
            {/* Image */}
            <div className="flex-1">
              <img 
                src={selectedPost.media[0]?.url} 
                alt="Post" 
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Post Info */}
            <div className="w-80 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedPost.author?.avatar || user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent((selectedPost.author?.username || user.username))}&background=e1306c&color=fff`}
                    alt="Author" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold">{selectedPost.author?.username || user.username}</span>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="text-neutral-400 hover:text-white"
                  data-testid="button-close-post-detail"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* Caption and Comments */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedPost.caption && (
                  <div className="mb-4">
                    <span className="font-semibold">{selectedPost.author?.username || user.username}</span>
                    <span className="ml-2">{selectedPost.caption}</span>
                  </div>
                )}
                
                <div className="text-center text-neutral-400 text-sm">
                  No comments yet
                </div>
              </div>
              
              {/* Actions */}
              <div className="border-t border-neutral-800 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button className="hover:text-red-500 transition-colors" data-testid="button-like-detail">
                      <i className="far fa-heart text-xl"></i>
                    </button>
                    <button className="hover:text-pink-500 transition-colors" data-testid="button-comment-detail">
                      <i className="far fa-comment text-xl"></i>
                    </button>
                    <button className="hover:text-pink-500 transition-colors" data-testid="button-share-detail">
                      <i className="far fa-paper-plane text-xl"></i>
                    </button>
                  </div>
                  <button className="hover:text-pink-500 transition-colors" data-testid="button-save-detail">
                    <i className="far fa-bookmark text-xl"></i>
                  </button>
                </div>
                
                <p className="font-semibold text-sm mb-2">{selectedPost.likeCount || 0} likes</p>
                
                <p className="text-xs text-neutral-400 uppercase">
                  {new Date(selectedPost.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
