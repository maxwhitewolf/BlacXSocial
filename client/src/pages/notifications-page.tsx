import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function NotificationsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["/api/notifications"],
    enabled: !!user,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("PATCH", `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", "/api/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return 'fas fa-heart';
      case 'comment':
        return 'fas fa-comment';
      case 'follow':
        return 'fas fa-user-plus';
      case 'mention':
        return 'fas fa-at';
      case 'message':
        return 'fas fa-envelope';
      default:
        return 'fas fa-bell';
    }
  };

  const getNotificationText = (notification: any) => {
    const actorName = notification.actor?.username || 'Someone';
    switch (notification.type) {
      case 'like':
        return `${actorName} liked your post`;
      case 'comment':
        return `${actorName} commented on your post`;
      case 'follow':
        return `${actorName} started following you`;
      case 'mention':
        return `${actorName} mentioned you in a post`;
      case 'message':
        return `${actorName} sent you a message`;
      default:
        return `${actorName} interacted with your content`;
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'like':
      case 'comment':
      case 'mention':
        if (notification.entityId) {
          setLocation(`/post/${notification.entityId}`);
        }
        break;
      case 'follow':
        setLocation(`/profile/${notification.actor?.username}`);
        break;
      case 'message':
        setLocation('/messages');
        break;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="max-w-2xl mx-auto p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold" data-testid="heading-notifications">Notifications</h1>
            {Array.isArray(notifications) && notifications.length > 0 && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="text-pink-500 hover:text-pink-400"
                data-testid="button-mark-all-read"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !Array.isArray(notifications) || notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                <i className="fas fa-bell text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">No notifications yet</h3>
              <p className="text-neutral-400">You'll see notifications when people interact with your content.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {Array.isArray(notifications) && notifications.map((notification: any) => (
                <div
                  key={notification.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg cursor-pointer transition-colors hover:bg-neutral-800 ${
                    !notification.isRead ? 'bg-neutral-900 border-l-4 border-pink-500' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                  data-testid={`notification-${notification.id}`}
                >
                  {/* Actor Avatar */}
                  <div className="relative">
                    <img 
                      src={notification.actor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.actor?.username || 'User')}&background=e1306c&color=fff`}
                      alt={notification.actor?.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {/* Notification Type Icon */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                      <i className={`${getNotificationIcon(notification.type)} text-white text-xs`}></i>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      {getNotificationText(notification)}
                    </p>
                    <p className="text-xs text-neutral-400 mt-1">
                      {new Date(notification.createdAt).toLocaleDateString()} at {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.isRead && (
                    <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}