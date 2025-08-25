# BlanX - Social Media Platform

## Overview

BlanX is a modern social media platform built with a full-stack TypeScript architecture. It provides core social networking features including user profiles, posts with media, social interactions (likes, comments, follows), real-time messaging, and content discovery. The application follows a client-server architecture with a React frontend and Express backend, using PostgreSQL for data persistence and authentication via Passport.js sessions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **Routing**: Wouter for lightweight client-side routing with protected route patterns
- **State Management**: TanStack React Query for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component system and Tailwind CSS for styling
- **Form Handling**: React Hook Form with Zod schema validation for type-safe form management
- **Authentication Flow**: Context-based auth provider with automatic session validation and protected routes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework in TypeScript
- **Database ORM**: Drizzle ORM with type-safe schema definitions and migrations
- **Authentication**: Passport.js with local strategy, session-based auth using PostgreSQL session store
- **API Design**: RESTful API endpoints with consistent error handling and request/response patterns
- **Security**: Password hashing with scrypt, CSRF protection via express-session configuration

### Data Layer
- **Database**: PostgreSQL with Neon serverless driver for cloud deployment
- **Schema Design**: Relational model supporting users, posts, follows, likes, comments, messages, and notifications
- **Data Validation**: Zod schemas shared between client and server for consistent validation
- **Session Management**: PostgreSQL-backed session storage with connect-pg-simple

### Component Architecture
- **Layout System**: Fixed navigation with responsive sidebar layout, mobile-first design approach
- **Component Pattern**: Composition-based UI components with consistent prop interfaces
- **State Patterns**: Server state via React Query, form state via React Hook Form, global auth state via Context API
- **Styling System**: CSS variables with dark mode support, design tokens through Tailwind configuration

## External Dependencies

### Core Framework Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver for database connectivity
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect for data access layer
- **@tanstack/react-query**: Server state management and caching solution
- **passport**: Authentication middleware with local strategy implementation

### UI and Styling
- **@radix-ui/***: Unstyled accessible UI primitives for consistent component behavior
- **tailwindcss**: Utility-first CSS framework with custom design system configuration
- **class-variance-authority**: Type-safe variant management for component styling
- **embla-carousel-react**: Touch-friendly carousel component for media display

### Development and Build Tools
- **vite**: Frontend build tool with React plugin and development server
- **typescript**: Static type checking across the entire application stack
- **react-hook-form**: Performant form library with validation integration
- **@hookform/resolvers**: Zod resolver for seamless form validation

### Authentication and Session Management
- **express-session**: Session middleware with PostgreSQL store integration
- **connect-pg-simple**: PostgreSQL session store for persistent authentication
- **crypto**: Node.js crypto module for secure password hashing with scrypt

### Media and File Handling
- **date-fns**: Date manipulation and formatting utilities
- **lucide-react**: Icon library with tree-shaking support for optimal bundle size