# FlexSched

## Description

FlexSchedKoundy is a comprehensive flexible scheduling system designed for educational institutions. It enables faculty members, students, and administrators to efficiently manage class timetables, request class swaps, receive smart recommendations for scheduling adjustments, and handle various administrative tasks. The system supports real-time notifications via email and provides a user-friendly interface for all stakeholders.

## Features

- **User Authentication**: Secure JWT-based authentication for faculty, students, and administrators
- **Timetable Management**: Create, view, and manage class and faculty timetables
- **Class Swap Requests**: Students and faculty can request and approve class swaps
- **Smart Recommendations**: AI-powered suggestions for optimal scheduling
- **Admin Dashboard**: Comprehensive administrative controls for managing users and system settings
- **Email Notifications**: Automated email alerts for requests, approvals, and updates
- **Responsive Design**: Mobile-friendly interface built with modern web technologies

## Tech Stack

### Backend

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token for authentication
- **bcryptjs** - Password hashing
- **Nodemailer** - Email service
- **node-cron** - Task scheduling

### Frontend

- **React** - UI library
- **Vite** - Build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Icons** - Icon library

## Installation

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local installation or cloud service like MongoDB Atlas)
- npm or yarn package manager

### Backend Setup

1. Navigate to the backend directory:

   ```bash
   cd backend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the backend root directory with the following variables:

   ```
   PORT=5000
   JWT_SECRET=your_super_secret_jwt_key_here
   MONGO_URI=mongodb://localhost:27017/flexsched
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```

4. Seed the database with initial data:

   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend server will start on `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend application will be available at `http://localhost:5173`.

## Usage

1. **Admin Setup**: Use the seeded admin account to log in and manage the system
2. **Faculty Registration**: Faculty members can register and manage their timetables
3. **Student Registration**: Students can register and view their schedules
4. **Timetable Management**: Create and update class and faculty timetables
5. **Class Swaps**: Request and approve class exchanges
6. **Smart Recommendations**: Get AI-suggested scheduling optimizations

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Timetable Endpoints

- `GET /api/timetable` - Get timetables
- `POST /api/timetable` - Create timetable
- `PUT /api/timetable/:id` - Update timetable

### Class Swap Endpoints

- `GET /api/class-swap` - Get swap requests
- `POST /api/class-swap` - Create swap request
- `PUT /api/class-swap/:id/approve` - Approve swap request

### Admin Endpoints

- `GET /api/admin/users` - Get all users
- `POST /api/admin/faculty` - Add faculty
- `POST /api/admin/student` - Add student

For complete API documentation, refer to the Postman collection or Swagger documentation.

## Project Structure

```
FlexSchedKoundy/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── server.js
│   ├── scripts/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   └── App.jsx
│   ├── public/
│   └── package.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
