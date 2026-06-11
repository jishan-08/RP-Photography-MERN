# RP Photography MERN

A full-stack photography portfolio and CMS converted from the supplied
`index.html` and `admin.html`, with selected sections inspired by the original
RP Photography website.

## Project layout

- `client/` - React + Vite public website and admin dashboard
- `server/` - Node.js + Express API, MongoDB models, JWT auth, uploads

## Quick start

1. Install Node.js 18+ and MongoDB.
2. Copy `server/.env.example` to `server/.env`.
3. Start MongoDB locally, or set `MONGO_URI` to MongoDB Atlas.
4. Run:

```bash
npm install
npm run install:all
npm run seed
npm run dev
```

Open `http://localhost:5173`. Admin is at `http://localhost:5173/admin`.

Default admin:

- Username: `admin`
- Password: `admin123`

Change the password and JWT secret before deployment.

## Production

```bash
npm run build
npm start
```

The Express server serves `client/dist` when it exists.

## Main features

- Responsive one-page photography portfolio
- Hero slider, services, recent work, full filtered gallery and lightbox
- About/story, cinematic film, pricing, testimonials, events and FAQs
- Inquiry form saved to MongoDB
- JWT-protected admin dashboard
- CRUD management for content collections
- Inquiry and booking management
- Image uploads to `server/uploads`
- Homepage/contact/SEO settings
