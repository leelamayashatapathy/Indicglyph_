# Backend Scaffolding - Data Review Platform

## ✅ Status: COMPLETE & RUNNING

**Backend URL**: http://localhost:8000  
**API Docs**: http://localhost:8000/api/docs  
**Health Check**: http://localhost:8000/health → `{"status":"ok","storage":"replit-db"}`

---

## 📁 Directory Structure

```
backend/
├── requirements.txt          # Python dependencies
└── app/
    ├── __init__.py
    ├── main.py              # FastAPI app entry point
    ├── config.py            # Application configuration
    ├── db_adapter.py        # Replit DB adapter
    │
    ├── auth/                # Authentication layer
    │   ├── __init__.py
    │   ├── jwt_handler.py   # JWT token creation/validation
    │   └── password_utils.py # Password hashing with bcrypt
    │
    ├── utils/               # Utilities
    │   ├── __init__.py
    │   └── role_checker.py  # Role-based access control
    │
    ├── models/              # Domain models & schemas
    │   ├── __init__.py
    │   ├── user_model.py
    │   ├── dataset_type_model.py
    │   ├── dataset_item_model.py
    │   ├── review_log_model.py
    │   └── payout_model.py
    │
    ├── routes/              # API route handlers
    │   ├── __init__.py
    │   ├── routes_auth.py   # /api/auth
    │   ├── routes_users.py  # /api/users
    │   ├── routes_admin.py  # /api/admin
    │   ├── routes_datasets.py # /api/datasets
    │   ├── routes_reviews.py  # /api/reviews
    │   └── routes_ocr.py      # /api/ocr
    │
    └── services/            # Business logic
        ├── __init__.py
        ├── payout_service.py
        ├── queue_service.py
        ├── review_service.py
        └── ocr_service.py
```

---

## 🔧 Core Components

### 1. **config.py** - Application Configuration
- App settings (name, debug, host, port)
- Security (JWT secret, algorithm, token expiration)
- CORS origins
- Storage type: `replit-db`
- Payout settings (min threshold, rate per review)

### 2. **db_adapter.py** - Replit DB Adapter
Provides clean abstraction over Replit's key-value store with:
- Namespace isolation via prefixes
- CRUD operations (get, set, delete, exists)
- Batch operations (list_keys, get_all, clear_all)

**Namespaces**:
- `user:` - User accounts
- `dataset:` - Datasets
- `dataset_type:` - Dataset types/schemas
- `dataset_item:` - Individual data items
- `review:` - Review logs
- `payout:` - Payout records
- `queue:` - Review queue

---

## 🔐 Authentication & Authorization

### JWT Handler (`auth/jwt_handler.py`)
- Create JWT tokens with expiration
- Decode and validate tokens
- Extract user data from tokens

### Password Utils (`auth/password_utils.py`)
- Hash passwords with bcrypt
- Verify passwords against hashes

### Role Checker (`utils/role_checker.py`)
**Roles**:
- `admin` - Full access to all resources
- `reviewer` - Can review data items, earn payouts
- `user` - Basic authenticated access

**Functions**:
- `check_role()` - Verify user has required role
- `require_admin()` - Admin-only dependency
- `require_reviewer()` - Reviewer/admin dependency

---

## 📊 Data Models

### 1. **User Model** (`models/user_model.py`)
```python
UserCreate, UserLogin, UserResponse, UserUpdate, User
```
- Username, email, hashed password
- Role (admin/reviewer/user)
- Balance (earnings)
- Reviews completed count

### 2. **Dataset Type Model** (`models/dataset_type_model.py`)
```python
DatasetTypeCreate, DatasetTypeResponse, DatasetType
```
- Schema definition for data structure
- Review instructions
- Payout per item

### 3. **Dataset Item Model** (`models/dataset_item_model.py`)
```python
DatasetItemCreate, DatasetItemResponse, DatasetItem
```
- Status: pending → in_review → reviewed/approved/rejected
- Data payload
- Review results

### 4. **Review Log Model** (`models/review_log_model.py`)
```python
ReviewSubmit, ReviewLogResponse, ReviewLog
```
- Reviewer username
- Review data
- Approved/rejected
- Payout amount

### 5. **Payout Model** (`models/payout_model.py`)
```python
PayoutRequest, PayoutResponse, Payout
```
- Status: pending → processing → completed/failed
- Amount, payment method
- Request/process timestamps

---

## 🛣️ API Routes

