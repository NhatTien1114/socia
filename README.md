# Socia

Socia is a full-stack social platform foundation for connecting people through accounts, conversations, and messages. It combines a React single-page application with a Spring Boot REST API secured with JWTs.

## Highlights

- Responsive login and registration experience with Tailwind CSS and the Lexend typeface
- JWT-based authentication with login, registration, and token introspection endpoints
- User and conversation management REST APIs
- MySQL persistence through Spring Data JPA
- Type-safe React frontend built with TypeScript and Vite
- Local development proxy between Vite and the Spring Boot API

## Tech Stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8, Tailwind CSS 4, ESLint |
| Backend | Java 21, Spring Boot 4, Spring MVC, Spring Security, Spring Data JPA |
| Data | MySQL 8+ |
| Authentication | JWT (HS512), BCrypt |
| Developer tooling | Maven Wrapper, npm, Vite |

## Prerequisites

- Java 21
- Node.js 20 or later
- npm 10 or later
- MySQL 8 or later

## Getting Started

### 1. Create the database

Create a local MySQL database:

```sql
CREATE DATABASE socia CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure and run the backend

The default backend configuration is in `backend/src/main/resources/application.yaml`. For local development, set database credentials and a strong JWT secret through environment variables:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:mysql://localhost:3306/socia?useSSL=false&serverTimezone=UTC"
$env:SPRING_DATASOURCE_USERNAME = "root"
$env:SPRING_DATASOURCE_PASSWORD = "your-password"
$env:JWT_SECRET = "replace-with-a-secret-of-at-least-64-bytes-for-hs512"
$env:JWT_ISSUER = "socia"
```

Start the API:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

The API is available at `http://localhost:8080/socia/v1`.

### 3. Configure and run the frontend

```bash
cd frontend
npm ci
npm run dev
```

Open the URL printed by Vite, then visit:

- `http://localhost:5173/login`
- `http://localhost:5173/register`

During development, Vite proxies requests starting with `/socia` to `http://localhost:8080`. No frontend API environment variable is needed locally.

For a separately hosted API, create `frontend/.env.local`:

```env
VITE_API_BASE_URL=https://api.example.com/socia/v1
```

### Authentication Examples

Register:

```json
POST /socia/v1/auth/register
{
  "username": "alex",
  "password": "your-secure-password",
  "phone": "0123456789",
  "sex": "MALE"
}
```

Login:

```json
POST /socia/v1/auth/login
{
  "username": "alex",
  "password": "your-secure-password"
}
```

On successful login, the backend sets the JWT in an HttpOnly cookie. The frontend sends requests with credentials, checks the session through `GET /auth/session`, and redirects to `/login` when the session expires. State-changing requests include the CSRF token returned by `GET /auth/csrf`; `POST /auth/logout` clears the authentication cookie. Access tokens are not stored in localStorage.

For local HTTP development, `AUTH_COOKIE_SECURE` defaults to `false` and `FRONTEND_ORIGIN` defaults to `http://localhost:5173`. Set `AUTH_COOKIE_SECURE=true` when deploying over HTTPS and configure the frontend origin explicitly.

In VS Code, the backend launch configuration reads the root `.env` file and runs a clean Maven compilation before starting with F5. Stop the debugger with Shift+F5.

## Available Commands

### Frontend

```bash
npm run dev      # Start the Vite development server
npm run build    # Type-check and build for production
npm run lint     # Run ESLint
npm run preview  # Preview the production build
```

### Backend

```powershell
.\mvnw.cmd spring-boot:run  # Run the API
.\mvnw.cmd test            # Run backend tests
```

## Security Notes

- Never use the development JWT fallback secret in a shared or production environment.
- Set `JWT_SECRET` to a private value of at least 64 bytes because the application uses HS512.
- Keep database credentials outside version control by using environment variables or a secret manager.
- Configure CORS and transport security appropriately before deploying the frontend and backend to separate origins.

## License

No license has been specified for this repository yet.
