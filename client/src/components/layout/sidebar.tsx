import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import type { User } from "@shared/schema";

interface SidebarProps {
  user: User;
  suggestedUsers: User[];
}

export default function Sidebar({ user, suggestedUsers }: SidebarProps) {
  return (
    <div className="hidden lg:block w-64 fixed left-0 top-16 h-full px-4 py-6" data-testid="sidebar">
      <div className="space-y-6">
        {/* User Info */}
        <div className="flex items-center space-x-3 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
          <img 
            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
            alt="Profile" 
            className="w-12 h-12 rounded-full object-cover"
            data-testid="sidebar-user-avatar"
          />
          <div>
            <h3 className="font-semibold" data-testid="sidebar-username">{user.username}</h3>
            <p className="text-sm text-neutral-400" data-testid="sidebar-display-name">{user.name || user.username}</p>
          </div>
        </div>
        
        {/* Suggestions */}
        <div className="space-y-4">
          <h3 className="font-semibold text-neutral-300">Suggested for you</h3>
          
          {suggestedUsers.length === 0 ? (
            <div className="text-center text-neutral-400 text-sm py-4">
              No suggestions available
            </div>
          ) : (
            suggestedUsers.map((suggestedUser) => (
              <div key={suggestedUser.id} className="flex items-center justify-between" data-testid={`suggested-user-${suggestedUser.id}`}>
                <div className="flex items-center space-x-3">
                  <img 
                    src={suggestedUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(suggestedUser.username)}&background=e1306c&color=fff`}
                    alt="Suggested user" 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <Link href={`/profile/${suggestedUser.username}`}>
                      <p className="font-medium text-sm hover:text-pink-500 transition-colors cursor-pointer">
                        {suggestedUser.username}
                      </p>
                    </Link>
                    <p className="text-xs text-neutral-400">Suggested for you</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-pink-500 hover:text-white hover:bg-pink-500 transition-colors"
                  data-testid={`button-follow-${suggestedUser.id}`}
                >
                  Follow
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
