# DevPulse

DevPulse is an internal issue and feature tracker API for software teams. Team members can report bugs or feature requests, while maintainers can manage every issue and its workflow status.

## Features

- Contributor and maintainer roles
- bcrypt password hashing (configurable from 8–12 rounds)
- Signed, expiring JWT authentication
- Ownership-aware issue updates
- Maintainer-only deletion and status management
- Public issue listing with sorting and filtering
- Reporter details fetched without SQL `JOIN` operations
- Parameterized raw SQL through the native `pg` driver
- Centralized validation, 404 handling, and error responses
- Automatic `updated_at` PostgreSQL triggers

## Technology

- Node.js 24+
- TypeScript 7 (stable)
- Express 5
- PostgreSQL with `pg`
- bcrypt
- jsonwebtoken
- http-status-codes

No ORM, query builder, or SQL `JOIN` is used.

## Project Structure

```text
src/
├── app.ts
├── server.ts
├── config/
│   └── index.ts
├── db/
│   └── index.ts
├── errors/
│   └── AppError.ts
├── middleware/
│   ├── auth.ts
│   ├── globalErrorHandler.ts
│   └── notFound.ts
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.interface.ts
│   │   ├── auth.route.ts
│   │   ├── auth.service.ts
│   │   └── auth.validation.ts
│   └── issues/
│       ├── issue.controller.ts
│       ├── issue.interface.ts
│       ├── issue.route.ts
│       ├── issue.service.ts
│       └── issue.validation.ts
├── types/
└── utils/
```

## Local Setup

### 1. Requirements

- Node.js `24.x` or newer
- PostgreSQL
- npm

### 2. Install

```bash
npm install
cp .env.example .env
```

### 3. Configure Environment

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/devpulse
DATABASE_SSL=false
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=1h
BCRYPT_SALT_ROUNDS=10
```

| Variable | Description |
| --- | --- |
| `PORT` | API port; defaults to `5000` |
| `DATABASE_URL` | Required PostgreSQL connection URL |
| `DATABASE_SSL` | Set to `true` for hosted databases requiring SSL |
| `JWT_SECRET` | Required JWT signing secret |
| `JWT_EXPIRES_IN` | Token lifetime; defaults to `1h` |
| `BCRYPT_SALT_ROUNDS` | Integer from `8` to `12`; defaults to `10` |

The application creates the `users` and `issues` tables, indexes, and timestamp triggers at startup.

### 4. Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

## API Endpoints

Base URL: `http://localhost:5000`

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/signup` | Public | Register a user |
| `POST` | `/api/auth/login` | Public | Log in and receive a JWT |
| `POST` | `/api/issues` | Authenticated | Create an issue |
| `GET` | `/api/issues` | Public | List issues |
| `GET` | `/api/issues/:id` | Public | Get one issue |
| `PATCH` | `/api/issues/:id` | Owner or maintainer | Update an issue |
| `DELETE` | `/api/issues/:id` | Maintainer | Delete an issue |

Protected requests accept the assignment format:

```http
Authorization: <JWT_TOKEN>
```

Standard Bearer format is also supported:

```http
Authorization: Bearer <JWT_TOKEN>
```

### Register

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Doe",
    "email": "john.doe@devpulse.com",
    "password": "securePassword123",
    "role": "contributor"
  }'
```

If `role` is omitted, it defaults to `contributor`. Valid roles are `contributor` and `maintainer`. Passwords are never returned.

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "john.doe@devpulse.com",
    "password": "securePassword123"
  }'
```

The response contains `data.token` and a password-free `data.user`. The token payload contains the user's `id`, `name`, and `role`.

### Create an Issue

```bash
curl -X POST http://localhost:5000/api/issues \
  -H 'Content-Type: application/json' \
  -H 'Authorization: <JWT_TOKEN>' \
  -d '{
    "title": "Database connection timeout under load",
    "description": "Pool exhausts after 50+ concurrent queries, causing 500 errors",
    "type": "bug"
  }'
```

Valid types are `bug` and `feature_request`. New issues always use `open` status. `reporter_id` comes from the verified token and cannot be supplied in the body.

### List Issues

```bash
curl 'http://localhost:5000/api/issues?sort=newest&type=bug&status=open'
```

| Query | Values | Default |
| --- | --- | --- |
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | No filter |
| `status` | `open`, `in_progress`, `resolved` | No filter |

Reporter records are loaded in a separate batched query using `WHERE id = ANY(...)`.

### Update an Issue

```bash
curl -X PATCH http://localhost:5000/api/issues/1 \
  -H 'Content-Type: application/json' \
  -H 'Authorization: <JWT_TOKEN>' \
  -d '{
    "title": "Updated database pool exhaustion fix needed",
    "description": "Updated description with detailed reproduction steps",
    "type": "bug"
  }'
```

- Contributors can update `title`, `description`, or `type` on their own issue only while its status is `open`.
- Maintainers can update those fields on any issue.
- Maintainers can also change `status` to `open`, `in_progress`, or `resolved` through the same endpoint.
- Contributor edits to a non-open issue return `409 Conflict`.

### Delete an Issue

```bash
curl -X DELETE http://localhost:5000/api/issues/1 \
  -H 'Authorization: <MAINTAINER_JWT_TOKEN>'
```

Only maintainers can delete issues.

## Response Format

Success:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
```

The API uses `200`, `201`, `400`, `401`, `403`, `404`, `409`, and `500` as appropriate.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the watch-mode development server |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run validation tests |
| `npm run build` | Compile into `dist/` |
| `npm start` | Run the compiled API |
| `npm run check` | Type-check, test, and build |

## License

MIT
