# EduConnect

EduConnect is a comprehensive, full-stack educational platform built with the MERN stack (MongoDB, Express.js, React, Node.js). It aims to streamline school management and enhance the student learning experience with advanced features ranging from real-time bus tracking to an AI-powered Socratic study tutor.

## Features

- 🚌 **Real-Time Bus Tracking**: Live tracking of school buses using GPS integration, WebSockets (`socket.io`), and interactive maps (`Leaflet`). Includes a dedicated Driver Panel.
- 🤖 **AI Socratic Tutor**: An intelligent study assistant powered by Google's Generative AI. It can extract text from study materials (PDFs/DOCX) and guide students through concepts using a Socratic teaching approach.
- 📚 **Classroom Management**: Robust educational dashboards for students and admins. Centralized workflows for course management and file-upload-capable assignment submissions.
- 💳 **Payments & Booking**: Integrated with Stripe for secure handling of fee payments and bookings.
- 🔐 **Secure Authentication**: Role-based access control with secure JWT authentication and password hashing.
- 📊 **Interactive Dashboards**: Data visualization utilizing `recharts` for tracking student progress and school metrics.
- 🔔 **Automated Notifications**: Scheduled tasks and automated email alerts using `node-cron` and `nodemailer`.

## Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **Routing**: React Router DOM
- **Maps**: React Leaflet
- **Data Visualization**: Recharts
- **API & Real-time**: Axios, Socket.io-client
- **Payments**: Stripe React JS

### Backend
- **Environment**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB & Mongoose
- **AI Integration**: `@google/generative-ai` (Gemini)
- **File Parsing**: `pdf2json` (PDFs), `mammoth` (DOCX), `multer` (Uploads)
- **Real-time**: Socket.io
- **Payments**: Stripe Node.js
- **Authentication**: JWT, bcryptjs

## Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)

## Getting Started

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd EduConnect-
   ```

2. **Install dependencies:**
   The root `package.json` includes scripts to install dependencies for both the frontend and backend.
   ```bash
   npm install
   ```

3. **Environment Variables:**
   You will need to set up `.env` files in both the `backend` and `frontend` directories. 
   
   *Example Backend `.env` variables:*
   - `PORT`: Server port (e.g., 5000)
   - `MONGO_URI`: MongoDB connection string
   - `JWT_SECRET`: Secret key for JWT
   - `GEMINI_API_KEY`: Google Generative AI API key
   - `STRIPE_SECRET_KEY`: Stripe secret key

   *Example Frontend `.env` variables:*
   - `VITE_API_BASE_URL`: Backend URL (e.g., `http://localhost:5000`)
   - `VITE_STRIPE_PUBLIC_KEY`: Stripe public key

4. **Run the Application:**
   You can start both the backend and frontend development servers concurrently from the root directory:
   ```bash
   npm run dev
   ```

## Project Structure

```
EduConnect-/
├── backend/               # Node.js/Express server and API
│   ├── models/            # Mongoose schemas (User, Notification, BusRoute, Settings, etc.)
│   ├── controllers/       # Route logic
│   ├── routes/            # Express routes
│   └── index.js           # Server entry point
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components (e.g., SocraticTutor.jsx)
│   │   ├── pages/         # Page layouts (e.g., Login.jsx, Dashboard)
│   │   └── App.jsx        # Main React component
│   └── package.json
└── package.json           # Root package.json for concurrent scripts
```

## Contributing

Contributions are welcome! Please follow the standard pull request process.

## License

This project is licensed under the ISC License.
