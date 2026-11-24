# College Management System (MySQL Edition)

## Stack
- Frontend: React 19 + TypeScript + Vite
- Backend: Node.js + Express
- Database: MySQL 8+

## 1. Requirements
Install Node.js LTS, MySQL Server 8+, and (optionally) MySQL Workbench. Start the MySQL service.

## 2. Create the database
In MySQL Workbench, connect to your local MySQL server and execute:
```sql
CREATE DATABASE college_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
The backend creates the required tables automatically on first start.

## 3. Configure backend
Open a terminal in this project folder:
```powershell
cd backend
npm install
Copy-Item .env.example .env
```
Open `backend/.env` and set `DB_PASSWORD` to your MySQL root password. If your MySQL username/password differs, update `DB_USER` and `DB_PASSWORD`. Set a long random `JWT_SECRET`.

Example:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD
DB_NAME=college_management
JWT_SECRET=change_this_to_a_long_random_secret
```
Do not put the `.env` file in frontend or share it publicly.

## 4. Create the first admin
From the `backend` folder:
```powershell
npm run seed
```
Default login (unless you set `ADMIN_USERNAME` / `ADMIN_PASSWORD` before running the seed):
- Username: `admin`
- Password: `Admin@123`

Change this password after first login. The seed command will not overwrite an existing admin.

## 5. Start backend
In the same `backend` terminal:
```powershell
npm run dev
```
Check `http://localhost:5000/api/health`. It should return `{"status":"ok","database":"MySQL"}`.

## 6. Start frontend
Open a second terminal at the project root (the folder containing `frontend` and `backend`):
```powershell
cd frontend
npm install
npm run dev
```
Open the Vite URL shown in terminal, usually `http://localhost:5173`.

## 7. Login and use
Login with the admin credentials above. Register Teacher/Student accounts using the app's registration screen; their profile rows are created automatically. Admin can manage courses and view teacher/student data. Teachers can access attendance and course/student lists.

## Troubleshooting
- `ECONNREFUSED 127.0.0.1:3306`: MySQL service is stopped or port is different.
- `Access denied for user`: wrong MySQL username/password in `backend/.env`.
- `Unknown database 'college_management'`: run the CREATE DATABASE SQL above.
- `EADDRINUSE: 5000`: another process uses port 5000; change `PORT` in backend `.env`.
- If frontend dependencies fail, use Node.js LTS and run `npm install` inside `frontend`.

## Notes
This package replaces the original MongoDB/Mongoose backend with MySQL (`mysql2`). The UI is retained. Student/Teacher creation currently happens through registration; the existing dedicated POST endpoints intentionally return 501 because the original project did not implement those workflows.
