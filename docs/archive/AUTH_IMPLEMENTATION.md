# Authentication & Authorization Implementation

## ✅ Implementation Complete

Complete JWT authentication with bcrypt password hashing and role-based access control for the Data Review Platform.

---

## 🔐 Security Features

### 1. **Password Hashing**
- **Algorithm**: bcrypt (compatible version 4.1.3)
- **Library**: passlib with bcrypt backend
- **Salt**: Automatically generated per password
- **Cost Factor**: Default bcrypt settings

### 2. **JWT Tokens**
- **Algorithm**: HS256 (HMAC-SHA256)
- **Expiration**: 24 hours (1440 minutes)
- **Payload**: `{"sub": username, "roles": [...],"exp": timestamp}`
- **Secret Key**: Configurable via `backend/app/config.py`

### 3. **Role-Based Access Control (RBAC)**
- **Default Role**: All new users get `["user"]` role
- **Available Roles**: `user`, `reviewer`, `admin`, `superadmin`
- **Role Assignment**: Server-controlled, NEVER from client input
- **Admin Roles**: `admin` and `superadmin` have full platform access

---

## 📊 Data Model

### User Schema (Replit DB)

**Storage Key**: `user:{username}`

```json
{
  "_id": "username",
  "username": "string",
  "email": "user@example.com",
  "hashed_password": "bcrypt_hash_string",
  "roles": ["user"],
  "languages": [],
  "is_active": true,
  "created_at": "2025-10-23T15:45:46.084961",
  "payout_balance": 0.0,
  "reviews_done": 0
}
```

### Pydantic Models

**UserCreate** (Registration - NO roles field for security)
```python
{
  "username": str,
  "email": str (EmailStr),
  "password": str (min 6 chars),
  "languages": List[str] (optional)
}
```

**UserLogin**
```python
{
  "username": str,
  "password": str
}
```

**UserResponse** (Public user data)
```python
{
  "_id": str,
  "username": str,
  "email": str,
  "roles": List[str],
  "languages": List[str],
  "is_active": bool,
  "created_at": str,
  "payout_balance": float,
  "reviews_done": int
}
```

**AuthResponse** (Login/Register response)
```python
{
  "access_token": str,
  "token_type": "bearer",
  "user": UserResponse
}
```

---

## 🛣️ API Endpoints

### Authentication Routes (`/api/auth`)

#### `POST /api/auth/register`
**Create new user account and return JWT token**

**Request**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "languages": ["en", "es"]  // optional
}
```

**Response** (201 Created):
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "_id": "newuser",
    "username": "newuser",
    "email": "user@example.com",
    "roles": ["user"],  // Always ["user"] for new registrations
    "languages": ["en", "es"],
    "is_active": true,
    "created_at": "2025-10-23T15:45:46.084961",
    "payout_balance": 0.0,
    "reviews_done": 0
  }
}
```

**Security**: Even if client sends `"roles": ["admin"]`, it will be ignored and user gets `["user"]`.

---

#### `POST /api/auth/login`
**Login with credentials and get JWT token**

**Request**:
```json
{
  "username": "newuser",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": { /* UserResponse */ }
}
```

**Errors**:
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account is inactive

---

#### `GET /api/auth/me`
**Get current user profile (requires authentication)**

**Headers**:
```
Authorization: Bearer eyJhbGci...
```

**Response** (200 OK):
```json
{
  "_id": "newuser",
  "username": "newuser",
  "email": "user@example.com",
  "roles": ["user"],
  "languages": ["en"],
  "is_active": true,
  "created_at": "2025-10-23T15:45:46.084961",
  "payout_balance": 0.0,
  "reviews_done": 0
}
```

**Errors**:
- `401 Unauthorized`: No token or invalid token

---

#### `POST /api/auth/logout`
**Logout (client should delete token)**

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

*Note: Logout is client-side only. Client must delete the JWT token.*

---

### Admin Routes (`/api/admin`)

**🔒 All admin routes require `admin` or `superadmin` role**

#### `GET /api/admin/users`
**List all users (admin only)**

**Headers**: `Authorization: Bearer <admin_token>`

**Response** (200 OK):
```json
[
  {
    "_id": "user1",
    "username": "user1",
    "email": "user1@example.com",
    "roles": ["user"],
    "languages": [],
    "is_active": true,
    "created_at": "2025-10-23T15:45:46.084961",
    "payout_balance": 0.0,
    "reviews_done": 0
  },
  ...
]
```

**Errors**:
- `403 Forbidden`: User doesn't have admin role

---

#### `PUT /api/admin/users/{username}`
**Update user (admin only) - INCLUDING ROLE ASSIGNMENT**

**Headers**: `Authorization: Bearer <admin_token>`

**Request**:
```json
{
  "email": "newemail@example.com",  // optional
  "roles": ["reviewer", "admin"],    // optional - ONLY ADMINS CAN MODIFY
  "languages": ["en", "fr"],         // optional
  "is_active": false                 // optional
}
```

**Response** (200 OK): Updated `UserResponse`

**Errors**:
- `403 Forbidden`: Not an admin
- `404 Not Found`: User doesn't exist

---

#### `DELETE /api/admin/users/{username}`
**Delete user (admin only)**

