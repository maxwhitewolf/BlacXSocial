import { 
  users, posts, follows, likes, comments, saves, conversations, messages, notifications, stories,
  type User, type InsertUser, type Post, type InsertPost, type Comment, type InsertComment,
  type Follow, type Like, type Save, type Conversation, type Message, type InsertMessage,
  type Notification, type Story
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, sql, ilike, inArray, gt } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  sessionStore: session.SessionStore;
  
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  searchUsers(query: string, limit?: number): Promise<User[]>;
  getSuggestedUsers(userId: string, limit?: number): Promise<User[]>;
  
  // Post operations
  getPost(id: string): Promise<Post | undefined>;
  getPostWithAuthor(id: string): Promise<(Post & { author: User }) | undefined>;
  createPost(post: InsertPost & { authorId: string }): Promise<Post>;
  deletePost(id: string, authorId: string): Promise<boolean>;
  getUserPosts(userId: string, limit?: number, cursor?: string): Promise<Post[]>;
  getFeedPosts(userId: string, limit?: number, cursor?: string): Promise<(Post & { author: User })[]>;
  getExplorePosts(limit?: number, cursor?: string): Promise<(Post & { author: User })[]>;
  searchPosts(query: string, limit?: number): Promise<(Post & { author: User })[]>;
  updatePostCounts(postId: string, likeCount?: number, commentCount?: number): Promise<void>;
  
  // Follow operations
  followUser(followerId: string, followingId: string): Promise<Follow>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getFollowers(userId: string, limit?: number): Promise<(Follow & { follower: User })[]>;
  getFollowing(userId: string, limit?: number): Promise<(Follow & { following: User })[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;
  updateFollowCounts(userId: string): Promise<void>;
  
  // Like operations
  likePost(userId: string, postId: string): Promise<Like>;
  unlikePost(userId: string, postId: string): Promise<boolean>;
  isPostLiked(userId: string, postId: string): Promise<boolean>;
  getPostLikes(postId: string, limit?: number): Promise<(Like & { user: User })[]>;
  
  // Comment operations
  createComment(comment: InsertComment & { authorId: string }): Promise<Comment>;
  getPostComments(postId: string, limit?: number): Promise<(Comment & { author: User })[]>;
  deleteComment(id: string, authorId: string): Promise<boolean>;
  
  // Save operations
  savePost(userId: string, postId: string): Promise<Save>;
  unsavePost(userId: string, postId: string): Promise<boolean>;
  isPostSaved(userId: string, postId: string): Promise<boolean>;
  getUserSavedPosts(userId: string, limit?: number): Promise<(Save & { post: Post & { author: User } })[]>;
  
  // Conversation operations
  getOrCreateConversation(participantIds: string[]): Promise<Conversation>;
  getUserConversations(userId: string): Promise<(Conversation & { lastMessage?: Message })[]>;
  
  // Message operations
  createMessage(message: InsertMessage & { senderId: string }): Promise<Message>;
  getConversationMessages(conversationId: string, limit?: number, cursor?: string): Promise<(Message & { sender: User })[]>;
  markMessageAsSeen(messageId: string, userId: string): Promise<void>;
  
  // Notification operations
  createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<(Notification & { actor: User })[]>;
  markNotificationAsRead(id: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async searchUsers(query: string, limit = 20): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(or(
        ilike(users.username, `%${query}%`),
        ilike(users.name, `%${query}%`)
      ))
      .limit(limit);
  }

  async getSuggestedUsers(userId: string, limit = 5): Promise<User[]> {
    // Get users that the current user is not following
    const followingIds = db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    return await db.select()
      .from(users)
      .where(and(
        sql`${users.id} != ${userId}`,
        sql`${users.id} NOT IN (${followingIds})`
      ))
      .orderBy(desc(users.followersCount))
      .limit(limit);
  }

  async getPost(id: string): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getPostWithAuthor(id: string): Promise<(Post & { author: User }) | undefined> {
    const result = await db.select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.id, id));
    
    if (result.length === 0) return undefined;
    
    return {
      ...result[0].posts,
      author: result[0].users
    };
  }

  async createPost(post: InsertPost & { authorId: string }): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    
    // Update user posts count
    await db.update(users)
      .set({ postsCount: sql`${users.postsCount} + 1` })
      .where(eq(users.id, post.authorId));
    
    return newPost;
  }

  async deletePost(id: string, authorId: string): Promise<boolean> {
    const result = await db.delete(posts)
      .where(and(eq(posts.id, id), eq(posts.authorId, authorId)))
      .returning();
    
    if (result.length > 0) {
      await db.update(users)
        .set({ postsCount: sql`${users.postsCount} - 1` })
        .where(eq(users.id, authorId));
      return true;
    }
    return false;
  }

  async getUserPosts(userId: string, limit = 20, cursor?: string): Promise<Post[]> {
    let query = db.select()
      .from(posts)
      .where(eq(posts.authorId, userId))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    if (cursor) {
      query = query.where(and(
        eq(posts.authorId, userId),
        sql`${posts.createdAt} < (SELECT created_at FROM posts WHERE id = ${cursor})`
      ));
    }

    return await query;
  }

  async getFeedPosts(userId: string, limit = 20, cursor?: string): Promise<(Post & { author: User })[]> {
    // Get posts from users that the current user follows
    const followingIds = db.select({ id: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    let query = db.select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(inArray(posts.authorId, followingIds))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    if (cursor) {
      query = query.where(and(
        inArray(posts.authorId, followingIds),
        sql`${posts.createdAt} < (SELECT created_at FROM posts WHERE id = ${cursor})`
      ));
    }

    const result = await query;
    return result.map(row => ({
      ...row.posts,
      author: row.users
    }));
  }

  async getExplorePosts(limit = 20, cursor?: string): Promise<(Post & { author: User })[]> {
    let query = db.select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .orderBy(desc(sql`${posts.likeCount} + ${posts.commentCount}`), desc(posts.createdAt))
      .limit(limit);

    if (cursor) {
      query = query.where(
        sql`${posts.createdAt} < (SELECT created_at FROM posts WHERE id = ${cursor})`
      );
    }

    const result = await query;
    return result.map(row => ({
      ...row.posts,
      author: row.users
    }));
  }

  async searchPosts(query: string, limit = 20): Promise<(Post & { author: User })[]> {
    const result = await db.select()
      .from(posts)
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(ilike(posts.caption, `%${query}%`))
      .orderBy(desc(posts.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.posts,
      author: row.users
    }));
  }

  async updatePostCounts(postId: string, likeCount?: number, commentCount?: number): Promise<void> {
    const updates: any = {};
    if (likeCount !== undefined) updates.likeCount = likeCount;
    if (commentCount !== undefined) updates.commentCount = commentCount;
    
    if (Object.keys(updates).length > 0) {
      await db.update(posts).set(updates).where(eq(posts.id, postId));
    }
  }

  async followUser(followerId: string, followingId: string): Promise<Follow> {
    const [follow] = await db.insert(follows)
      .values({ followerId, followingId })
      .returning();
    
    // Update follow counts
    await Promise.all([
      db.update(users).set({ followingCount: sql`${users.followingCount} + 1` }).where(eq(users.id, followerId)),
      db.update(users).set({ followersCount: sql`${users.followersCount} + 1` }).where(eq(users.id, followingId))
    ]);
    
    return follow;
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db.delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .returning();
    
    if (result.length > 0) {
      await Promise.all([
        db.update(users).set({ followingCount: sql`${users.followingCount} - 1` }).where(eq(users.id, followerId)),
        db.update(users).set({ followersCount: sql`${users.followersCount} - 1` }).where(eq(users.id, followingId))
      ]);
      return true;
    }
    return false;
  }

  async getFollowers(userId: string, limit = 20): Promise<(Follow & { follower: User })[]> {
    const result = await db.select()
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId))
      .limit(limit);

    return result.map(row => ({
      ...row.follows,
      follower: row.users
    }));
  }

  async getFollowing(userId: string, limit = 20): Promise<(Follow & { following: User })[]> {
    const result = await db.select()
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId))
      .limit(limit);

    return result.map(row => ({
      ...row.follows,
      following: row.users
    }));
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db.select()
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return !!follow;
  }

  async updateFollowCounts(userId: string): Promise<void> {
    const [followersCount] = await db.select({ count: sql`count(*)` })
      .from(follows)
      .where(eq(follows.followingId, userId));
    
    const [followingCount] = await db.select({ count: sql`count(*)` })
      .from(follows)
      .where(eq(follows.followerId, userId));

    await db.update(users)
      .set({ 
        followersCount: Number(followersCount.count), 
        followingCount: Number(followingCount.count) 
      })
      .where(eq(users.id, userId));
  }

  async likePost(userId: string, postId: string): Promise<Like> {
    const [like] = await db.insert(likes)
      .values({ userId, postId })
      .returning();
    
    await db.update(posts)
      .set({ likeCount: sql`${posts.likeCount} + 1` })
      .where(eq(posts.id, postId));
    
    return like;
  }

  async unlikePost(userId: string, postId: string): Promise<boolean> {
    const result = await db.delete(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)))
      .returning();
    
    if (result.length > 0) {
      await db.update(posts)
        .set({ likeCount: sql`${posts.likeCount} - 1` })
        .where(eq(posts.id, postId));
      return true;
    }
    return false;
  }

  async isPostLiked(userId: string, postId: string): Promise<boolean> {
    const [like] = await db.select()
      .from(likes)
      .where(and(eq(likes.userId, userId), eq(likes.postId, postId)));
    return !!like;
  }

  async getPostLikes(postId: string, limit = 20): Promise<(Like & { user: User })[]> {
    const result = await db.select()
      .from(likes)
      .innerJoin(users, eq(likes.userId, users.id))
      .where(eq(likes.postId, postId))
      .limit(limit);

    return result.map(row => ({
      ...row.likes,
      user: row.users
    }));
  }

  async createComment(comment: InsertComment & { authorId: string }): Promise<Comment> {
    const [newComment] = await db.insert(comments).values(comment).returning();
    
    await db.update(posts)
      .set({ commentCount: sql`${posts.commentCount} + 1` })
      .where(eq(posts.id, comment.postId));
    
    return newComment;
  }

  async getPostComments(postId: string, limit = 20): Promise<(Comment & { author: User })[]> {
    const result = await db.select()
      .from(comments)
      .innerJoin(users, eq(comments.authorId, users.id))
      .where(eq(comments.postId, postId))
      .orderBy(desc(comments.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.comments,
      author: row.users
    }));
  }

  async deleteComment(id: string, authorId: string): Promise<boolean> {
    const result = await db.delete(comments)
      .where(and(eq(comments.id, id), eq(comments.authorId, authorId)))
      .returning();
    
    if (result.length > 0) {
      const comment = result[0];
      await db.update(posts)
        .set({ commentCount: sql`${posts.commentCount} - 1` })
        .where(eq(posts.id, comment.postId));
      return true;
    }
    return false;
  }

  async savePost(userId: string, postId: string): Promise<Save> {
    const [save] = await db.insert(saves)
      .values({ userId, postId })
      .returning();
    return save;
  }

  async unsavePost(userId: string, postId: string): Promise<boolean> {
    const result = await db.delete(saves)
      .where(and(eq(saves.userId, userId), eq(saves.postId, postId)))
      .returning();
    return result.length > 0;
  }

  async isPostSaved(userId: string, postId: string): Promise<boolean> {
    const [save] = await db.select()
      .from(saves)
      .where(and(eq(saves.userId, userId), eq(saves.postId, postId)));
    return !!save;
  }

  async getUserSavedPosts(userId: string, limit = 20): Promise<(Save & { post: Post & { author: User } })[]> {
    const result = await db.select()
      .from(saves)
      .innerJoin(posts, eq(saves.postId, posts.id))
      .innerJoin(users, eq(posts.authorId, users.id))
      .where(eq(saves.userId, userId))
      .orderBy(desc(saves.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.saves,
      post: {
        ...row.posts,
        author: row.users
      }
    }));
  }

  async getOrCreateConversation(participantIds: string[]): Promise<Conversation> {
    const sortedIds = participantIds.sort();
    
    // Try to find existing conversation
    const existing = await db.select()
      .from(conversations)
      .where(sql`${conversations.participantIds} = ${sortedIds}`);
    
    if (existing.length > 0) {
      return existing[0];
    }
    
    // Create new conversation
    const [conversation] = await db.insert(conversations)
      .values({ participantIds: sortedIds })
      .returning();
    
    return conversation;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { lastMessage?: Message })[]> {
    const result = await db.select()
      .from(conversations)
      .leftJoin(messages, eq(conversations.lastMessageId, messages.id))
      .where(sql`${userId} = ANY(${conversations.participantIds})`)
      .orderBy(desc(conversations.updatedAt));

    return result.map(row => ({
      ...row.conversations,
      lastMessage: row.messages || undefined
    }));
  }

  async createMessage(message: InsertMessage & { senderId: string }): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    
    // Update conversation's last message
    await db.update(conversations)
      .set({ 
        lastMessageId: newMessage.id,
        updatedAt: new Date()
      })
      .where(eq(conversations.id, message.conversationId));
    
    return newMessage;
  }

  async getConversationMessages(conversationId: string, limit = 50, cursor?: string): Promise<(Message & { sender: User })[]> {
    let query = db.select()
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.conversationId, conversationId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);

    if (cursor) {
      query = query.where(and(
        eq(messages.conversationId, conversationId),
        sql`${messages.createdAt} < (SELECT created_at FROM messages WHERE id = ${cursor})`
      ));
    }

    const result = await query;
    return result.map(row => ({
      ...row.messages,
      sender: row.users
    }));
  }

  async markMessageAsSeen(messageId: string, userId: string): Promise<void> {
    await db.update(messages)
      .set({ 
        seenBy: sql`array_append(COALESCE(${messages.seenBy}, ARRAY[]::text[]), ${userId})`
      })
      .where(and(
        eq(messages.id, messageId),
        sql`NOT ${userId} = ANY(COALESCE(${messages.seenBy}, ARRAY[]::text[]))`
      ));
  }

  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    const [newNotification] = await db.insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async getUserNotifications(userId: string, limit = 20): Promise<(Notification & { actor: User })[]> {
    const result = await db.select()
      .from(notifications)
      .innerJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    return result.map(row => ({
      ...row.notifications,
      actor: row.users
    }));
  }

  async markNotificationAsRead(id: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
