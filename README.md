# Helpdesk Application

This is a full-stack Helpdesk ticketing system built with React, Vite, Tailwind CSS, Node.js, Express, and a SQLite database.

## Prerequisites

To run this application on your laptop, you will need:
- [Node.js](https://nodejs.org/) (Version 18 or higher recommended)
- npm (comes installed with Node.js)

## Getting Started

1. **Extract the Code**
   If you downloaded this as a ZIP, extract it to a folder on your computer. If you exported it to GitHub, clone the repository to your local machine:
   ```bash
   git clone <your-repo-url>
   cd <your-folder>
   ```

2. **Install Dependencies**
   Open your terminal/command prompt in the project folder and run:
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   Currently, the application relies on an local SQLite database (`helpdesk.db`), so no external database configuration is strictly necessary to start testing.
   However, if there is an `.env.example` file, you can copy it to a new file named `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Run the Development Server**
   To start the app locally with hot-reloading:
   ```bash
   npm run dev
   ```
   The application and backend API will start on `http://localhost:3000`.

## Building for Production

To create a production build of your application:
```bash
npm run build
```

This will bundle the React frontend into static files in the `dist` folder and compile the Express server into `dist/server.cjs`.

To run the production build:
```bash
npm start
```
Your app will be served via the production Express server at `http://localhost:3000`.

## Deployment

Since this is a full-stack application (frontend + backend Express server + SQLite), the easiest way to deploy is:
1. **Google Cloud Run** (directly out of AI Studio).
2. Platforms like **Render**, **Railway**, or **Fly.io** that support full containerized Node environments with persistent disk storage (required for SQLite to persist data between deployments).
