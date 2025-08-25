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
    <nav className="fixed top-0 left-0 right-0 bg-black border-b border-neutral-800 z-50" data-testid="navigation">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link href="/">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent cursor-pointer" data-testid="logo">
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
                className="w-full bg-neutral-900 border-neutral-700 rounded-lg px-4 py-2 pl-10 text-sm focus:border-pink-500"
                data-testid="input-search"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm"></i>
            </form>
          </div>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-6">
            <Link href="/">
              <button 
                className={`hover:text-pink-500 transition-colors ${location === '/' ? 'text-pink-500' : ''}`}
                data-testid="nav-home"
              >
                <i className="fas fa-home text-xl"></i>
              </button>
            </Link>
            
            <Link href="/explore">
              <button 
                className={`hover:text-pink-500 transition-colors ${location === '/explore' ? 'text-pink-500' : ''}`}
                data-testid="nav-explore"
              >
                <i className="fas fa-compass text-xl"></i>
              </button>
            </Link>
            
            <Link href="/messages">
              <button 
                className={`hover:text-pink-500 transition-colors ${location === '/messages' ? 'text-pink-500' : ''}`}
                data-testid="nav-messages"
              >
                <i className="fas fa-paper-plane text-xl"></i>
              </button>
            </Link>
            
            <button 
              className="hover:text-pink-500 transition-colors relative"
              data-testid="nav-notifications"
            >
              <i className="fas fa-heart text-xl"></i>
              <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            
            {onCreatePost && (
              <button 
                className="hover:text-pink-500 transition-colors"
                onClick={onCreatePost}
                data-testid="nav-create-post"
              >
                <i className="fas fa-plus-square text-xl"></i>
              </button>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-pink-500 cursor-pointer" data-testid="nav-profile">
                  <img 
                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-neutral-900 border-neutral-700">
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
