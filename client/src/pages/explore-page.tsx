import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/layout/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export default function ExplorePage() {
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const { data: explorePosts, isLoading } = useQuery({
    queryKey: ["/api/explore"],
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6" data-testid="heading-explore">Explore</h1>
          
          {isLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : !Array.isArray(explorePosts) || explorePosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                <i className="fas fa-compass text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No posts to explore</h3>
              <p className="text-neutral-400">Check back later for trending content.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {Array.isArray(explorePosts) ? explorePosts.map((post: any, index: number) => (
                <div 
                  key={post.id} 
                  className={`${
                    index % 6 === 0 || index % 6 === 4 ? 'row-span-2' : ''
                  } relative cursor-pointer group bg-neutral-800`}
                  onClick={() => setSelectedPost(post)}
                  data-testid={`explore-post-${post.id}`}
                >
                  <img 
                    src={post.media[0]?.url} 
                    alt="Explore post" 
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
                  
                  {/* Multiple images indicator */}
                  {post.media?.length > 1 && (
                    <div className="absolute top-2 right-2">
                      <i className="fas fa-images text-white text-sm"></i>
                    </div>
                  )}
                </div>
              )) : null}
            </div>
          )}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPost(null)}
          data-testid="modal-post-detail"
        >
          <div 
            className="bg-neutral-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex"
            onClick={(e) => e.stopPropagation()}
          >
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
                    src={selectedPost.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedPost.author.username)}&background=e1306c&color=fff`}
                    alt="Author" 
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold">{selectedPost.author.username}</span>
                </div>
                <button 
                  onClick={() => setSelectedPost(null)}
                  className="text-neutral-400 hover:text-white"
                  data-testid="button-close-modal"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              
              {/* Caption and Comments */}
              <div className="flex-1 overflow-y-auto p-4">
                {selectedPost.caption && (
                  <div className="mb-4">
                    <span className="font-semibold">{selectedPost.author.username}</span>
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
                    <button className="hover:text-red-500 transition-colors" data-testid="button-like">
                      <i className="far fa-heart text-xl"></i>
                    </button>
                    <button className="hover:text-pink-500 transition-colors" data-testid="button-comment">
                      <i className="far fa-comment text-xl"></i>
                    </button>
                    <button className="hover:text-pink-500 transition-colors" data-testid="button-share">
                      <i className="far fa-paper-plane text-xl"></i>
                    </button>
                  </div>
                  <button className="hover:text-pink-500 transition-colors" data-testid="button-save">
                    <i className="far fa-bookmark text-xl"></i>
                  </button>
                </div>
                
                <p className="font-semibold text-sm mb-2">{selectedPost.likeCount || 0} likes</p>
                
                <p className="text-xs text-neutral-400 uppercase">
                  {new Date(selectedPost.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