### Authentication (`/api/auth`)
- `POST /register` - Create new user account
- `POST /login` - Login, get JWT token
- `GET /me` - Get current user profile
- `POST /logout` - Logout (client deletes token)

### Users (`/api/users`)
- `GET /me/balance` - Get user balance & stats
- `GET /me/stats` - Get review statistics
- `GET /{username}` - Get user by username

### Admin (`/api/admin`)
- `GET /users` - List all users
- `PUT /users/{username}` - Update user
- `DELETE /users/{username}` - Delete user
- `GET /payouts` - List all payouts (filterable)
- `POST /payouts/{id}/process` - Process payout
- `GET /stats` - Platform statistics

### Datasets (`/api/datasets`)
- `POST /types` - Create dataset type (admin)
- `GET /types` - List dataset types
- `GET /types/{id}` - Get dataset type
- `POST /items` - Create dataset item
- `GET /items` - List items (filterable)
- `GET /items/{id}` - Get item

### Reviews (`/api/reviews`)
- `GET /queue/next` - Get next item from queue
- `POST /submit` - Submit review
- `GET /my-reviews` - Get review history
- `GET /stats` - Get review stats
- `GET /queue/stats` - Get queue statistics
- `POST /payouts/request` - Request payout
- `GET /payouts/my-payouts` - Get payout history

### OCR (`/api/ocr`)
- `POST /process-image` - Process image with OCR
- `POST /process-document` - Process document (PDF, etc.)
- `POST /validate` - Validate OCR result quality
- `POST /enhance-image` - Enhance image for OCR

---

## 🔄 Services (Business Logic)

### 1. **Payout Service** (`services/payout_service.py`)
- Create payout requests
- Validate balance & minimum threshold
- Process payouts (admin)
- Refund on failure/cancellation

### 2. **Queue Service** (`services/queue_service.py`)
- Add items to review queue
- Get next item for reviewer
- Assign items to reviewers
- Queue statistics

### 3. **Review Service** (`services/review_service.py`)
- Submit reviews
- Update item status
- Update reviewer balance
- Calculate payouts
- Review statistics

### 4. **OCR Service** (`services/ocr_service.py`)
- Process images (text, table, form extraction)
- Process documents (PDF, images)
- Validate OCR quality
- Image enhancement

---

## 📦 Dependencies (requirements.txt)

```
fastapi==0.115.0
uvicorn==0.32.1
pydantic==2.10.4
pydantic-settings==2.7.1
python-jose[cryptography]==3.5.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.20
email-validator==2.3.0
replit==4.1.2
```

---

## 🚀 Running the Backend

**Already Running on Port 8000!**

```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 🧪 Testing

### 1. Health Check
```bash
curl http://localhost:8000/health
# {"status":"ok","storage":"replit-db"}
```

### 2. Root Endpoint
```bash
curl http://localhost:8000/
# {"app":"Data Review Platform","docs":"/api/docs","status":"running"}
```

### 3. Interactive API Docs
Visit: http://localhost:8000/api/docs

### 4. Register & Login Flow
```bash
# Register user
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Returns: {"access_token":"...", "token_type":"bearer", "user":{...}}
```

---

## 🎯 Key Features

✅ **JWT Authentication** - Secure token-based auth  
✅ **Role-Based Access Control** - Admin/Reviewer/User roles  
✅ **Replit DB Integration** - Persistent storage with clean adapter  
✅ **Review Queue System** - Automatic assignment of work  
✅ **Payout Management** - Track earnings, request payouts  
✅ **OCR Service** - Placeholder for image/document processing  
✅ **Comprehensive API** - RESTful endpoints with OpenAPI docs  
✅ **Type Safety** - Pydantic models for validation  

---

## 🔒 Security

- Passwords hashed with bcrypt
- JWT tokens with expiration (24 hours)
- Role-based endpoint protection
- CORS configuration
- Input validation via Pydantic

---

## 📈 Scalability Features

- Async-ready architecture (services use sync for simplicity with Replit DB)
- Namespace isolation in database
- Modular service architecture
- Easy to swap DB adapter implementation
- Queue system for distributed review work

---

## 🛠️ Next Steps

1. **Frontend Integration** - Build UI for reviewers/admins
2. **OCR Integration** - Add actual OCR service (Tesseract, Google Vision, etc.)
3. **Payment Gateway** - Integrate Stripe/PayPal for payouts
4. **Monitoring** - Add logging, metrics, error tracking
5. **Testing** - Add unit tests for services
6. **Documentation** - API usage examples

---

**Scaffolding Complete! Backend is live on port 8000.** 🎉
