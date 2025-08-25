import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertPostSchema, insertCommentSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

export function registerRoutes(app: Express): Server {
  // Setup authentication routes
  setupAuth(app);

  // Posts routes
  app.get("/api/posts/:id", async (req, res) => {
    try {
      const post = await storage.getPostWithAuthor(req.params.id);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch post" });
    }
  });

  app.post("/api/posts", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertPostSchema.parse(req.body);
      const post = await storage.createPost({
        ...validatedData,
        authorId: req.user!.id
      });
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid post data" });
    }
  });

  app.delete("/api/posts/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const deleted = await storage.deletePost(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Post not found or unauthorized" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  // Feed routes
  app.get("/api/feed", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { cursor, limit = "20" } = req.query;
      const posts = await storage.getFeedPosts(
        req.user!.id, 
        parseInt(limit as string),
        cursor as string
      );
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feed" });
    }
  });

  app.get("/api/explore", async (req, res) => {
    try {
      const { cursor, limit = "20" } = req.query;
      const posts = await storage.getExplorePosts(
        parseInt(limit as string),
        cursor as string
      );
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch explore posts" });
    }
  });

  // User routes
  app.get("/api/users/:username", async (req, res) => {
    try {
      const user = await storage.getUserByUsername(req.params.username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get("/api/users/:userId/posts", async (req, res) => {
    try {
      const { cursor, limit = "20" } = req.query;
      const posts = await storage.getUserPosts(
        req.params.userId,
        parseInt(limit as string),
        cursor as string
      );
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user posts" });
    }
  });

  app.post("/api/users/:id/follow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const follow = await storage.followUser(req.user!.id, req.params.id);
      res.status(201).json(follow);
    } catch (error) {
      res.status(400).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/users/:id/follow", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const unfollowed = await storage.unfollowUser(req.user!.id, req.params.id);
      if (!unfollowed) {
        return res.status(404).json({ message: "Not following this user" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/suggested", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { limit = "5" } = req.query;
      const users = await storage.getSuggestedUsers(
        req.user!.id,
        parseInt(limit as string)
      );
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggested users" });
    }
  });

  // Like routes
  app.post("/api/posts/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const like = await storage.likePost(req.user!.id, req.params.id);
      res.status(201).json(like);
    } catch (error) {
      res.status(400).json({ message: "Failed to like post" });
    }
  });

  app.delete("/api/posts/:id/like", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const unliked = await storage.unlikePost(req.user!.id, req.params.id);
      if (!unliked) {
        return res.status(404).json({ message: "Like not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to unlike post" });
    }
  });

  // Comment routes
  app.get("/api/posts/:id/comments", async (req, res) => {
    try {
      const { limit = "20" } = req.query;
      const comments = await storage.getPostComments(
        req.params.id,
        parseInt(limit as string)
      );
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/posts/:id/comments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.id
      });
      const comment = await storage.createComment({
        ...validatedData,
        authorId: req.user!.id
      });
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid comment data" });
    }
  });

  // Save routes
  app.post("/api/posts/:id/save", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const save = await storage.savePost(req.user!.id, req.params.id);
      res.status(201).json(save);
    } catch (error) {
      res.status(400).json({ message: "Failed to save post" });
    }
  });

  app.delete("/api/posts/:id/save", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const unsaved = await storage.unsavePost(req.user!.id, req.params.id);
      if (!unsaved) {
        return res.status(404).json({ message: "Save not found" });
      }
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to unsave post" });
    }
  });

  app.get("/api/saved", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { limit = "20" } = req.query;
      const saves = await storage.getUserSavedPosts(
        req.user!.id,
        parseInt(limit as string)
      );
      res.json(saves);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch saved posts" });
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const { q: query, type = "all", limit = "20" } = req.query;
      
      if (!query) {
        return res.status(400).json({ message: "Query parameter required" });
      }

      const results: any = {};
      
      if (type === "users" || type === "all") {
        results.users = await storage.searchUsers(
          query as string,
          parseInt(limit as string)
        );
      }
      
      if (type === "posts" || type === "all") {
        results.posts = await storage.searchPosts(
          query as string,
          parseInt(limit as string)
        );
      }
      
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Conversation routes
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const conversations = await storage.getUserConversations(req.user!.id);
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { participantIds } = req.body;
      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ message: "Invalid participant IDs" });
      }
      
      const allParticipants = [...participantIds, req.user!.id];
      const conversation = await storage.getOrCreateConversation(allParticipants);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Message routes
  app.get("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { cursor, limit = "50" } = req.query;
      const messages = await storage.getConversationMessages(
        req.params.id,
        parseInt(limit as string),
        cursor as string
      );
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/conversations/:id/messages", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const validatedData = insertMessageSchema.parse({
        ...req.body,
        conversationId: req.params.id
      });
      const message = await storage.createMessage({
        ...validatedData,
        senderId: req.user!.id
      });
      res.status(201).json(message);
    } catch (error) {
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  // Notification routes
  app.get("/api/notifications", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const { limit = "20" } = req.query;
      const notifications = await storage.getUserNotifications(
        req.user!.id,
        parseInt(limit as string)
      );
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/:id/read", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.markNotificationAsRead(req.params.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      await storage.markAllNotificationsAsRead(req.user!.id);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Failed to mark all notifications as read" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
