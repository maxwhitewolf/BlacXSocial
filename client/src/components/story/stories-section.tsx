import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import StoryViewer from "./story-viewer";
import AddStoryModal from "./add-story-modal";

export default function StoriesSection() {
  const { user } = useAuth();
  const [selectedStory, setSelectedStory] = useState<any>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showAddStory, setShowAddStory] = useState(false);

  const { data: stories, isLoading } = useQuery({
    queryKey: ["/api/stories/following"],
    enabled: !!user,
  });

  const { data: userStories } = useQuery({
    queryKey: ["/api/stories/user", user?.id],
    enabled: !!user?.id,
  });

  const handleStoryClick = (story: any) => {
    setSelectedStory(story);
    setSelectedUserId(story.userId);
  };

  const handleAddStoryClick = () => {
    if (userStories && userStories.length > 0) {
      // User has stories, view them
      setSelectedUserId(user?.id || null);
      setSelectedStory(userStories[0]);
    } else {
      // User has no stories, show add story modal
      setShowAddStory(true);
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="card p-6" data-testid="stories-section">
        <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
          {/* Add/View own story */}
          <div className="flex-shrink-0 text-center">
            <div 
              className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5 cursor-pointer"
              onClick={handleAddStoryClick}
              data-testid="button-add-story"
            >
              <div className="w-full h-full bg-background rounded-full flex items-center justify-center overflow-hidden border-2 border-background">
                {userStories && userStories.length > 0 ? (
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4f46e5&color=fff`}
                    alt="Your story"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className="fas fa-plus text-primary text-lg"></i>
                )}
              </div>
            </div>
            <p className="text-xs text-center mt-2 text-muted-foreground font-medium">Your story</p>
          </div>

          {/* Stories */}
          {isLoading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 text-center">
                <Skeleton className="w-16 h-16 rounded-full mb-2" />
                <Skeleton className="h-3 w-12 mx-auto" />
              </div>
            ))
          ) : Array.isArray(stories) ? (
            stories.map((story: any) => (
              <div key={story.id} className="flex-shrink-0 text-center">
                <div 
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5 cursor-pointer"
                  onClick={() => handleStoryClick(story)}
                  data-testid={`story-${story.id}`}
                >
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-background">
                    <img 
                      src={story.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(story.user?.username || 'User')}&background=4f46e5&color=fff`}
                      alt={story.user?.username}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground font-medium truncate w-16">
                  {story.user?.username}
                </p>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Story Viewer */}
      <StoryViewer 
        isOpen={!!selectedStory}
        onClose={() => {
          setSelectedStory(null);
          setSelectedUserId(null);
        }}
        storyId={selectedStory?.id}
        userId={selectedUserId}
      />

      {/* Add Story Modal */}
      <AddStoryModal 
        isOpen={showAddStory}
        onClose={() => setShowAddStory(false)}
      />
    </>
  );
}