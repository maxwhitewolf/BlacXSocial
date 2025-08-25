import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PostViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [newComment, setNewComment] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: post, isLoading: postLoading } = useQuery({
    queryKey: ["/api/posts", id],
    enabled: !!id,
  });

  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ["/api/posts", id, "comments"],
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${id}/like`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
    },
  });

  const unlikeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${id}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/posts/${id}/save`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
      toast({ title: "Post saved" });
    },
  });

  const unsaveMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/posts/${id}/save`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
      toast({ title: "Post unsaved" });
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("POST", `/api/posts/${id}/comments`, { text });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts", id] });
      setNewComment("");
    },
    onError: () => {
      toast({
        title: "Failed to post comment",
        variant: "destructive",
      });
    },
  });

  const handleComment = () => {
    if (!newComment.trim() || !user) return;
    commentMutation.mutate(newComment.trim());
  };

  if (postLoading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        <div className="pt-16">
          <div className="max-w-4xl mx-auto p-4">
            <div className="flex">
              <Skeleton className="flex-1 aspect-square max-w-lg" />
              <div className="w-80 pl-6 space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const postData = post as any;
  const commentsData = comments as any;

  if (!postData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Post not found</h1>
          <p className="text-neutral-400">The post you're looking for doesn't exist.</p>
          <Button 
            onClick={() => setLocation("/")}
            className="mt-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            Go home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex flex-col lg:flex-row bg-neutral-900 rounded-lg overflow-hidden">
            {/* Post Image */}
            <div className="flex-1 max-w-2xl">
              <img 
                src={post.media[0]?.url} 
                alt="Post" 
                className="w-full h-full object-cover"
                data-testid="img-post-media"
              />
            </div>
            
            {/* Post Info Sidebar */}
            <div className="w-full lg:w-96 flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                <div 
                  className="flex items-center space-x-3 cursor-pointer"
                  onClick={() => setLocation(`/profile/${post.author?.username}`)}
                  data-testid="link-author-profile"
                >
                  <img 
                    src={post.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.username || 'User')}&background=e1306c&color=fff`}
                    alt={post.author?.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="font-semibold">{postData?.author?.username}</span>
                </div>
                <button 
                  className="text-neutral-400 hover:text-white"
                  data-testid="button-post-options"
                >
                  <i className="fas fa-ellipsis-h"></i>
                </button>
              </div>
              
              {/* Comments Section */}
              <div className="flex-1 overflow-y-auto p-4 max-h-96 lg:max-h-none">
                {/* Post Caption */}
                {post.caption && (
                  <div className="mb-4">
                    <span className="font-semibold">{postData?.author?.username}</span>
                    <span className="ml-2">{postData?.caption}</span>
                  </div>
                )}

                {/* Comments */}
                <div className="space-y-4">
                  {commentsLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex space-x-3">
                        <Skeleton className="w-8 h-8 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-3 w-1/4" />
                          <Skeleton className="h-3 w-3/4" />
                        </div>
                      </div>
                    ))
                  ) : Array.isArray(commentsData) && commentsData.length > 0 ? (
                    commentsData.map((comment: any) => (
                      <div key={comment.id} className="flex space-x-3" data-testid={`comment-${comment.id}`}>
                        <img 
                          src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.author?.username || 'User')}&background=e1306c&color=fff`}
                          alt={comment.author?.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-start space-x-2">
                            <span className="font-semibold text-sm">{comment.author?.username}</span>
                            <span className="text-sm">{comment.text}</span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-1">
                            {new Date(comment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-neutral-400 text-sm py-8">
                      No comments yet. Be the first to comment!
                    </div>
                  )}
                </div>
              </div>
              
              {/* Actions and Comment Input */}
              <div className="border-t border-neutral-800 p-4">
                {/* Action Buttons */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => postData?.isLiked ? unlikeMutation.mutate() : likeMutation.mutate()}
                      disabled={likeMutation.isPending || unlikeMutation.isPending}
                      className={`hover:text-red-500 transition-colors ${postData?.isLiked ? 'text-red-500' : ''}`}
                      data-testid="button-like-post"
                    >
                      <i className={`${postData?.isLiked ? 'fas' : 'far'} fa-heart text-xl`}></i>
                    </button>
                    <button 
                      className="hover:text-pink-500 transition-colors"
                      onClick={() => document.getElementById('comment-input')?.focus()}
                      data-testid="button-comment"
                    >
                      <i className="far fa-comment text-xl"></i>
                    </button>
                    <button 
                      className="hover:text-pink-500 transition-colors"
                      data-testid="button-share"
                    >
                      <i className="far fa-paper-plane text-xl"></i>
                    </button>
                  </div>
                  <button 
                    onClick={() => postData?.isSaved ? unsaveMutation.mutate() : saveMutation.mutate()}
                    disabled={saveMutation.isPending || unsaveMutation.isPending}
                    className={`hover:text-pink-500 transition-colors ${postData?.isSaved ? 'text-pink-500' : ''}`}
                    data-testid="button-save-post"
                  >
                    <i className={`${postData?.isSaved ? 'fas' : 'far'} fa-bookmark text-xl`}></i>
                  </button>
                </div>
                
                {/* Like Count */}
                <p className="font-semibold text-sm mb-2" data-testid="text-like-count">
                  {postData?.likeCount || 0} likes
                </p>
                
                {/* Post Date */}
                <p className="text-xs text-neutral-400 uppercase mb-4">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>

                {/* Comment Input */}
                {user && (
                  <div className="flex items-center space-x-3">
                    <Input
                      id="comment-input"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleComment();
                        }
                      }}
                      className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                      data-testid="input-new-comment"
                    />
                    <Button 
                      onClick={handleComment}
                      disabled={!newComment.trim() || commentMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="text-pink-500 hover:text-pink-400 p-0"
                      data-testid="button-post-comment"
                    >
                      {commentMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        "Post"
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}