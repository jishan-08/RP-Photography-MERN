RP Photography

A full-stack photography portfolio and booking website built with the MERN stack. The platform provides a modern public-facing photography website along with an authenticated admin panel for managing website content, gallery images, services, and inquiries.

🌐 Project Overview

RP Photography is designed for a professional photography business to showcase its work and manage website content from an admin panel.

The application includes:

- Responsive photography portfolio website
- Dynamic hero section
- About and services sections
- Portfolio/gallery with category filtering
- Cinematic photography section
- Contact and inquiry form
- Admin authentication
- Admin dashboard
- Website content management
- Image upload functionality
- MongoDB-based content persistence
- Production deployment

✨ Key Features

Public Website

- Professional landing page
- Dynamic hero image and content
- About/story section
- Photography services
- Portfolio/gallery
- Category-based gallery filtering
- Image lightbox
- Cinematography section
- Contact section
- Inquiry form
- Instagram and contact links
- Responsive navigation

Admin Panel

- Secure admin login
- Protected admin area
- Dashboard
- Website content management
- Hero image management
- Gallery management
- Services management
- Contact information management
- Inquiry management
- Image upload functionality

🛠️ Technologies Used

Frontend

- React.js
- Vite
- JavaScript
- HTML5
- CSS3
- Lucide React

Backend

- Node.js
- Express.js
- JavaScript
- Multer
- JWT-based authentication

Database

- MongoDB
- MongoDB Atlas
- Mongoose

Development & Deployment

- Git
- GitHub
- Vercel
- Render
- npm

🏗️ Project Architecture

RP-Photography-MERN
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── assets/
│   │   ├── api.js
│   │   ├── defaultContent.js
│   │   └── ...
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── server.js
│   │   ├── config.js
│   │   └── ...
│   ├── uploads/
│   └── package.json
│
├── .gitignore
└── README.md

🔄 Application Flow

The basic communication flow of the application is:

User
  ↓
React Frontend
  ↓
HTTP / REST API
  ↓
Node.js + Express Backend
  ↓
Mongoose
  ↓
MongoDB Atlas

For example, when the public website loads its content:

Browser
  ↓
GET /api/content
  ↓
Express Backend
  ↓
MongoDB
  ↓
JSON Response
  ↓
React
  ↓
Website Content

🔐 Authentication Flow

The admin panel uses token-based authentication.

Admin
  ↓
Login Form
  ↓
POST /api/auth/login
  ↓
Backend verifies credentials
  ↓
JWT generated
  ↓
Token stored by frontend
  ↓
Protected Admin Requests
  ↓
Backend verifies JWT
  ↓
Admin access granted

Sensitive configuration values such as database credentials and JWT secrets are stored using environment variables and are not intended to be committed to the repository.

🖼️ Image Upload Flow

The admin can upload images through the admin panel.

Admin selects image
        ↓
FormData
        ↓
POST /api/admin/upload
        ↓
Express + Multer
        ↓
Server upload storage
        ↓
Image path returned
        ↓
Content saved in MongoDB
        ↓
Public website retrieves content
        ↓
Image displayed

📡 Important API Endpoints

Public APIs

Method| Endpoint| Purpose
GET| "/api/content"| Retrieve public website content
POST| "/api/inquiries"| Submit a customer inquiry

Authentication

Method| Endpoint| Purpose
POST| "/api/auth/login"| Authenticate admin

Admin APIs

Method| Endpoint| Purpose
GET| "/api/admin/content"| Retrieve admin-managed content
GET| "/api/admin/dashboard"| Retrieve dashboard information
PUT| "/api/admin/content/settings"| Update website settings
POST| "/api/admin/upload"| Upload an image

⚙️ Environment Variables

The backend requires environment variables for sensitive configuration.

Example:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000

The actual ".env" file should remain private and should not be pushed to GitHub.

An ".env.example" file can be used to document the required variable names without exposing real credentials.

🚀 Running the Project Locally

1. Clone the repository

git clone https://github.com/jishan-08/RP-Photography-MERN.git

2. Open the project

cd RP-Photography-MERN

3. Install frontend dependencies

cd client
npm install

4. Install backend dependencies

Open another terminal:

cd server
npm install

5. Configure environment variables

Create the required ".env" file inside the "server" directory and add your local configuration.

6. Start the backend

cd server
npm run dev

The backend runs on:

http://localhost:5000

7. Start the frontend

In another terminal:

cd client
npm run dev

The frontend runs on the Vite development server, normally:

http://localhost:5173

🌍 Deployment

The project uses separate deployment services for the frontend and backend.

                    RP Photography
                         │
              ┌──────────┴──────────┐
              │                     │
          Frontend               Backend
          Vercel                 Render
              │                     │
              └─────────┬───────────┘
                        │
                   MongoDB Atlas

Environment variables must be configured in the respective deployment platforms.

🧪 Testing

Important areas tested during development include:

- Public website loading
- API connectivity
- MongoDB connectivity
- Admin authentication
- Admin dashboard
- Content retrieval
- Content updates
- Image uploads
- Hero image loading
- Inquiry submission
- Production deployment
- GitHub synchronization

🐛 Debugging Experience

During development, several real-world issues were encountered and resolved, including:

- MongoDB DNS/SRV connection problems
- Environment variable configuration
- JWT secret configuration
- React component errors
- Hero image loading problems
- Git push rejection
- Git rebase conflicts
- Production/local environment differences
- API connectivity issues

These debugging experiences helped improve the reliability and deployment workflow of the application.

🔒 Security

Security practices used in the project include:

- Environment variables for sensitive configuration
- JWT-based authentication
- Protected admin functionality
- ".gitignore" for sensitive local files
- Rotation of exposed credentials when necessary

Never commit real database passwords, JWT secrets, API keys, or other private credentials to GitHub.

📚 Learning Outcomes

This project provided practical experience with:

- Full-stack web development
- React component development
- REST APIs
- Node.js and Express
- MongoDB and Mongoose
- Authentication and authorization
- File uploads
- Environment configuration
- Git and GitHub
- Debugging
- Deployment
- Frontend-backend communication

🔮 Future Improvements

Potential improvements include:

- Cloud-based image storage
- Improved image optimization
- Advanced admin analytics
- Better inquiry management
- Email notifications for new inquiries
- Role-based admin access
- Automated testing
- Improved production monitoring
- Performance optimization
- SEO improvements

👨‍💻 Developer

Jishan Shaikh

B.Tech Computer Science Engineering

This project was developed as a practical full-stack web development project with a focus on building, debugging, deploying, and maintaining a real-world application.

---

⭐ Project

If you find this project useful or interesting, consider giving the repository a star.
