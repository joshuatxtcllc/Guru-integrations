# Frame Guru Complete System Architecture

This document outlines the complete architecture for The Frame Guru's integrated business system, combining e-commerce, point-of-sale (POS), 3D visualization, order tracking, and customer interaction capabilities.

## System Overview

The Frame Guru system is built with a modern, scalable microservices architecture that seamlessly connects in-store and online operations. The system provides a unified experience for customers while giving staff efficient tools for production and order management.

## Core Components

### 1. Frontend Systems

#### Website & E-commerce
- **Technologies**: React.js, Next.js, Tailwind CSS
- **Features**:
  - Product catalog with standardized frame options
  - 3D frame visualization with mat color selection
  - Artwork upload and preview capabilities
  - User account management
  - Shopping cart and checkout
  - Order tracking

#### Mobile Responsive Design
- Progressive Web App (PWA) capabilities
- Touch-friendly interface for in-store kiosks

#### Point of Sale (POS) Integration
- Square POS integration for in-store transactions
- Shared inventory and customer database with online store
- Custom order entry system for in-person consultations

### 2. Backend Services

#### API Gateway
- **Technologies**: Express.js, Node.js
- Central entry point for all client applications
- Authentication and request routing
- Rate limiting and security features

#### User & Authentication Service
- Customer account management
- Staff account management with role-based permissions
- OAuth2 integration with social login options
- JWT token management

#### Product Catalog Service
- Standard frame product management
- Custom framing tier configuration
- Pricing calculation engine
- Inventory tracking

#### 3D Visualization Engine
- **Technologies**: Three.js (for web), WebGL
- Frame style and material rendering
- Mat color selection visualization
- Artwork upload and preview generation
- Frame configuration state management

#### Order Management System
- Order creation and processing
- Status tracking and updates
- Production workflow management
- Custom order specifications
- Estimated completion date calculation

#### Payment Processing
- Integration with Stripe for online payments
- Integration with Square for in-store POS
- Secure payment handling and PCI compliance
- Invoice generation for custom orders

#### Notification Service
- Email notifications for order updates
- SMS notifications (optional opt-in)
- Push notifications for mobile users
- Scheduled follow-up communications

#### AI Chatbot Service
- **Technologies**: Dialogflow, Node.js
- Order status inquiries
- Product information assistance
- Basic custom framing consultations
- Handoff to human agents when needed

### 3. Database & Storage

#### Primary Database
- **Technology**: MongoDB
- Document-based storage for flexible schema
- Collections:
  - Customers
  - Products
  - Orders
  - Framing Tiers
  - Notifications
  - Chat Sessions

#### Caching Layer
- **Technology**: Redis
- Session management
- Frequent queries caching
- Rate limiting support

#### File Storage
- **Technology**: AWS S3
- Customer artwork storage
- Product images
- 3D model files
- Generated frame previews

### 4. Supporting Services

#### Analytics & Reporting
- Sales performance tracking
- Inventory management reports
- Customer behavior analysis
- Production efficiency metrics

#### Search Engine
- Product search functionality
- Order search for admins
- Elasticsearch for fast, flexible searching

#### Content Management
- Blog posts and educational content
- Framing tips and guidelines
- Event announcements

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATIONS                             │
│                                                                          │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │
│  │             │   │             │   │             │   │             │   │
│  │  Website    │   │  Mobile     │   │  In-Store   │   │  Admin      │   │
│  │  (React)    │   │  PWA        │   │  POS/Kiosk  │   │  Dashboard  │   │
│  │             │   │             │   │             │   │             │   │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   └──────┬──────┘   │
│         │                 │                 │                 │          │
└─────────┼─────────────────┼─────────────────┼─────────────────┼──────────┘
          │                 │                 │                 │
          │                 │                 │                 │
┌
