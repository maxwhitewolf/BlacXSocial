import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface PostCardProps {
  post: any;
  currentUser: User;
}

export default function PostCard({ post, currentUser }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (isLiked) {
        await apiRequest("DELETE", `/api/posts/${post.id}/like`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/like`);
      }
    },
    onSuccess: () => {
      setIsLiked(!isLiked);
      queryClient.invalidateQueries({ queryKey: ["/api/feed"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update like",
        variant: "destructive",
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiRequest("DELETE", `/api/posts/${post.id}/save`);
      } else {
        await apiRequest("POST", `/api/posts/${post.id}/save`);
      }
    },
    onSuccess: () => {
      setIsSaved(!isSaved);
      toast({
        title: isSaved ? "Post unsaved" : "Post saved",
        description: isSaved ? "Removed from saved posts" : "Added to saved posts",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update save status",
        variant: "destructive",
      });
    },
  });

  const handleLike = () => {
    likeMutation.mutate();
  };

  const handleSave = () => {
    saveMutation.mutate();
  };

  return (
    <article className="bg-neutral-900 rounded-lg border border-neutral-800 overflow-hidden" data-testid={`post-card-${post.id}`}>
      {/* Post Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-3">
          <Link href={`/profile/${post.author.username}`}>
            <img 
              src={post.author.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.username)}&background=e1306c&color=fff`}
              alt="User" 
              className="w-8 h-8 rounded-full object-cover cursor-pointer"
              data-testid="post-author-avatar"
            />
          </Link>
          <div>
            <Link href={`/profile/${post.author.username}`}>
              <p className="font-semibold text-sm hover:text-pink-500 transition-colors cursor-pointer" data-testid="post-author-username">
                {post.author.username}
              </p>
            </Link>
            {post.location && (
              <p className="text-xs text-neutral-400" data-testid="post-location">{post.location}</p>
            )}
          </div>
        </div>
        <button className="text-neutral-400 hover:text-white" data-testid="post-menu">
          <i className="fas fa-ellipsis-h"></i>
        </button>
      </div>
      
      {/* Post Image */}
      <div className="aspect-square bg-neutral-800">
        <img 
          src={post.media[0]?.url} 
          alt="Post content" 
          className="w-full h-full object-cover"
          data-testid="post-image"
        />
      </div>
      
      {/* Post Actions */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              className={`transition-colors ${
                isLiked ? 'text-red-500' : 'hover:text-red-500'
              }`}
              onClick={handleLike}
              disabled={likeMutation.isPending}
              data-testid="button-like"
            >
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-xl`}></i>
            </button>
            <button 
              className="hover:text-pink-500 transition-colors"
              onClick={() => setShowComments(!showComments)}
              data-testid="button-comments"
            >
              <i className="far fa-comment text-xl"></i>
            </button>
            <button className="hover:text-pink-500 transition-colors" data-testid="button-share">
              <i className="far fa-paper-plane text-xl"></i>
            </button>
          </div>
          <button 
            className={`transition-colors ${
              isSaved ? 'text-pink-500' : 'hover:text-pink-500'
            }`}
            onClick={handleSave}
            disabled={saveMutation.isPending}
            data-testid="button-save"
          >
            <i className={`${isSaved ? 'fas' : 'far'} fa-bookmark text-xl`}></i>
          </button>
        </div>
        
        {/* Like Count */}
        <p className="font-semibold text-sm" data-testid="post-like-count">
          {post.likeCount || 0} likes
        </p>
        
        {/* Caption */}
        {post.caption && (
          <div>
            <p className="text-sm">
              <Link href={`/profile/${post.author.username}`}>
                <span className="font-semibold hover:text-pink-500 transition-colors cursor-pointer">
                  {post.author.username}
                </span>
              </Link>
              <span className="ml-2" data-testid="post-caption">{post.caption}</span>
            </p>
          </div>
        )}
        
        {/* Comments */}
        {post.commentCount > 0 && (
          <button 
            className="text-sm text-neutral-400 hover:text-white transition-colors"
            onClick={() => setShowComments(!showComments)}
            data-testid="button-view-comments"
          >
            View all {post.commentCount} comments
          </button>
        )}
        
        {/* Time */}
        <p className="text-xs text-neutral-400 uppercase" data-testid="post-time">
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
      </div>
    </article>
  );
}
