# MAR ABU Project Management System

A comprehensive, enterprise-grade project and task management application built for MAR ABU PROJECTS SERVICES LTD. This system provides JIRA-like functionality with support for multiple project methodologies (Agile, Waterfall, Kanban), advanced user management, reporting, and integration capabilities.

## Architecture

The application follows a modern full-stack architecture with clear separation of concerns:

```
├── backend/          # Node.js/Express API Server
│   ├── src/
│   │   ├── models/   # Database models with ORM
│   │   ├── services/ # Business logic layer
│   │   ├── controllers/ # API controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── types/    # TypeScript type definitions
│   │   └── utils/    # Utility functions
│   └── prisma/       # Database schema and migrations
│
├── frontend/         # React.js Client Application
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/    # Page components
│   │   ├── store/    # Redux state management
│   │   ├── services/ # API service layer
│   │   ├── hooks/    # Custom React hooks
│   │   └── types/    # TypeScript type definitions
│   └── public/       # Static assets
│
└── docker/           # Docker configuration files
```

## Domain Model Hierarchy

The system follows a clear hierarchical structure:

**Teams → Projects → Tasks → Issues**

- **Teams**: Groups of users working together
- **Projects**: Work initiatives managed by teams
- **Tasks**: Main work items within projects (Epics, Stories, Tasks, Subtasks)
- **Issues**: Problems, bugs, or improvements related to tasks

## Features

### Core Functionality
- **Team Management**: Create and manage development teams with role-based access
- **Project Management**: Support for Agile, Waterfall, Kanban, and Hybrid methodologies
- **Task Management**: Comprehensive task tracking with dependencies, subtasks, and custom fields
- **Jira-Style Workflow System**: State machine-based workflow with validated transitions (BASIC, AGILE, BUG_TRACKING)
- **Issue Tracking**: Bug tracking and issue management with severity levels
- **Agile/Scrum**: Sprint management, backlog prioritization, and velocity tracking
- **Kanban Boards**: Status-based columns with drag-and-drop and workflow validation
- **Time Tracking**: Manual and timer-based time logging with reporting
- **Reporting**: Advanced analytics, dashboards, and data export capabilities
- **Bulk Operations**: Workflow-validated bulk task transitions with detailed error reporting
- **Notifications**: Real-time notifications and communication features
- **Integration**: REST API, webhooks, and external tool integrations

### Technical Features
- **Security**: JWT authentication, RBAC, data encryption, and audit logging
- **Performance**: Redis caching, database optimization, and rate limiting
- **Scalability**: Microservices-ready architecture with containerized deployment
- **Mobile**: Responsive design with PWA capabilities

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest with Supertest

### Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit + React Query
- **UI Library**: Material-UI (MUI)
- **Routing**: React Router v6
- **Forms**: React Hook Form with Yup validation
- **Charts**: Recharts
- **Real-time**: Socket.io client
- **Build Tool**: Vite

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Management**: Adminer
- **Cache Management**: Redis Commander
- **Process Management**: PM2 (production)

## Quick Start

### Prerequisites
- Node.js 18 or higher
- Docker and Docker Compose
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mar-abu-project-management
   ```

2. **Backend Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   npm install
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Start with Docker (Recommended)**
   ```bash
   docker-compose up -d
   ```

5. **Or run locally**
   ```bash
   # Start PostgreSQL and Redis
   docker-compose up -d postgres redis
   
   # Backend
   cd backend
   npm run migrate
   npm run db:seed
   npm run dev
   
   # Frontend (in another terminal)
   cd frontend
   npm run dev
   ```

### Access Points
- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Database Admin**: http://localhost:8080 (Adminer)
- **Redis Admin**: http://localhost:8081 (Redis Commander)

## Development

### Backend Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run migrate` - Run database migrations
- `npm run db:seed` - Seed database with initial data

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Database Management
```bash
cd backend

# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Open Prisma Studio
npx prisma studio
```

## API Documentation

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token

### Teams
- `GET /api/teams` - List teams
- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `PUT /api/teams/:id` - Update team

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project

### Tasks
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task

### Issues
- `GET /api/issues` - List issues
- `POST /api/issues` - Create issue
- `GET /api/issues/:id` - Get issue details
- `PUT /api/issues/:id` - Update issue

*Full API documentation will be available at `/api/docs` once implemented.*

## Environment Variables

### Backend (.env)
```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/mar_abu_pm

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3000
```

## Testing

### Backend
```bash
cd backend
npm test
npm run test:watch
```

### Frontend
```bash
cd frontend
npm test
npm run test:ui
```

## Deployment

### Production Build
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm run preview
```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production containers
docker-compose -f docker-compose.prod.yml up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please contact the development team at MAR ABU PROJECTS SERVICES LTD.

---

**MAR ABU PROJECTS SERVICES LTD** - Building the future of project management.