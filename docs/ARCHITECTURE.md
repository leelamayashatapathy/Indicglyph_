# Architecture Documentation

## Stack
- **Backend**: FastAPI (async) + PostgreSQL
- **Frontend**: React 18 + Vite
- **Auth**: JWT tokens + role-based access control
- **Database**: PostgreSQL with JSONB support (adapter pattern for flexibility)

## Repository Structure

```
/backend/app/
  /api/          # API route handlers
    auth.py      # Authentication endpoints
    items.py     # Items CRUD endpoints
  /core/         # Core utilities
    config.py    # Application settings
    security.py  # JWT, password hashing, auth
  /db/           # Database layer
    db_adapter.py  # PostgreSQL adapter with unified interface
  /models/       # Domain models
    user.py      # User domain model
  /schemas/      # Pydantic schemas
    user.py      # User API schemas
    item.py      # Item API schemas
  main.py        # FastAPI app entry point

/frontend/src/
  /components/   # Reusable components (empty - minimal approach)
  /pages/        # Page components
    ItemsPage.jsx
    LoginPage.jsx
    RegisterPage.jsx
    ProfilePage.jsx
  /services/     # API client
    api.js       # Centralized API service
  /hooks/        # React hooks
    useAuth.jsx  # Authentication hook
  /utils/        # Utility functions (empty)
  App.jsx        # Main app component
  main.jsx       # React entry point
  index.css      # Global styles

/shared/         # Shared utilities (future use)
/docs/           # Documentation
```

## Backend Architecture

### PostgreSQL Adapter Pattern
The adapter provides a clean, async-compatible interface over PostgreSQL:

```python
users_db = DatabaseAdapter(prefix="user")
datasets_db = DatabaseAdapter(prefix="dataset")
dataset_items_db = DatabaseAdapter(prefix="dataset_item")
```

Benefits:
- Collection-based organization via prefixes
- Async-compatible API (asyncpg)
- JSONB support for flexible schemas
- ACID compliance and relational integrity
- Easy to extend or swap implementations

### Security Layer
- **Password Hashing**: bcrypt via passlib
- **JWT Tokens**: HS256 algorithm
- **Role-Based Access**: Decorator pattern with FastAPI dependencies
- **Token Validation**: Automatic via HTTPBearer security

### API Routes
All routes under `/api/v1`:
- `/auth/*` - Authentication and user management
- `/items/*` - Items CRUD with role checks

## Frontend Architecture

### Authentication Flow
1. User logs in via Basic Auth
2. Backend returns JWT token
3. Token stored in localStorage
4. Token sent as Bearer token in subsequent requests
5. useAuth hook manages auth state globally

### State Management
- Local state via useState
- Auth context via React Context
- No external state library (minimal deps)

### API Integration
Centralized API service in `services/api.js`:
- Automatic token injection
- Error handling
- Type-safe responses

## Database Schema

### User Keys
Format: `user:{username}`

```json
{
  "user_id": "username",
  "username": "string",
  "email": "string",
  "hashed_password": "bcrypt_hash",
  "role": "user|admin|guest",
  "is_active": true,
  "created_at": "ISO8601"
}
```

### Item Keys
Format: `data:item:{item_id}`

```json
{
  "item_id": "timestamp_id",
  "name": "string",
  "description": "string",
  "price": 99.99,
  "available": true,
  "created_at": "ISO8601",
  "created_by": "username"
}
```

## Security Considerations

1. **Passwords**: Never stored in plain text, always bcrypt hashed
2. **Tokens**: Short-lived (30 min), stored client-side only
3. **CORS**: Restricted to specific origins
4. **Role Checks**: Server-side enforcement
5. **Input Validation**: Pydantic schemas validate all input

## Deployment

### Development
- Backend: `uvicorn backend.app.main:app --host 0.0.0.0 --port 5000 --reload`
- Frontend: `npm run dev` (port 5173, proxies API to :5000)

### Production
- Single deployment with backend serving frontend static files
- Or separate deployments with CORS configured

## Performance Considerations

1. **Async I/O**: All DB operations are async-compatible
2. **Minimal Dependencies**: Reduces bundle size and attack surface
3. **Vite**: Fast HMR and optimized builds
4. **No Dead Code**: All code is actively used

## Future Enhancements

1. **Database Migrations**: Version control for schema changes
2. **Refresh Tokens**: For longer sessions
3. **Rate Limiting**: Prevent abuse
4. **WebSockets**: Real-time updates
5. **Caching**: Redis for performance optimization (optional)
