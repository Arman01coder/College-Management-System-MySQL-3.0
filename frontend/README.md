# College Management System - Full Stack

This project is a complete College Management System built with a React frontend and a Node.js/Express/MongoDB backend.

## Project Structure

For this project to work, you need to create two main folders: `frontend` and `backend`.

```
college-management-system/
├── backend/
│   ├── (all files starting with backend_*)
│   └── ...
└── frontend/
    ├── (all other files: index.html, App.tsx, etc.)
    └── ...
```

1.  **Create a `frontend` folder** and move all the existing project files (`index.html`, `App.tsx`, `pages/`, `components/`, etc.) into it.
2.  **Create a `backend` folder** and place all the new files that start with `backend_` into it. **Remember to remove the `backend_` prefix from their filenames.** For example, `backend_server.js` becomes `server.js` inside the `backend` folder.

---

## Backend Setup (Node.js + Express + MongoDB)

### Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [MongoDB](https://www.mongodb.com/try/download/community). You can install it locally or use a free cloud service like [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### 1. Navigate to the Backend Folder

```bash
cd backend
```

### 2. Install Dependencies

Run the following command to install all the necessary server dependencies from `package.json`:

```bash
npm install
```

### 3. Create Environment Variables

Create a file named `.env` in the root of your `backend` folder. This file will store your sensitive configuration details. Add the following content:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
PORT=5000
```

-   **`MONGO_URI`**: Replace `your_mongodb_connection_string` with the connection string for your local or cloud MongoDB instance.
    -   Example for local MongoDB: `mongodb://localhost:27017/collegeDB`
-   **`JWT_SECRET`**: Replace `your_super_secret_jwt_key` with a long, random, and secret string. This is used to sign authentication tokens.
-   **`PORT`**: The port on which the backend server will run. The frontend is configured to connect to port 5000.

### 4. Run the Backend Server

You can start the server in two ways:

-   **Production mode:**
    ```bash
    npm start
    ```
-   **Development mode (with automatic restart on file changes):**
    ```bash
    npm run dev
    ```

The backend API will now be running at `http://localhost:5000`.

---

## Frontend Setup (React)

The frontend is designed to run in a simple static server environment. You just need to serve the `index.html` file.

### Running the Frontend

You can use any simple HTTP server. If you have Node.js installed, you can use the `serve` package:

1.  **Install `serve` globally (if you haven't already):**
    ```bash
    npm install -g serve
    ```

2.  **Navigate to the `frontend` folder:**
    ```bash
    cd frontend
    ```

3.  **Serve the application:**
    ```bash
    serve -s .
    ```

Now you can access the College Management App in your browser, typically at `http://localhost:3000`. The frontend will automatically connect to the backend running on port 5000.
