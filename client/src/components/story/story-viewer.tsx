import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface StoryViewerProps {
  isOpen: boolean;
  onClose: () => void;
  storyId?: string;
  userId?: string;
}

export default function StoryViewer({ isOpen, onClose, storyId, userId }: StoryViewerProps) {
  const { user } = useAuth();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const { data: userStories } = useQuery({
    queryKey: ["/api/stories/user", userId],
    enabled: !!userId && isOpen,
  });

  const { data: currentStory } = useQuery({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId && isOpen,
  });

  const viewStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/stories/${id}/view`);
    },
  });

  const stories = userStories || (currentStory ? [currentStory] : []);
  const activeStory = stories[currentStoryIndex];

  useEffect(() => {
    if (!activeStory || !isOpen) return;

    // Mark story as viewed
    if (user?.id !== activeStory.userId) {
      viewStoryMutation.mutate(activeStory.id);
    }

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          // Move to next story
          if (currentStoryIndex < stories.length - 1) {
            setCurrentStoryIndex(currentStoryIndex + 1);
            return 0;
          } else {
            onClose();
            return 0;
          }
        }
        return prev + 2; // 5 second duration (100/2 = 50 * 100ms = 5000ms)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStory, currentStoryIndex, stories.length, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [isOpen, userId, storyId]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
      setProgress(0);
    }
  };

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'Escape') onClose();
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [isOpen, currentStoryIndex]);

  if (!isOpen || !activeStory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black border-none p-0 max-w-sm mx-auto h-[90vh] flex flex-col" data-testid="story-viewer">
        {/* Progress bars */}
        <div className="flex space-x-1 p-2">
          {stories.map((_, index) => (
            <div key={index} className="flex-1 h-0.5 bg-neutral-600 rounded overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-100"
                style={{
                  width: index < currentStoryIndex ? '100%' : 
                         index === currentStoryIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Story header */}
        <div className="flex items-center justify-between p-4 absolute top-6 left-0 right-0 z-10">
          <div className="flex items-center space-x-3">
            <img 
              src={activeStory.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeStory.user?.username || 'User')}&background=e1306c&color=fff`}
              alt={activeStory.user?.username}
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
            />
            <span className="text-white font-semibold text-sm" data-testid="story-username">
              {activeStory.user?.username}
            </span>
            <span className="text-white text-xs opacity-75">
              {new Date(activeStory.createdAt).toLocaleDateString()}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300"
            data-testid="button-close-story"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Story content */}
        <div className="flex-1 relative bg-neutral-900 rounded-lg overflow-hidden">
          {activeStory.media?.type === 'image' ? (
            <img 
              src={activeStory.media.url}
              alt="Story"
              className="w-full h-full object-cover"
              data-testid="story-image"
            />
          ) : (
            <video 
              src={activeStory.media?.url}
              className="w-full h-full object-cover"
              autoPlay
              muted
              data-testid="story-video"
            />
          )}

          {/* Navigation areas */}
          <button 
            onClick={handlePrevious}
            className="absolute left-0 top-0 w-1/3 h-full z-10 flex items-center justify-start pl-4 opacity-0 hover:opacity-100"
            disabled={currentStoryIndex === 0}
            data-testid="button-previous-story"
          >
            {currentStoryIndex > 0 && (
              <i className="fas fa-chevron-left text-white text-2xl"></i>
            )}
          </button>

          <button 
            onClick={handleNext}
            className="absolute right-0 top-0 w-1/3 h-full z-10 flex items-center justify-end pr-4 opacity-0 hover:opacity-100"
            data-testid="button-next-story"
          >
            <i className="fas fa-chevron-right text-white text-2xl"></i>
          </button>

          {/* Tap to pause/play area */}
          <div 
            className="absolute inset-0 w-1/3 left-1/3 cursor-pointer"
            onClick={() => setProgress(prev => prev)} // Pause/resume logic can be added here
          />
        </div>

        {/* Story actions */}
        {user && user.id !== activeStory.userId && (
          <div className="p-4">
            <div className="flex items-center space-x-3">
              <input 
                type="text"
                placeholder="Reply to story..."
                className="flex-1 bg-transparent border border-neutral-600 rounded-full px-4 py-2 text-white placeholder-neutral-400 focus:border-pink-500 focus:outline-none"
                data-testid="input-story-reply"
              />
              <Button 
                size="sm"
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-full px-6"
                data-testid="button-send-story-reply"
              >
                Send
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}