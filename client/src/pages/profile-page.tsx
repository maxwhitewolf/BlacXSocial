import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/users", username],
    enabled: !!username,
  });

  const { data: posts, isLoading: postsLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "posts"],
    enabled: !!user?.id,
  });

  const { data: savedPosts } = useQuery({
    queryKey: ["/api/saved"],
    enabled: user?.id === currentUser?.id,
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="pt-16">
          <div className="max-w-4xl mx-auto p-6">
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
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">User not found</h1>
          <p className="text-neutral-400">The profile you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === user.id;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16">
        <div className="max-w-4xl mx-auto p-6">
          {/* Profile Header */}
          <div className="flex items-start space-x-8 mb-8">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-500">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
                alt="Profile" 
                className="w-full h-full object-cover"
                data-testid="img-profile-avatar"
              />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <h1 className="text-2xl font-light" data-testid="text-username">{user.username}</h1>
                {isOwnProfile ? (
                  <Button 
                    variant="outline" 
                    className="border-neutral-700 hover:bg-neutral-800"
                    data-testid="button-edit-profile"
                  >
                    Edit profile
                  </Button>
                ) : (
                  <Button 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                    data-testid="button-follow"
                  >
                    Follow
                  </Button>
                )}
                <button className="text-neutral-400 hover:text-white" data-testid="button-settings">
                  <i className="fas fa-cog text-xl"></i>
                </button>
              </div>
              
              {/* Stats */}
              <div className="flex space-x-8 mb-4">
                <div className="text-center">
                  <span className="font-semibold" data-testid="text-posts-count">{user.postsCount || 0}</span>
                  <span className="text-neutral-400 text-sm ml-1">posts</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold" data-testid="text-followers-count">{user.followersCount || 0}</span>
                  <span className="text-neutral-400 text-sm ml-1">followers</span>
                </div>
                <div className="text-center">
                  <span className="font-semibold" data-testid="text-following-count">{user.followingCount || 0}</span>
                  <span className="text-neutral-400 text-sm ml-1">following</span>
                </div>
              </div>
              
              {/* Bio */}
              <div className="space-y-1">
                {user.name && (
                  <h2 className="font-semibold" data-testid="text-display-name">{user.name}</h2>
                )}
                {user.bio && (
                  <p className="text-neutral-300" data-testid="text-bio">{user.bio}</p>
                )}
                {user.website && (
                  <a 
                    href={user.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:text-pink-400 transition-colors"
                    data-testid="link-website"
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
                  data-testid="tab-posts"
                >
                  <i className="fas fa-th-large mr-2"></i>
                  POSTS
                </TabsTrigger>
                {isOwnProfile && (
                  <TabsTrigger 
                    value="saved" 
                    className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                    data-testid="tab-saved"
                  >
                    <i className="fas fa-bookmark mr-2"></i>
                    SAVED
                  </TabsTrigger>
                )}
                <TabsTrigger 
                  value="tagged" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  data-testid="tab-tagged"
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
                        data-testid={`post-thumbnail-${post.id}`}
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
                          data-testid={`saved-post-${save.post.id}`}
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
                  <p className="text-neutral-400">Posts where you're tagged will appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
