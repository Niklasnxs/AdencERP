# AdencERP Backend Service

Node.js/Express REST API with PostgreSQL database for AdencERP TimeTrack & Attendance System.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **RESTful API**: Complete CRUD operations for all entities
- **PostgreSQL Database**: Persistent data storage with migrations
- **Docker Ready**: Fully containerized with health checks
- **Security**: CORS, input validation, admin-only routes

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Projects
- `GET /api/projects` - Get all projects
- `POST /api/projects` - Create project (admin only)
- `PUT /api/projects/:id` - Update project (admin only)

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task

### Time Logs
- `GET /api/timelogs` - Get time logs (with filters)
- `POST /api/timelogs` - Create time log
- `PUT /api/timelogs/:id` - Update time log
- `DELETE /api/timelogs/:id` - Delete time log

### Absences
- `GET /api/absences` - Get absences (with filters)
- `POST /api/absences` - Create absence
- `PUT /api/absences/:id` - Update absence
- `DELETE /api/absences/:id` - Delete absence
- `DELETE /api/absences/user/:user_id/date/:date` - Delete by user and date

### Notifications
- `GET /api/notifications/:user_id` - Get user notifications
- `PUT /api/notifications/:id/read` - Mark as read

## Setup

### Local Development

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials

# Run migrations
npm run migrate

# Start server
npm run dev
```

### Docker Deployment

The backend is included in the main docker-compose.yml:

```bash
# From project root
docker-compose up -d --build

# Run migrations
docker exec adencerp-backend npm run migrate

# Check logs
docker logs -f adencerp-backend
```

## Environment Variables

```env
DB_HOST=db
DB_PORT=5432
DB_USER=adencerp
DB_PASSWORD=your_password
DB_NAME=adencerp
PORT=3002
JWT_SECRET=your_jwt_secret
ALLOWED_ORIGINS=http://localhost:5173,http://localhost
```

## Database Schema

- **users** - User accounts with roles
- **projects** - Project definitions
- **project_assignments** - User-project mappings
- **tasks** - Project tasks
- **time_logs** - Work time entries
- **absences** - Absence records
- **notifications** - User notifications

## Default Users

After running migrations:
- **Admin**: admin@adenc.de / admin123
- **Employee**: max.mueller@adenc.de / emp123
- **Employee**: anna.schmidt@adenc.de / emp123

## Security

- Passwords hashed with bcrypt (10 rounds)
- JWT tokens expire after 24 hours
- Admin-only routes protected
- CORS enabled for specified origins
- SQL injection protection via parameterized queries

## Health Check

```bash
curl http://localhost:3002/api/health
```

Response:
```json
{
  "status": "ok",
  "service": "adencerp-backend"
}
```
