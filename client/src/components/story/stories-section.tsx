import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoriesSection() {
  const { user } = useAuth();

  // In a real app, this would fetch actual stories data
  const { data: stories, isLoading } = useQuery({
    queryKey: ["/api/stories"],
    enabled: !!user,
    // For now, return empty array since we don't have stories implementation
    queryFn: () => Promise.resolve([]),
  });

  if (isLoading) {
    return (
      <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 text-center">
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Mock stories data for UI demonstration
  const mockStories = [
    {
      id: "1",
      user: {
        id: "1",
        username: "sarah_k",
        avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"
      },
      hasViewed: false
    },
    {
      id: "2", 
      user: {
        id: "2",
        username: "alex_m",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"
      },
      hasViewed: false
    },
    {
      id: "3",
      user: {
        id: "3", 
        username: "tom_w",
        avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100"
      },
      hasViewed: true
    }
  ];

  return (
    <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800" data-testid="stories-section">
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {/* Your Story */}
        <div className="flex-shrink-0 text-center" data-testid="your-story">
          <div className="w-16 h-16 rounded-full bg-neutral-800 border-2 border-dashed border-neutral-600 p-0.5 cursor-pointer hover:border-pink-500 transition-colors">
            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center">
              {user?.avatar ? (
                <img 
                  src={user.avatar}
                  alt="Your story" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <i className="fas fa-plus text-neutral-400 text-xl"></i>
              )}
            </div>
          </div>
          <p className="text-xs mt-1 text-neutral-300">Your story</p>
        </div>

        {/* Other Stories */}
        {mockStories.map((story) => (
          <div 
            key={story.id} 
            className="flex-shrink-0 text-center cursor-pointer"
            data-testid={`story-${story.id}`}
          >
            <div className={`w-16 h-16 rounded-full p-0.5 ${
              story.hasViewed 
                ? 'bg-neutral-600' 
                : 'bg-gradient-to-r from-pink-500 to-purple-500'
            }`}>
              <div className="w-full h-full rounded-full overflow-hidden border-2 border-black">
                <img 
                  src={story.user.avatar}
                  alt="Story" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <p className={`text-xs mt-1 ${
              story.hasViewed ? 'text-neutral-500' : 'text-neutral-300'
            }`}>
              {story.user.username}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
