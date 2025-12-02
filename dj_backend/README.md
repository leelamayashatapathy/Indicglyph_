# IndicGlyph Django Backend

Django REST Framework backend for IndicGlyph Data Studio.

## Features

- Custom User Model with roles and payout tracking
- JWT Authentication using djangorestframework-simplejwt
- PostgreSQL database
- Class-based API views (GenericAPIView for GET, APIView for POST/PUT/PATCH)
- RESTful API endpoints

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Virtual environment (recommended)

### Installation

1. **Create and activate virtual environment:**
```bash
python -m venv env
# Windows
.\env\Scripts\Activate.ps1
# Linux/Mac
source env/bin/activate
```

2. **Install dependencies:**
```bash
pip install -r requirements.txt
```

3. **Set up environment variables:**
Create a `.env` file in `dj_backend/` directory:
```
SECRET_KEY=your-secret-key-here
DEBUG=True
POSTGRES_DB=datasetforge
POSTGRES_USER=datasetforge
POSTGRES_PASSWORD=datasetforge
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
ACCESS_TOKEN_EXPIRE_MINUTES=120
```

4. **Run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

5. **Create superuser:**
```bash
python manage.py createsuperuser
```

6. **Run development server:**
```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication (`/api/auth/`)
- `POST /api/auth/register/` - Register new user
- `POST /api/auth/login/` - Login and get JWT token
- `POST /api/auth/logout/` - Logout
- `GET /api/auth/me/` - Get current user profile
- `POST /api/auth/change-password/` - Change password
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Datasets (`/api/datasets/`)
- `GET /api/datasets/types/` - List all dataset types
- `POST /api/datasets/types/` - Create dataset type
- `GET /api/datasets/types/<id>/` - Get dataset type
- `PUT /api/datasets/types/<id>/` - Update dataset type
- `DELETE /api/datasets/types/<id>/` - Delete dataset type
- `GET /api/datasets/items/` - List dataset items
- `POST /api/datasets/items/` - Create dataset item
- `GET /api/datasets/items/<id>/` - Get dataset item
- `PUT /api/datasets/items/<id>/` - Update dataset item
- `DELETE /api/datasets/items/<id>/` - Delete dataset item
- `POST /api/datasets/next/` - Get next item for review

## Docker Setup

Use the provided `docker-compose.yml` in the root directory:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database
- Django backend
- Frontend (React)
- MinIO (optional)

## Project Structure

```
dj_backend/
├── indic_backend/      # Django project settings
├── users/              # User authentication app
├── datasets/           # Dataset types and items app
├── reviews/            # Review functionality app
├── admin_console/       # Admin/operator console app
├── manage.py
└── requirements.txt
```

## Custom User Model

The custom user model includes:
- `username` - Unique username
- `email` - Unique email
- `roles` - JSON array of user roles (user, reviewer, platform_operator, super_operator)
- `languages` - JSON array of languages user can review
- `payout_balance` - Decimal field for payout tracking
- `reviews_done` - Integer count of reviews completed

## JWT Authentication

JWT tokens are used for authentication. Include the token in requests:

```
Authorization: Bearer <access_token>
```

Tokens expire after 120 minutes by default (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`).

## Database Models

### User
- Custom user model with roles and payout tracking

### DatasetType
- Defines schema for datasets
- Fields: name, description, modality, fields (JSON), languages, payout_rate, etc.

### DatasetItem
- Individual items for review
- Fields: dataset_type, language, content (JSON), review_status, etc.

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### Accessing Admin Panel
Visit `http://localhost:8000/admin/` and login with superuser credentials.

## Notes

- The backend uses PostgreSQL with JSONB support for flexible schemas
- All API endpoints require authentication except registration and login
- CORS is configured to allow frontend origins
- Class-based views are used: GenericAPIView for GET operations, APIView for POST/PUT/PATCH

