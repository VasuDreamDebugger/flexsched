Inventory Management System
Overview

A full-stack Inventory Management application built with React (Vite) and Node.js + Express. It supports product management, authentication, inventory tracking, and CSV import/export.

Features
User authentication (JWT-based login/register)
Product CRUD with pagination, search, and filters
Inline product editing
Inventory history tracking
CSV import/export
Product statistics
Frontend
Tech Stack
Vite + React
React Router
Axios
Jest + React Testing Library
CSS
Functionality
Product listing with pagination and sorting
Search and category filters
Inline editing
Inventory history sidebar
Token stored in localStorage
Structure
src/
  components/
  api/
  hooks/
  styles/
  main.jsx
Routes
/login → Login page
/ → Products dashboard
Backend
Tech Stack
Node.js + Express
SQLite
JWT Authentication
express-validator
multer, csv-parser
Jest
Functionality
User authentication
Product CRUD
Inventory history tracking
CSV import/export
Pagination, filtering, sorting
Structure
src/
  server.js
  config/
  controllers/
  routes/
  middleware/
  models/
uploads/
tests/
Database Schema
Users
id, name, email, password_hash
Products
id, name, unit, category, brand, stock, status, image
Inventory History
id, product_id, old_quantity, new_quantity, change_date, user_info
API Endpoints

Base URL: http://localhost:5000/api

Auth
POST /auth/register
POST /auth/login
Products
GET /products
POST /products
PUT /products/:id
DELETE /products/:id
GET /products/:id/history
GET /products/categories
POST /products/import
GET /products/export
GET /products/statistics
Setup
Backend
cd backend
npm install

Create .env:

PORT=5000
JWT_SECRET=your_secret
DB_FILE=./inventory.db

Run:

npm run dev
# or
npm start
Testing
cd backend
npm test
Future Improvements
PostgreSQL integration
Role-based access control
More test coverage
Refresh tokens
