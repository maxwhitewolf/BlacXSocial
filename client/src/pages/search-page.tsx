import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import Navigation from "@/components/layout/navigation";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function SearchPage() {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/search", { q: query, type: activeTab }],
    enabled: query.length > 0,
  });

  const handleUserClick = (username: string) => {
    setLocation(`/profile/${username}`);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 pb-20 lg:pb-0">
        <div className="max-w-4xl mx-auto p-4">
          {/* Search Input */}
          <div className="mb-6">
            <Input
              placeholder="Search users, posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-neutral-800 border-neutral-700 text-white placeholder-neutral-400 focus:border-pink-500"
              data-testid="input-search"
            />
          </div>

          {/* Search Results */}
          {query.length > 0 && (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3 bg-transparent mb-6">
                <TabsTrigger 
                  value="all" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  data-testid="tab-all"
                >
                  All
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  data-testid="tab-users"
                >
                  Users
                </TabsTrigger>
                <TabsTrigger 
                  value="posts" 
                  className="data-[state=active]:border-b-2 data-[state=active]:border-pink-500"
                  data-testid="tab-posts"
                >
                  Posts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Users */}
                    {searchResults?.users && Array.isArray(searchResults.users) && searchResults.users.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Users</h3>
                        <div className="space-y-3">
                          {searchResults?.users?.slice(0, 3).map((user: any) => (
                            <div 
                              key={user.id} 
                              className="flex items-center justify-between p-4 hover:bg-neutral-800 rounded-lg cursor-pointer"
                              onClick={() => handleUserClick(user.username)}
                              data-testid={`user-result-${user.id}`}
                            >
                              <div className="flex items-center space-x-3">
                                <img 
                                  src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
                                  alt={user.username}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div>
                                  <p className="font-semibold">{user.username}</p>
                                  {user.name && (
                                    <p className="text-sm text-neutral-400">{user.name}</p>
                                  )}
                                </div>
                              </div>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-neutral-700 hover:bg-neutral-700"
                                data-testid={`button-follow-${user.id}`}
                              >
                                Follow
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Posts */}
                    {searchResults?.posts && Array.isArray(searchResults.posts) && searchResults.posts.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Posts</h3>
                        <div className="grid grid-cols-3 gap-1">
                          {searchResults?.posts?.slice(0, 9).map((post: any) => (
                            <div 
                              key={post.id} 
                              className="aspect-square bg-neutral-800 relative cursor-pointer group"
                              data-testid={`post-result-${post.id}`}
                            >
                              <img 
                                src={post.media[0]?.url} 
                                alt="Search result post" 
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
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="users">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4">
                        <Skeleton className="w-12 h-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {searchResults?.users?.map((user: any) => (
                      <div 
                        key={user.id} 
                        className="flex items-center justify-between p-4 hover:bg-neutral-800 rounded-lg cursor-pointer"
                        onClick={() => handleUserClick(user.username)}
                        data-testid={`user-result-${user.id}`}
                      >
                        <div className="flex items-center space-x-3">
                          <img 
                            src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=e1306c&color=fff`}
                            alt={user.username}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-semibold">{user.username}</p>
                            {user.name && (
                              <p className="text-sm text-neutral-400">{user.name}</p>
                            )}
                            <p className="text-sm text-neutral-500">{user.followersCount || 0} followers</p>
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-neutral-700 hover:bg-neutral-700"
                          data-testid={`button-follow-${user.id}`}
                        >
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="posts">
                {isLoading ? (
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {searchResults?.posts?.map((post: any) => (
                      <div 
                        key={post.id} 
                        className="aspect-square bg-neutral-800 relative cursor-pointer group"
                        data-testid={`post-result-${post.id}`}
                      >
                        <img 
                          src={post.media[0]?.url} 
                          alt="Search result post" 
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
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}

          {query.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                <i className="fas fa-search text-2xl text-neutral-400"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">Search</h3>
              <p className="text-neutral-400">Find users and posts you're interested in.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}