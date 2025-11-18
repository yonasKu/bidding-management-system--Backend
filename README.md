# Backend - Ethiopian Bidding System API

NestJS-based REST API for the Ethiopian procurement and bidding management system.

## Description

Production-ready backend API built with NestJS, PostgreSQL, and Prisma ORM. Implements Ethiopian procurement standards and Directive No. 430/2018 compliance.

## 📁 Folder Structure

```
backend/
├── prisma/              # Database schema and migrations
│   ├── schema.prisma    # Prisma schema (PostgreSQL)
│   └── migrations/      # Database migration files
├── src/
│   ├── admin/           # Admin dashboard endpoints
│   ├── auth/            # Authentication (JWT, guards, strategies)
│   ├── bids/            # Bid management (submit, list, download)
│   ├── evaluations/     # Bid evaluation system
│   ├── prisma/          # Prisma service
│   ├── tenders/         # Tender management (CRUD, status)
│   ├── app.module.ts    # Root module
│   └── main.ts          # Application entry point
├── uploads/             # Uploaded bid PDFs
├── Dockerfile           # Docker container configuration
├── docker-compose.yml   # Full stack orchestration
└── .env                 # Environment variables

```

## 🚀 Features

### Core API Endpoints

#### Authentication
- `POST /auth/register` - Register new user (vendor/admin)
- `POST /auth/login` - Login with JWT token
- `POST /auth/logout` - Logout and clear cookies
- `GET /auth/me` - Get current user profile

#### Tenders
- `GET /tenders` - List all tenders (with filters)
- `GET /tenders/:id` - Get tender details
- `POST /tenders` - Create new tender (admin only)
- `PATCH /tenders/:id` - Update tender (admin only)
- `POST /tenders/:id/cancel` - Cancel tender (admin only)

#### Bids
- `GET /bids` - List my bids (vendor)
- `GET /bids/tender/:id` - List bids for tender (admin)
- `POST /bids` - Submit bid with PDF
- `GET /bids/:id/download` - Download bid PDF

#### Evaluations
- `POST /evaluations` - Create evaluation (admin only)
- `GET /evaluations/bid/:id` - Get evaluation for bid

#### Admin
- `GET /admin/stats` - Dashboard statistics

### Ethiopian Features

#### 1. **30-Day Deadline Validation**
- Enforces minimum 30-day bid period
- References Ethiopian Procurement Directive No. 430/2018
- Location: `src/tenders/tenders.service.ts`

#### 2. **Tender Categories**
- GOODS (ዕቃዎች)
- SERVICES (አገልግሎቶች)
- WORKS (ስራዎች)
- CONSULTANCY (አማካሪነት)
- INFRASTRUCTURE (መሠረተ ልማት)

#### 3. **Ethiopian Regions**
- All 13 regions + 2 city administrations
- Stored as enum in database
- Location: `prisma/schema.prisma`

#### 4. **Bid Security (2-5%)**
- Tracks bid security amount
- Bank guarantee document upload
- Calculated from tender's bidSecurityRate

#### 5. **70/30 Evaluation Split**
- Technical Score: 70 points
- Financial Score: 30 points
- Detailed criteria tracking
- Location: `src/evaluations/`

#### 6. **Public Bid Opening**
- Opening date/time tracking
- Location field
- Transparency requirement

### Security Features

- ✅ **JWT Authentication** - httpOnly cookies
- ✅ **Role-Based Access Control** - Admin/Vendor roles
- ✅ **Password Hashing** - bcrypt
- ✅ **CORS Protection** - Configured for frontend
- ✅ **Helmet** - Security headers
- ✅ **Input Validation** - Zod schemas
- ✅ **SQL Injection Prevention** - Prisma ORM

## 🛠️ Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

**Required Environment Variables**:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/bidding_db"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
COOKIE_SECURE="false"  # true in production
FILE_UPLOAD_DIR="./uploads"
MAX_UPLOAD_MB="10"
```

### 3. Database Setup
```bash
# Run migrations
npx prisma migrate dev

# Generate Prisma Client
npx prisma generate

# (Optional) Seed data
npm run seed
```

### 4. Start Development Server
```bash
# Watch mode (auto-reload)
npm run start:dev

