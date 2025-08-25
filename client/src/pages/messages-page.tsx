import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/layout/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MessagesPage() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    enabled: !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ["/api/conversations", selectedConversation?.id, "messages"],
    enabled: !!selectedConversation?.id,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { text: string }) => {
      const res = await apiRequest("POST", `/api/conversations/${selectedConversation.id}/messages`, messageData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setNewMessage("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    sendMessageMutation.mutate({ text: newMessage.trim() });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navigation />
      
      <div className="pt-16 h-screen">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className="w-80 border-r border-neutral-800 flex flex-col">
            <div className="p-4 border-b border-neutral-800">
              <h1 className="text-xl font-semibold" data-testid="heading-messages">Messages</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="space-y-4 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !Array.isArray(conversations) || conversations.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full border-2 border-neutral-700 flex items-center justify-center">
                    <i className="fas fa-paper-plane text-2xl text-neutral-400"></i>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
                  <p className="text-neutral-400 text-sm">Start a conversation with your friends!</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {Array.isArray(conversations) ? conversations.map((conversation: any) => (
                    <div
                      key={conversation.id}
                      className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-neutral-800 transition-colors ${
                        selectedConversation?.id === conversation.id ? 'bg-neutral-800' : ''
                      }`}
                      onClick={() => setSelectedConversation(conversation)}
                      data-testid={`conversation-${conversation.id}`}
                    >
                      <div className="w-12 h-12 rounded-full overflow-hidden">
                        <img 
                          src={`https://ui-avatars.com/api/?name=User&background=e1306c&color=fff`}
                          alt="User" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">User</p>
                        <p className="text-xs text-neutral-400 truncate">
                          {conversation.lastMessage?.text || "Start a conversation"}
                        </p>
                      </div>
                      {conversation.lastMessage && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                      )}
                    </div>
                  )) : null}
                </div>
              )}
            </div>
          </div>
          
          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <img 
                        src={`https://ui-avatars.com/api/?name=User&background=e1306c&color=fff`}
                        alt="User" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold" data-testid="text-chat-username">User</p>
                      <p className="text-xs text-neutral-400">Active now</p>
                    </div>
                  </div>
                  <button className="text-neutral-400 hover:text-white" data-testid="button-chat-info">
                    <i className="fas fa-info-circle text-xl"></i>
                  </button>
                </div>
                
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {!Array.isArray(messages) || messages.length === 0 ? (
                    <div className="text-center text-neutral-400 text-sm py-8">
                      No messages yet. Say hello!
                    </div>
                  ) : (
                    Array.isArray(messages) ? messages.map((message: any) => (
                      <div
                        key={message.id}
                        className={`flex ${message.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                        data-testid={`message-${message.id}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            message.senderId === user.id
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                              : 'bg-neutral-800 text-white'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                          <p className="text-xs opacity-75 mt-1">
                            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    )) : null
                  )}
                </div>
                
                {/* Message Input */}
                <div className="border-t border-neutral-800 p-4">
                  <div className="flex items-center space-x-3">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="flex-1 bg-neutral-800 border-neutral-700"
                      data-testid="input-new-message"
                    />
                    <Button 
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      onClick={handleSendMessage}
                      data-testid="button-send-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <i className="fas fa-spinner fa-spin"></i>
                      ) : (
                        <i className="fas fa-paper-plane"></i>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 flex items-center justify-center">
                    <i className="fas fa-paper-plane text-2xl text-white"></i>
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Your messages</h2>
                  <p className="text-neutral-400 mb-6">Send private messages to your friends</p>
                  <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                    Send message
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
