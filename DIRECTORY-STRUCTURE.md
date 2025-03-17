# Frame Guru Project Directory Structure

This document outlines the recommended directory structure for the Frame Guru application, optimized for GitHub organization and best development practices.

```
frame-guru/
├── .github/                      # GitHub-specific files
│   └── workflows/                # GitHub Actions workflows
│       └── deploy.yml            # Deployment workflow
│
├── client/                       # Frontend React application
│   ├── public/                   # Static files
│   │   ├── index.html           # HTML entry point
│   │   ├── favicon.ico          # Site favicon
│   │   └── assets/              # Static assets (images, fonts)
│   │
│   ├── src/                      # React source files
│   │   ├── components/          # Reusable React components
│   │   │   ├── common/          # Shared UI components
│   │   │   ├── layout/          # Layout components
│   │   │   └── FrameVisualizer.jsx  # 3D frame visualization component
│   │   │
│   │   ├── pages/               # Page components
│   │   │   ├── Home.jsx         # Homepage
│   │   │   ├── Products.jsx     # Products page
│   │   │   ├── CustomOrder.jsx  # Custom order page
│   │   │   └── OrderTracking.jsx # Order tracking page
│   │   │
│   │   ├── services/            # Frontend services
│   │   │   ├── api.js           # API client
│   │   │   └── auth.js          # Authentication service
│   │   │
│   │   ├── utils/               # Utility functions
│   │   ├── styles/              # CSS/styling files
│   │   ├── App.jsx              # Root App component
│   │   └── index.jsx            # React entry point
│   │
│   ├── package.json             # Frontend dependencies
│   └── tailwind.config.js       # Tailwind CSS configuration
│
├── server/                       # Backend Node.js application
│   ├── config/                   # Configuration files
│   │   ├── database.js          # Database configuration
│   │   └── config.js            # Environment configuration
│   │
│   ├── controllers/             # Route controllers
│   │   ├── authController.js    # Authentication controller
│   │   ├── orderController.js   # Order management controller
│   │   └── productController.js # Product controller
│   │
│   ├── middleware/              # Express middleware
│   │   ├── auth.js              # Authentication middleware
│   │   └── errorHandler.js      # Error handling middleware
│   │
│   ├── models/                  # Mongoose models
│   │   └── orderSchema.js       # Order and related schemas
│   │
│   ├── routes/                  # Express routes
│   │   ├── api/                 # API routes
│   │   └── index.js             # Route index
│   │
│   ├── services/                # Backend services
│   │   ├── chatbotService.js    # Chatbot integration
│   │   ├── frameVisualizer.js   # 3D visualization engine
│   │   ├── notificationService.js # Email/SMS notifications
│   │   └── productManagement.js # Product management
│   │
│   ├── templates/               # Email templates
│   │   └── emails/              # Email notification templates
│   │
│   ├── utils/                   # Utility functions
│   └── index.js                 # Backend entry point
│
├── docs/                         # Documentation
│   ├── architecture/            # Architecture documentation
│   │   ├── e-commerce-system.md # E-commerce system design
│   │   └── system-architecture.md # Overall system architecture
│   │
│   ├── deployment/              # Deployment guides
│   │   └── github-guide.md      # GitHub/Replit/Netlify setup
│   │
│   ├── wireframes/              # UI/UX wireframes
│   │   └── homepage.png         # Homepage wireframe
│   │
│   ├── README.md                # Main README
│   ├── WIREFRAMES.md            # Wireframes documentation
│   └── DIRECTORY-STRUCTURE.md   # This file
│
├── .env.example                  # Example environment variables
├── .gitignore                    # Git ignore file
├── package.json                  # Root package.json
└── README.md                     # Repository README
```

## Key Organization Principles

1. **Separate Client and Server**: The frontend React application and backend Node.js server are completely separated, allowing them to be developed and deployed independently if needed.

2. **Component-Based Structure**: Frontend components are organized in a hierarchical structure with common components separated from page-specific ones.

3. **Service-Oriented Backend**: Backend functionality is organized into services that each handle specific business concerns.

4. **Comprehensive Documentation**: The `docs` directory contains detailed documentation about architecture, deployment, and design.

5. **Environment Configuration**: Sensitive configuration values are stored in environment variables, with an example file provided.

## GitHub Organization Benefits

This structure is optimized for GitHub in several ways:

1. **Clear Navigation**: The top-level directories make it easy to navigate between frontend, backend, and documentation.

2. **CI/CD Integration**: The `.github/workflows` directory contains GitHub Actions for continuous integration and deployment.

3. **Issue Management**: The structure supports GitHub issue templates for bug reports and feature requests.

4. **Documentation First**: README files at various levels ensure that developers can understand the codebase structure.

5. **Contributor Friendly**: The organization makes it easier for new contributors to understand where to make changes.

## Development Workflow

For local development:

1. Clone the repository
2. Install dependencies: `npm run install-all`
3. Start the development servers: `npm run dev-full`

This will start both the backend server and the React development server with hot reloading.