# Regular mode
npm run start

# Production mode
npm run start:prod
```

API runs on: **http://localhost:4000**

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)
```bash
# Start PostgreSQL + Backend + Frontend
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Build Docker Image
```bash
# Build
docker build -t bidding-backend .

# Run
docker run -p 4000:4000 --env-file .env bidding-backend
```

## 📊 Database

### Technology
- **PostgreSQL 14+** - Production database
- **Prisma ORM** - Type-safe database access
- **Migrations** - Version-controlled schema changes

### Models
1. **User** - Accounts with Ethiopian business info
2. **Tender** - Procurement tenders with categories/regions
3. **Bid** - Vendor submissions with security
4. **Evaluation** - 70/30 scoring system

### Key Features
- UUID primary keys
- Indexed queries (10 indexes)
- Decimal precision for Ethiopian Birr
- Enum types for categories/regions/status

### Prisma Commands
```bash
# Create migration
npx prisma migrate dev --name description

# Apply migrations (production)
npx prisma migrate deploy

# Reset database (CAUTION: deletes data)
npx prisma migrate reset

# Open Prisma Studio (GUI)
npx prisma studio
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 📝 API Documentation

### Health Check
```bash
GET /health
Response: { status: 'ok', database: 'connected', timestamp: '...' }
```

### Authentication Flow
1. Register: `POST /auth/register`
2. Login: `POST /auth/login` → Returns JWT in httpOnly cookie
3. Access protected routes with cookie
4. Logout: `POST /auth/logout`

### File Upload
- **Endpoint**: `POST /bids`
- **Field**: `file` (multipart/form-data)
- **Allowed**: PDF only
- **Max Size**: 10MB
- **Storage**: `./uploads/`

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `COOKIE_SECURE` | Use secure cookies (HTTPS) | `false` |
| `FILE_UPLOAD_DIR` | Upload directory path | `./uploads` |
| `MAX_UPLOAD_MB` | Max file size in MB | `10` |
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `development` |

### CORS Configuration
Edit `src/main.ts` to configure allowed origins:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

## 📦 Dependencies

### Core
- `@nestjs/core` - NestJS framework
- `@nestjs/common` - Common utilities
- `@prisma/client` - Database client
- `prisma` - Database toolkit

### Authentication
- `@nestjs/jwt` - JWT implementation
- `@nestjs/passport` - Authentication strategies
- `bcrypt` - Password hashing

### File Upload
- `@nestjs/platform-express` - Express platform
- `multer` - File upload middleware

### Security
- `helmet` - Security headers
- `cookie-parser` - Cookie handling

### Validation
- `class-validator` - DTO validation
- `class-transformer` - Object transformation

## 🚀 Production Deployment

### Option 1: Docker Compose
```bash
docker-compose up -d
```

### Option 2: Manual
```bash
# Build
npm run build

# Run migrations
npx prisma migrate deploy

# Start
npm run start:prod
```

### Option 3: Cloud Platforms
- **Heroku**: `git push heroku main`
- **AWS**: Use Elastic Beanstalk or ECS
- **DigitalOcean**: App Platform or Droplet

See `../docs/Production-Deployment-Guide.md` for detailed instructions.

## 📈 Performance

### Optimizations
- ✅ Database indexes on frequently queried fields
- ✅ Connection pooling (Prisma)
- ✅ Efficient queries (select specific fields)
- ✅ Caching strategies ready

### Monitoring
```bash
# Check health
curl http://localhost:4000/health

# View logs
docker-compose logs -f backend

# Database stats
npx prisma studio
```

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Check PostgreSQL
docker ps | grep postgres
```

### Migration Errors
```bash
# Reset database (CAUTION)
npx prisma migrate reset

# Force migration
npx prisma migrate deploy --force
```

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :4000
taskkill /PID <PID> /F

# Change port in .env
PORT=4001
```

## 📚 Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Ethiopian Procurement Directive](https://ppa.gov.et)

## 📄 License

MIT License - See LICENSE file for details

---

**Built for Ethiopia 🇪🇹** - Compliant with Procurement Directive No. 430/2018