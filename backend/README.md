# School Management System - Backend API

## Structure
```
backend/
├── src/
│   ├── index.js          # Entry point
│   ├── controllers/      # Request handlers
│   ├── routes/           # Route definitions
│   ├── models/           # Database models
│   ├── middleware/       # Custom middleware
│   ├── config/           # Configuration files
│   └── utils/            # Utility functions
├── package.json
└── .env
```

## Setup
```bash
cd backend
npm install
npm run dev
```

## API Endpoints
- `GET /api/health` - Health check
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student