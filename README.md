# Job Queue Management Backend

## About

This project is a small REST API for managing jobs in a queue. It provides endpoints to create jobs, view all jobs, update their status, and delete them. Jobs are persisted in a local SQLite database so data survives application restarts.

## Features

- Create jobs with a title and type
- Automatically assign an ID, `pending` status, and creation timestamp
- List all jobs
- Update job status
- Delete jobs
- Validate request bodies and route parameters
- Return appropriate errors for invalid input and missing jobs
- Prevent a `completed` or `failed` job from becoming `running` again

## Tech Stack

- Node.js
- NestJS 12
- TypeScript
- SQLite with `better-sqlite3`
- `class-validator` and `class-transformer`
- Vitest and Supertest for end-to-end tests

## Project Structure

```text
src/
  jobs/
    dto/                 Request validation DTOs
    jobs.controller.ts   HTTP routes
    jobs.service.ts      Business rules
    jobs.repository.ts   SQLite persistence
    job-status.enum.ts   Allowed statuses
  app.module.ts
  main.ts
test/
  jobs.e2e-spec.ts       API integration tests
data/
  jobs.sqlite            Local SQLite database, created at runtime
```

## Requirements

- Node.js 20 or later
- npm

## Setup

From the `backend` directory, install dependencies:

```bash
npm install
```

Start the API in development mode:

```bash
npm run start:dev
```

The API runs at:

```text
http://localhost:3000
```

The port can be changed with the `PORT` environment variable. The SQLite database is created automatically at `data/jobs.sqlite`.

Set `FRONTEND_URL` to the deployed frontend origin so the API allows browser requests from it. For Render, add `FRONTEND_URL=https://jobqueuemanager.netlify.app` in the service environment variables.

## Available Scripts

```bash
npm run start       # Start the application
npm run start:dev   # Start with watch mode
npm run build       # Compile the application
npm run start:prod  # Run the compiled application
npm run lint        # Run lint checks
npm run test:e2e    # Run API integration tests
```

## Job Model

Each job has the following fields:

| Field | Type | Description |
| --- | --- | --- |
| `id` | number | Automatically generated job ID |
| `title` | string | Required job title, maximum 200 characters |
| `type` | string | Required job type, maximum 100 characters |
| `status` | string | `pending`, `running`, `completed`, or `failed` |
| `createdAt` | string | Creation time in ISO 8601 format |

New jobs always start with `pending` status.

## API Endpoints

All examples use this base URL:

```text
http://localhost:3000
```

### Create a Job

```http
POST /jobs
Content-Type: application/json
```

Request body:

```json
{
  "title": "Export report",
  "type": "report"
}
```

Response: `201 Created`

```json
{
  "id": 1,
  "title": "Export report",
  "type": "report",
  "status": "pending",
  "createdAt": "2026-09-16T12:00:00.000Z"
}
```

### Get All Jobs

```http
GET /jobs
```

Response: `200 OK`

```json
[
  {
    "id": 1,
    "title": "Export report",
    "type": "report",
    "status": "pending",
    "createdAt": "2026-09-16T12:00:00.000Z"
  }
]
```

### Update Job Status

```http
PATCH /jobs/:id/status
Content-Type: application/json
```

Request body:

```json
{
  "status": "running"
}
```

Allowed status values:

```text
pending
running
completed
failed
```

Response: `200 OK` with the updated job.

### Delete a Job

```http
DELETE /jobs/:id
```

Response: `200 OK` when the job is deleted.

## Status Rules

- A new job starts as `pending`.
- A job may be updated to any allowed status.
- A job with status `completed` or `failed` cannot be changed to `running`.
- Attempting that transition returns `409 Conflict`.

## Validation and Error Responses

- `400 Bad Request`: Invalid or missing request fields, invalid status, or invalid numeric ID
- `404 Not Found`: The requested job does not exist
- `409 Conflict`: A completed or failed job is being changed to `running`

Example invalid request:

```json
{
  "title": "",
  "type": "report"
}
```

This returns `400 Bad Request` because `title` cannot be empty.

## Testing with Postman

1. Start the server with `npm run start:dev`.
2. Create a `POST` request to `http://localhost:3000/jobs` with a JSON body.
3. Copy the returned job ID.
4. Use `GET http://localhost:3000/jobs` to list jobs.
5. Use `PATCH http://localhost:3000/jobs/{id}/status` to change a status.
6. Set a job to `completed`, then try setting it to `running` to verify the `409 Conflict` rule.
7. Use `DELETE http://localhost:3000/jobs/{id}` to remove the job.

For JSON requests, set the header:

```text
Content-Type: application/json
```

## Automated Tests

Run the API tests with:

```bash
npm run test:e2e
```

The tests cover job creation, default status, invalid input, missing jobs, and the completed/failed status restriction.
