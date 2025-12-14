# The Insighbit - Backend

This document provides details for the backend services of The Insighbit blogging platform.

## Purpose

The backend is a Node.js and Express.js application that provides a RESTful API for the frontend. It handles all business logic, including user authentication, data persistence, and file storage integration.

## Features

- **User Authentication**:
  - Secure user registration and login with password encryption (bcrypt).
  - Social login with Google OAuth 2.0 via Passport.js.
  - JWT-based authentication for protecting API routes.
  - Password recovery functionality using Nodemailer.

- **Post Management**:
  - Full CRUD (Create, Read, Update, Delete) operations for posts.
  - Image uploads handled by Multer and hosted on Cloudinary.

- **Engagement**:
  - API endpoints for creating and managing comments on posts.

- **Technology Stack**:
  - **Framework**: Express.js
  - **Database**: MongoDB with Mongoose ODM
  - **Authentication**: JSON Web Tokens (JWT), Passport.js
  - **File Handling**: Multer and Cloudinary
  - **Email**: Nodemailer

## How to Use

### Prerequisites

- Node.js (v18 or later recommended)
- MongoDB (a local installation or a cloud service like MongoDB Atlas)

### Backend Setup

1.  From the project's `backend` directory, install the dependencies:
    ```bash
    npm install
    ```
2.  Create a `.env` file in the `backend` directory and add the following environment variables. Replace the placeholder values with your actual credentials.
    ```env
    PORT=8000
    MONGODB_URI=your_mongodb_connection_string
    CORS_ORIGIN=http://localhost:5173
    ACCESS_TOKEN_SECRET=your_access_token_secret
    REFRESH_TOKEN_SECRET=your_refresh_token_secret

    # Google OAuth Credentials
    GOOGLE_CLIENT_ID=your_google_client_id
    GOOGLE_CLIENT_SECRET=your_google_client_secret
    GOOGLE_CALLBACK_URL=http://localhost:8000/api/v1/auth/google/callback

    # Cloudinary Credentials
    CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_API_SECRET=your_cloudinary_api_secret

    # Nodemailer Credentials (e.g., for Gmail)
    EMAIL_USER=your_email@gmail.com
    EMAIL_PASS=your_email_app_password
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```
    The backend API will be running at `http://localhost:8000`.

## Pending Tasks
