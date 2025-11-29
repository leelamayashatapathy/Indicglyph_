# API Documentation

## Base URL
`/api/v1`

## Authentication

### Register
`POST /auth/register`

**Body:**
```json
{
  "username": "string",
  "email": "user@example.com",
  "password": "string (min 6 chars)"
}
```

**Response:** `201 Created`
```json
{
  "user_id": "string",
  "username": "string",
  "email": "user@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2025-10-23T13:04:21.515Z"
}
```

### Login
`POST /auth/login`

**Authorization:** Basic Auth (username:password)

**Response:** `200 OK`
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

### Get Current User
`GET /auth/me`

**Authorization:** Bearer token

**Response:** `200 OK`
```json
{
  "user_id": "string",
  "username": "string",
  "email": "user@example.com",
  "role": "user",
  "is_active": true,
  "created_at": "2025-10-23T13:04:21.515Z"
}
```

## Items

### List Items (Public)
`GET /items`

**Response:** `200 OK`
```json
[
  {
    "item_id": "string",
    "name": "string",
    "description": "string",
    "price": 99.99,
    "available": true,
    "created_at": "2025-10-23T13:04:21.515Z",
    "created_by": "username"
  }
]
```

### Get Item (Public)
`GET /items/{item_id}`

**Response:** `200 OK`

### Create Item (Authenticated)
`POST /items`

**Authorization:** Bearer token

**Body:**
```json
{
  "name": "string",
  "description": "string (optional)",
  "price": 99.99
}
```

**Response:** `201 Created`

### Update Item (Authenticated)
`PUT /items/{item_id}`

**Authorization:** Bearer token

**Body:**
```json
{
  "name": "string (optional)",
  "description": "string (optional)",
  "price": 99.99 (optional),
  "available": true (optional)
}
```

**Response:** `200 OK`

### Delete Item (Admin Only)
`DELETE /items/{item_id}`

**Authorization:** Bearer token (admin role required)

**Response:** `204 No Content`

## User Roles

- **guest**: No authentication required
- **user**: Can create and update items
- **admin**: Can delete items and manage all resources

## Error Responses

All errors return appropriate HTTP status codes with:
```json
{
  "detail": "Error message"
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
