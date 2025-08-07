# Overview

This is a full-stack order management system for "RAJMAHAL the groom studio" built with React, Express, and Drizzle ORM. The application manages orders, staff assignments, entry statuses, and delivery tracking for a custom tailoring business. It features a modern, responsive UI using shadcn/ui components and Tailwind CSS, with both local storage fallback and Google Sheets integration for data persistence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side navigation
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for brand theming
- **Forms**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **API Design**: RESTful API with CRUD operations for orders, staff book, and entry status
- **Storage Pattern**: In-memory storage implementation with interface abstraction for easy database switching
- **Development Setup**: Vite middleware integration for hot reloading in development

## Database Schema
- **Orders Table**: Tracks order details, delivery status, staff assignments, and customer information
- **Staff Book Table**: Manages billbook ranges assigned to specific staff members
- **Entry Status Table**: Tracks product entry status and package completion

## Data Persistence Strategy
- **Primary**: Database storage using Drizzle ORM with PostgreSQL
- **Fallback**: Local storage for offline capability
- **External Integration**: Google Sheets Web App for data synchronization (optional)

## Authentication & Authorization
- Currently implements session-based architecture without active authentication
- Cookie-based session management infrastructure in place for future implementation

## External Dependencies
- **Neon Database**: Serverless PostgreSQL database provider (@neondatabase/serverless)
- **Google Sheets**: Active integration for data backup and synchronization via Google Apps Script (Configured: August 7, 2025)
- **Replit**: Development environment with custom Vite plugins for debugging and cartography

## Recent Updates (August 7, 2025)
- **Google Sheets Integration**: Completed full setup with custom Apps Script for RAJMAHAL system
- **Sync Functionality**: Backend API endpoints for one-click data synchronization
- **UI Enhancements**: Added Google Sheets page with setup instructions and status monitoring
- **Data Structure**: Optimized for Orders, Staff Book, and Entry Status with professional formatting
- **Bug Fixes**: Resolved infinite re-render issues in main page filtering system

The architecture follows a modular pattern with clear separation between client and server code, shared schema definitions, and flexible storage abstractions that support both development and production environments.