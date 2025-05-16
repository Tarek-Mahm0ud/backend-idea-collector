# Ideas Collector - Backend

## Project Overview
Backend server for the Ideas Collector application, built with Node.js and Express.js. This server handles authentication, data persistence, and provides RESTful APIs for the frontend application.

## Technology Stack
- Node.js (>=14.0.0)
- Express.js (v4.21.2)
- MongoDB with Mongoose
- Key Dependencies:
  - bcryptjs for password hashing
  - jsonwebtoken for authentication
  - express-validator for input validation
  - cors for cross-origin resource sharing
  - express-rate-limit for API rate limiting

## Features

### Authentication
- User registration and login
- JWT-based authentication
- Rate limiting for auth endpoints (5 requests per 15 minutes)
- Password hashing with bcrypt

### API Endpoints
1. Authentication Routes (`/api/auth`)
   - User registration
   - User login
   - Password reset

2. Ideas Routes (`/api/ideas`)
   - CRUD operations for ideas
   - Rate limited to 100 requests per minute

3. Admin Routes (`/api/admin`)
   - Protected routes requiring authentication
   - Administrative functions

### Security Features
- Rate limiting on sensitive endpoints
- CORS protection
- Input validation
- Error handling middleware
- Secure password storage
- JWT-based authentication

## Development Setup

### Prerequisites
- Node.js (>=14.0.0)
- MongoDB
- npm or yarn package manager

### Setup Instructions
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file with required environment variables
3. Start the development server:
   ```bash
   npm run dev
   ```

## Testing
```bash
npm test
```

Backend tests use:
- Jest as the testing framework
- Supertest for API testing
- MongoDB Memory Server for database testing

## Environment Variables
Create a `.env` file with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
NODE_ENV=development
```

## API Rate Limiting
- Authentication endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per minute

## Error Handling
The application includes comprehensive error handling:
- Custom error middleware
- 404 route handler
- Development mode stack traces
- Production-safe error responses

## Database Models

### User Model
```javascript
{
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    match: [email regex]
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  refreshToken: {
    type: String,
    select: false
  },
  createdAt: Date
}
```

### Idea Model
```javascript
{
  username: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    match: [email regex]
  },
  description: {
    type: String,
    required: true
  },
  timestamps: true
}
```

## API Endpoints Documentation

### Authentication Routes (`/api/auth`)
1. **Register User** (`POST /api/auth/register`)
   - Request Body:
     ```json
     {
       "username": "string",
       "email": "string",
       "password": "string"
     }
     ```
   - Response: JWT token and user data

2. **Login** (`POST /api/auth/login`)
   - Request Body:
     ```json
     {
       "email": "string",
       "password": "string"
     }
     ```
   - Response: JWT token and user data

3. **Password Reset** (`POST /api/auth/reset-password`)
   - Request Body:
     ```json
     {
       "email": "string"
     }
     ```
   - Response: Success message

### Ideas Routes (`/api/ideas`)
1. **Create Idea** (`POST /api/ideas`)
   - Protected Route
   - Request Body:
     ```json
     {
       "description": "string"
     }
     ```
   - Response: Created idea object

2. **Get User Ideas** (`GET /api/ideas/user`)
   - Protected Route
   - Response: Array of user's ideas

3. **Get All Ideas** (`GET /api/ideas`)
   - Protected Route
   - Query Parameters:
     - `page`: Page number
     - `limit`: Items per page
   - Response: Paginated array of ideas

4. **Update Idea** (`PUT /api/ideas/:id`)
   - Protected Route
   - Request Body:
     ```json
     {
       "description": "string"
     }
     ```
   - Response: Updated idea object

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License
This project is licensed under the MIT License. 