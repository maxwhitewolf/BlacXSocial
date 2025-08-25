import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NavigationProps {
  onCreatePost?: () => void;
}

export default function Navigation({ onCreatePost }: NavigationProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implement search navigation
      console.log("Search:", searchQuery);
    }
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  if (!user) return null;

  return (
    <nav className="fixed top-0 left-0 right-0 glass border-b z-50" data-testid="navigation">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <h1 className="text-2xl font-bold social-gradient bg-clip-text text-transparent cursor-pointer" data-testid="logo">
                BlanX
              </h1>
            </Link>
          </div>
          
          {/* Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Input
                type="text"
                placeholder="Search users, hashtags, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 input"
                data-testid="input-search"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm"></i>
            </form>
          </div>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-6">
            <Link href="/">
              <button 
                className={`btn-ghost ${location === '/' ? 'text-primary' : ''}`}
                data-testid="nav-home"
              >
                <i className="fas fa-home text-xl"></i>
              </button>
            </Link>
            
            <Link href="/explore">
              <button 
                className={`btn-ghost ${location === '/explore' ? 'text-primary' : ''}`}
                data-testid="nav-explore"
              >
                <i className="fas fa-compass text-xl"></i>
              </button>
            </Link>
            
            <Link href="/messages">
              <button 
                className={`btn-ghost ${location === '/messages' ? 'text-primary' : ''}`}
                data-testid="nav-messages"
              >
                <i className="fas fa-paper-plane text-xl"></i>
              </button>
            </Link>
            
            <Link href="/notifications">
              <button 
                className={`btn-ghost relative ${location === '/notifications' ? 'text-primary' : ''}`}
                data-testid="nav-notifications"
              >
                <i className="fas fa-heart text-xl"></i>
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  3
                </span>
              </button>
            </Link>
            
            {onCreatePost && (
              <button 
                className="btn-ghost"
                onClick={onCreatePost}
                data-testid="nav-create-post"
              >
                <i className="fas fa-plus-square text-xl"></i>
              </button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary cursor-pointer hover:border-primary/80 transition-colors" data-testid="nav-profile">
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4f46e5&color=fff`}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass">
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.username}`} className="cursor-pointer" data-testid="dropdown-profile">
                    <i className="fas fa-user mr-2"></i>
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" data-testid="dropdown-settings">
                  <i className="fas fa-cog mr-2"></i>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer"
                  onClick={handleLogout}
                  data-testid="dropdown-logout"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
