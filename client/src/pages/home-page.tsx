import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import Sidebar from "@/components/layout/sidebar";
import PostCard from "@/components/post/post-card";
import CreatePostModal from "@/components/post/create-post-modal";
import StoriesSection from "@/components/story/stories-section";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const { data: feedPosts, isLoading } = useQuery({
    queryKey: ["/api/feed"],
    enabled: !!user,
  });

  const { data: suggestedUsers } = useQuery({
    queryKey: ["/api/users/suggested"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation onCreatePost={() => setShowCreatePost(true)} />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto flex">
          {/* Left Sidebar */}
          <Sidebar user={user} suggestedUsers={Array.isArray(suggestedUsers) ? suggestedUsers : []} />
          
          {/* Main Content */}
          <div className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-md mx-auto py-6 px-4 space-y-8">
              {/* Stories */}
              <StoriesSection />
              
              {/* Feed Posts */}
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="card p-0 overflow-hidden animate-fade-in">
                    <div className="flex items-center space-x-3 p-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <Skeleton className="aspect-square w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-20" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                    </div>
                  </div>
                ))
              ) : !Array.isArray(feedPosts) || feedPosts.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full border-2 border-muted flex items-center justify-center">
                    <i className="fas fa-users text-3xl text-muted-foreground"></i>
                  </div>
                  <h3 className="text-2xl font-bold mb-3">Your feed is empty!</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Follow some users or create your first post to see content in your feed.
                  </p>
                  <button 
                    onClick={() => setShowCreatePost(true)}
                    className="btn-primary btn-lg"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Create Post
                  </button>
                </div>
              ) : (
                Array.isArray(feedPosts) ? feedPosts.map((post: any) => (
                  <PostCard key={post.id} post={post} currentUser={user} />
                )) : null
              )}
            </div>
          </div>
          
          {/* Right Sidebar - Messages & Trending */}
          <div className="hidden xl:block w-80 fixed right-0 top-16 h-full px-4 py-6">
            <div className="space-y-6">
              {/* Messages Preview */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Messages</h3>
                  <button className="btn-ghost btn-sm text-primary">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="text-center text-muted-foreground text-sm py-8">
                    <i className="fas fa-inbox text-2xl mb-3 block"></i>
                    No recent messages
                  </div>
                </div>
              </div>
              
              {/* Trending Hashtags */}
              <div className="card p-6">
                <h3 className="font-semibold text-lg mb-4">Trending</h3>
                <div className="space-y-4">
                  <div className="cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors">
                    <p className="font-medium text-sm text-primary">#photography</p>
                    <p className="text-xs text-muted-foreground">2.4K posts</p>
                  </div>
                  <div className="cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors">
                    <p className="font-medium text-sm text-primary">#sunset</p>
                    <p className="text-xs text-muted-foreground">1.8K posts</p>
                  </div>
                  <div className="cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors">
                    <p className="font-medium text-sm text-primary">#nature</p>
                    <p className="text-xs text-muted-foreground">3.2K posts</p>
                  </div>
                  <div className="cursor-pointer hover:bg-accent p-2 rounded-lg transition-colors">
                    <p className="font-medium text-sm text-primary">#travel</p>
                    <p className="text-xs text-muted-foreground">4.1K posts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Post Modal */}
      <CreatePostModal 
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
      />

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t" data-testid="mobile-navigation">
        <div className="flex justify-around py-2">
          <button className="nav-item" data-testid="button-home">
            <i className="fas fa-home text-xl"></i>
          </button>
          <button className="nav-item" data-testid="button-search">
            <i className="fas fa-search text-xl"></i>
          </button>
          <button 
            className="nav-item"
            onClick={() => setShowCreatePost(true)}
            data-testid="button-create-post"
          >
            <i className="fas fa-plus-square text-xl"></i>
          </button>
          <button className="nav-item relative" data-testid="button-notifications">
            <i className="fas fa-heart text-xl"></i>
            <span className="absolute top-1 right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-4 h-4 flex items-center justify-center animate-pulse">3</span>
          </button>
          <button className="nav-item" data-testid="button-profile">
            <div className="w-6 h-6 rounded-full overflow-hidden border-2 border-primary">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4f46e5&color=fff`}
                alt="Profile" 
                className="w-full h-full object-cover" 
              />
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
}