**Headers**: `Authorization: Bearer <admin_token>`

**Response** (200 OK):
```json
{
  "message": "User username deleted"
}
```

---

#### `GET /api/admin/stats`
**Get platform statistics (admin only)**

**Headers**: `Authorization: Bearer <admin_token>`

**Response** (200 OK):
```json
{
  "users": {
    "total": 5,
    "active": 5
  },
  "queue": {
    "total_items": 0,
    "assigned": 0,
    "unassigned": 0
  },
  "totals": {
    "total_balance_outstanding": 0.0,
    "total_reviews_completed": 0
  }
}
```

---

## 🔧 Implementation Details

### Role Checking (`backend/app/utils/role_checker.py`)

```python
def require_roles(allowed_roles: List[str]):
    """
    Dependency to enforce role requirement.
    User must have at least one of the allowed roles.
    """
    def role_dependency(user_data: dict) -> dict:
        user_roles = user_data.get("roles", [])
        if not any(role in allowed_roles for role in user_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {', '.join(allowed_roles)}"
            )
        return user_data
    return role_dependency
```

### Admin Dependency (`backend/app/routes/routes_admin.py`)

```python
def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Get current user and verify admin/superadmin access."""
    user_roles = current_user.get("roles", [])
    if not any(role in ["admin", "superadmin"] for role in user_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions. Required roles: admin, superadmin"
        )
    return current_user
```

### Usage in Routes

```python
@router.get("/admin/users")
def list_all_users(current_user: dict = Depends(get_admin_user)):
    """List all users (admin only)."""
    # current_user is guaranteed to have admin or superadmin role
    ...
```

---

## 🛡️ Security Measures

### ✅ Implemented

1. **Privilege Escalation Prevention**
   - Removed `roles` from `UserCreate` schema
   - Server always assigns `["user"]` role to new registrations
   - Only admins can modify user roles via PUT endpoint

2. **Password Security**
   - bcrypt hashing with automatic salting
   - Cost factor optimized for security vs performance

3. **Token Security**
   - HS256 algorithm for JWT
   - 24-hour expiration
   - Includes only necessary claims (sub, roles, exp)

4. **Input Validation**
   - Pydantic validates all request data
   - Email validation with `EmailStr`
   - Password minimum length (6 chars)
   - Username constraints (3-50 chars)

5. **Replit DB ObservedList Handling**
   - `User.from_dict()` converts ObservedList to plain Python lists
   - Prevents JSON serialization errors

### 🔐 Best Practices

1. **Never expose hashed_password** in API responses
2. **Always use HTTPS** in production
3. **Rotate SECRET_KEY** regularly
4. **Monitor failed login attempts**
5. **Implement rate limiting** (future enhancement)
6. **Add refresh tokens** for long sessions (future enhancement)

---

## 🧪 Testing

### Manual Testing Commands

```bash
# 1. Register a user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# 2. Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# 3. Get current user (replace TOKEN)
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer TOKEN"

# 4. Try accessing admin route as regular user (should fail with 403)
curl -X GET http://localhost:8000/api/admin/users \
  -H "Authorization: Bearer TOKEN"

# 5. Create admin user (manually update in DB for first admin)
# Then login as admin and access admin routes
```

### Test Cases Verified

✅ User registration creates JWT token  
✅ User registration defaults to `["user"]` role  
✅ Client cannot self-assign admin roles  
✅ Login validates credentials  
✅ Login returns valid JWT token  
✅ JWT tokens contain username and roles  
✅ /me endpoint returns user profile  
✅ Invalid tokens return 401  
✅ Regular users blocked from admin routes (403)  
✅ Admin users can access admin routes  
✅ Admin users can modify other users' roles  
✅ Replit DB ObservedList properly converted  

---

## 📦 Dependencies

```
fastapi==0.115.0
uvicorn==0.32.1
pydantic==2.10.4
pydantic-settings==2.7.1
python-jose[cryptography]==3.5.0  # JWT handling
passlib[bcrypt]==1.7.4            # Password hashing
bcrypt==4.1.3                     # Compatible bcrypt version
python-multipart==0.0.20
email-validator==2.3.0
replit==4.1.2
```

---

## 🚀 Production Deployment Checklist

- [ ] Change `SECRET_KEY` in config to a strong random value
- [ ] Use environment variable for SECRET_KEY
- [ ] Enable HTTPS only (no HTTP)
- [ ] Set appropriate CORS origins
- [ ] Add rate limiting to auth endpoints
- [ ] Implement refresh token mechanism
- [ ] Add logging for failed login attempts
- [ ] Set up monitoring and alerts
- [ ] Create first admin user via database directly
- [ ] Test all auth flows in production environment

---

## 📝 Configuration

**`backend/app/config.py`**:

```python
class Config:
    APP_NAME = "Data Review Platform"
    DEBUG = True
    HOST = "0.0.0.0"
    PORT = 8000
    
    # Security
    SECRET_KEY = "your-secret-key-change-in-production"  # ⚠️ CHANGE THIS!
    ALGORITHM = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours
    
    # CORS
    ALLOWED_ORIGINS = [
        "http://localhost:5000",
        "http://localhost:3000",
    ]
```

---

**Implementation complete and secure! 🎉**
