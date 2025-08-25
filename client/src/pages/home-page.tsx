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
    <div className="min-h-screen bg-black text-white">
      <Navigation onCreatePost={() => setShowCreatePost(true)} />
      
      <div className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto flex">
          {/* Left Sidebar */}
          <Sidebar user={user} suggestedUsers={Array.isArray(suggestedUsers) ? suggestedUsers : []} />
          
          {/* Main Content */}
          <div className="flex-1 lg:ml-64 lg:mr-80">
            <div className="max-w-md mx-auto py-6 space-y-6">
              {/* Stories */}
              <StoriesSection />
              
              {/* Feed Posts */}
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden">
                    <div className="flex items-center space-x-3 p-4">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-2 w-16" />
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
                <div className="bg-neutral-900 rounded-lg border border-neutral-800 p-8 text-center">
                  <p className="text-neutral-400 mb-4">Your feed is empty!</p>
                  <p className="text-sm text-neutral-500">Follow some users to see their posts here.</p>
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
              <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Messages</h3>
                  <button className="text-pink-500 text-sm hover:text-pink-400 transition-colors">
                    View all
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="text-center text-neutral-400 text-sm py-4">
                    No recent messages
                  </div>
                </div>
              </div>
              
              {/* Trending Hashtags */}
              <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
                <h3 className="font-semibold mb-4">Trending</h3>
                <div className="space-y-3">
                  <div className="cursor-pointer hover:text-pink-500 transition-colors">
                    <p className="font-medium text-sm">#photography</p>
                    <p className="text-xs text-neutral-400">2.4K posts</p>
                  </div>
                  <div className="cursor-pointer hover:text-pink-500 transition-colors">
                    <p className="font-medium text-sm">#sunset</p>
                    <p className="text-xs text-neutral-400">1.8K posts</p>
                  </div>
                  <div className="cursor-pointer hover:text-pink-500 transition-colors">
                    <p className="font-medium text-sm">#nature</p>
                    <p className="text-xs text-neutral-400">3.2K posts</p>
                  </div>
                  <div className="cursor-pointer hover:text-pink-500 transition-colors">
                    <p className="font-medium text-sm">#travel</p>
                    <p className="text-xs text-neutral-400">4.1K posts</p>
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
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-black border-t border-neutral-800" data-testid="mobile-navigation">
        <div className="flex justify-around py-2">
          <button className="p-3 hover:text-pink-500 transition-colors" data-testid="button-home">
            <i className="fas fa-home text-xl"></i>
          </button>
          <button className="p-3 hover:text-pink-500 transition-colors" data-testid="button-search">
            <i className="fas fa-search text-xl"></i>
          </button>
          <button 
            className="p-3 hover:text-pink-500 transition-colors"
            onClick={() => setShowCreatePost(true)}
            data-testid="button-create-post"
          >
            <i className="fas fa-plus-square text-xl"></i>
          </button>
          <button className="p-3 hover:text-pink-500 transition-colors relative" data-testid="button-notifications">
            <i className="fas fa-heart text-xl"></i>
            <span className="absolute top-1 right-1 bg-pink-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </button>
          <button className="p-3" data-testid="button-profile">
            <div className="w-6 h-6 rounded-full overflow-hidden border border-pink-500">
              <img 
                src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
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
