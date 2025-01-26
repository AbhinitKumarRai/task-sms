# School Management API

A RESTful API for managing schools, classrooms, and students with role-based access control.

## Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd school-api
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Create a `.env` file in the root directory:

```env
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/school-api
LONG_TOKEN_SECRET=your-long-token-secret
SHORT_TOKEN_SECRET=your-short-token-secret
```

4. Start required services:

```bash
# Start MongoDB and Redis
./scripts/start-services.sh
```

5. Create super admin user:

```bash
# This will create a super admin with default credentials
./scripts/create-super-admin.sh

# Default credentials:
# Email: super@admin.com
# Password: SuperAdmin@123
```

6. Start the server:

```bash
npm run dev
# or
yarn dev
```

The API will be available at `http://localhost:5111/api`

## Database Schema

### User Schema

```javascript
{
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['super-admin', 'admin'],
    required: true
  },
  schoolId: {
    type: ObjectId,
    ref: 'School',
    required: function() { return this.role === 'admin' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### School Schema

```javascript
{
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Classroom Schema

```javascript
{
  name: {
    type: String,
    required: true
  },
  schoolId: {
    type: ObjectId,
    ref: 'School',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

### Student Schema

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 3,
    max: 100
  },
  classroomId: {
    type: ObjectId,
    ref: 'Classroom',
    required: true,
    alias: 'classroomID'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}
```

## Utility Scripts

### start-services.sh

This script handles the startup of required services:

- Starts MongoDB service if not running
- Starts Redis service if not running
- Checks service health
- Creates required directories if missing

```bash
./scripts/start-services.sh
```

### create-super-admin.sh

This script creates the default super admin user:

- Creates user with default credentials
- Sets up proper role and permissions
- Handles duplicate user checks

```bash
./scripts/create-super-admin.sh

# Default credentials:
Email: super@admin.com
Password: SuperAdmin@123
```

## API Endpoints

### Authentication

All endpoints except login require a valid JWT token in the `token` header.

### Users

#### Login

- **POST** `/api/user/login`
- **Scope**: Public
- **Request Body**:

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

- **Response**:

```json
{
  "ok": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "admin",
      "school": "school_id"
    },
    "token": "jwt_token"
  }
}
```

#### Create User

- **POST** `/api/user/createUser`
- **Scope**: SUPER_ADMIN
- **Request Body**:

```json
{
  "email": "admin@school.com",
  "password": "password123",
  "role": "admin",
  "schoolID": "school_id"
}
```

- **Response**:

```json
{
  "ok": true,
  "data": {
    "user": {
      "_id": "user_id",
      "email": "admin@school.com",
      "role": "admin",
      "school": "school_id"
    },
    "token": "jwt_token"
  }
}
```

### Schools

#### Create School

- **POST** `/api/school/create`
- **Scope**: SUPER_ADMIN
- **Request Body**:

```json
{
  "name": "School Name",
  "address": "School Address"
}
```

- **Response**:

```json
{
  "ok": true,
  "data": {
    "_id": "school_id",
    "name": "School Name",
    "address": "School Address"
  }
}
```

#### Get All Schools

- **GET** `/api/school/getAll`
- **Scope**: SUPER_ADMIN, ADMIN
- **Response**:

```json
{
  "ok": true,
  "data": [
    {
      "_id": "school_id",
      "name": "School Name",
      "address": "School Address"
    }
  ]
}
```

### Classrooms

#### Create Classroom

- **POST** `/api/classroom/create`
- **Scope**: ADMIN (own school only), SUPER_ADMIN
- **Request Body**:

```json
{
  "name": "Class 5A",
  "schoolID": "school_id"
}
```

- **Response**:

```json
{
  "ok": true,
  "data": {
    "_id": "classroom_id",
    "name": "Class 5A",
    "schoolId": "school_id"
  }
}
```

#### Get All Classrooms

- **GET** `/api/classroom/getAll`
- **Scope**: ADMIN (own school only), SUPER_ADMIN
- **Response**:

```json
{
  "ok": true,
  "data": [
    {
      "_id": "classroom_id",
      "name": "Class 5A",
      "schoolId": {
        "_id": "school_id",
        "name": "School Name"
      }
    }
  ]
}
```

#### Get Classroom by ID

- **GET** `/api/classroom/getByID/:id`
- **Scope**: ADMIN (own school only), SUPER_ADMIN
- **Response**:

```json
{
  "ok": true,
  "data": {
    "_id": "classroom_id",
    "name": "Class 5A",
    "schoolId": "school_id"
  }
}
```

### Students

#### Create Student

- **POST** `/api/student/create`
- **Scope**: ADMIN (own school only), SUPER_ADMIN
- **Request Body**:

```json
{
  "name": "John Doe",
  "age": 10,
  "classroomID": "classroom_id"
}
```

- **Response**:

```json
{
  "ok": true,
  "data": {
    "_id": "student_id",
    "name": "John Doe",
    "age": 10,
    "classroomId": "classroom_id"
  }
}
```

#### Get All Students

- **GET** `/api/student/getAll`
- **Query Params**: `classroomID` (optional)
- **Scope**: ADMIN (own school only), SUPER_ADMIN
- **Response**:

```json
{
  "ok": true,
  "data": [
    {
      "_id": "student_id",
      "name": "John Doe",
      "age": 10,
      "classroomId": {
        "_id": "classroom_id",
        "name": "Class 5A",
        "schoolId": {
          "_id": "school_id",
          "name": "School Name"
        }
      }
    }
  ]
}
```

#### Get Student by ID

- **GET** `/api/student/getByID/:id`
- **Scope**: ADMIN (own school only), SUPER_ADMIN
- **Response**:

```json
{
  "ok": true,
  "data": {
    "_id": "student_id",
    "name": "John Doe",
    "age": 10,
    "classroomId": "classroom_id"
  }
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
    "ok": false,
    "code": 400-500,
    "errors": ["Error message"],
    "message": "Error description"
}
```

Common error codes:

- 400: Bad Request (validation error)
- 401: Unauthorized (invalid/missing token)
- 403: Forbidden (insufficient permissions)
- 404: Not Found
- 409: Conflict (duplicate entry)
- 500: Internal Server Error

## Roles and Permissions

- **SUPER_ADMIN**: Full access to all endpoints and data
- **ADMIN**: Access limited to own school's data
  - Can create/view classrooms in own school
  - Can create/view students in own school's classrooms
  - Can view own school details

## Environment Variables

- `NODE_ENV`: Application environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `LONG_TOKEN_SECRET`: JWT secret for long-lived tokens
- `SHORT_TOKEN_SECRET`: JWT secret for short-lived tokens
