# E-Land Records - Client Application

A modern Next.js application for managing land records with dual authentication system for regular users and government officials.

## Features

- **Dual Authentication**: Separate login/registration for users and officials
- **User Registration**: Complete user profile management with personal and contact information
- **Official Registration**: Role-based registration with designations including:
  - Ministry of Welfare
  - District Collector
  - Joint Collector
  - Revenue Department Officer
  - Project Officer
  - MRO (Mandal Revenue Officer)
  - Surveyor
  - Revenue Inspector
  - VRO (Village Revenue Officer)
  - Superintendent
  - Clerk
- **MongoDB Integration**: Persistent data storage with Mongoose
- **Password Security**: Bcrypt hashing for secure password storage
- **Form Validation**: Client and server-side validation
- **Responsive UI**: Tailwind CSS styling

## Prerequisites

- Node.js 18+ 
- npm or yarn
- MongoDB (local or Atlas)

## Installation

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` file with MongoDB URI:

```
MONGODB_URI=mongodb://localhost:27017/eland-records
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For MongoDB Atlas, use:
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/eland-records
```

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                          # Home page with login options
│   ├── userlogin/                        # User login page
│   ├── userregistration/                 # User registration page
│   ├── officiallogin/                    # Official login page
│   ├── officialregistration/             # Official registration page
│   ├── api/
│   │   ├── users/
│   │   │   └── register/                 # User registration API
│   │   └── officials/
│   │       └── register/                 # Official registration API
│   ├── layout.tsx                        # Root layout
│   └── globals.css                       # Global styles
├── lib/
│   ├── models/
│   │   ├── User.ts                       # User schema
│   │   └── Official.ts                   # Official schema
│   └── db/
│       ├── connect.ts                    # MongoDB connection
│       └── types.ts                      # TypeScript type definitions
└── public/                               # Static assets
```

## API Routes

### User Registration
**POST** `/api/users/register`

Request body:
```json
{
  "firstName": "string",
  "middleName": "string (optional)",
  "lastName": "string",
  "dateOfBirth": "YYYY-MM-DD",
  "gender": "Male|Female|Other",
  "phone": "10-digit number",
  "email": "valid email",
  "aadhar": "12-digit number",
  "address": "string",
  "username": "string",
  "password": "minimum 6 characters"
}
```

### Official Registration
**POST** `/api/officials/register`

Request body:
```json
{
  "firstName": "string",
  "lastName": "string",
  "designation": "designation key",
  "department": "string",
  "email": "valid email",
  "phone": "10-digit number",
  "officeId": "string",
  "username": "string",
  "password": "minimum 6 characters"
}
```

## Validation Rules

### User Registration
- First Name: Required, max 255 characters
- Last Name: Required, max 255 characters
- Date of Birth: Required
- Gender: Required (Male, Female, Other)
- Phone: Required, exactly 10 digits
- Email: Required, valid email format, unique
- Aadhar: Required, exactly 12 digits, unique
- Address: Required
- Username: Required, unique
- Password: Required, minimum 6 characters

### Official Registration
- First Name: Required, max 255 characters
- Last Name: Required, max 255 characters
- Designation: Required, must be from predefined list
- Department: Required, max 255 characters
- Email: Required, valid email format, unique
- Phone: Required, exactly 10 digits
- Office ID: Required, unique
- Username: Required, unique
- Password: Required, minimum 6 characters

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Bcryptjs for password hashing
- **API**: Next.js API Routes (App Router)

## Development

### Run development server:
```bash
npm run dev
```

### Build for production:
```bash
npm run build
```

### Run production build:
```bash
npm start
```

### Run linting:
```bash
npm run lint
```

## Database Models

### User Model
- firstName: String
- middleName: String (optional)
- lastName: String
- dateOfBirth: Date
- gender: String (enum: Male, Female, Other)
- phone: String (10 digits)
- email: String (unique)
- aadhar: String (12 digits, unique)
- address: String
- username: String (unique)
- password: String (hashed)
- timestamps: Created and updated dates

### Official Model
- firstName: String
- lastName: String
- designation: String (enum from DESIGNATIONS)
- department: String
- email: String (unique)
- phone: String (10 digits)
- officeId: String (unique)
- username: String (unique)
- password: String (hashed)
- timestamps: Created and updated dates

## Security Features

- Password hashing with bcryptjs (10 salt rounds)
- Input validation on both client and server
- Email and unique field duplicate checks
- Environment-based configuration
- HTTP-only API endpoints

## Environment Variables

Create `.env.local` file:

```
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/eland-records

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Future Enhancements

- User login and session management
- Official login and role-based access control
- Email verification for registration
- Two-factor authentication (2FA)
- Password reset functionality
- User profile management
- Land record management dashboard
- Document upload and storage
- Search and filtering capabilities

## License

This project is part of the E-Land Records system.
