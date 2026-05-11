# API Reference

Pietru provides a RESTful API for programmatic access to your email data.

## Authentication

All API requests require authentication via an API key in the `Authorization` header:

```
Authorization: Bearer your-api-key
```

## Base URL

```
https://api.pietru.dev/v1
```

## Endpoints

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/projects` | List all projects |
| `GET` | `/projects/:id` | Get project details |
| `POST` | `/projects` | Create a project |
| `PATCH` | `/projects/:id` | Update a project |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/inbox` | List all messages (paginated) |
| `GET` | `/inbox/:id` | Get message details |
| `GET` | `/projects/:id/messages` | List messages for a project |

### Query Parameters (Messages)

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | `string` | Full-text search |
| `status` | `string` | Filter by status (`sent`, `failed`, `captured`, `received`) |
| `direction` | `string` | `incoming` or `outgoing` |
| `cursor` | `string` | Pagination cursor |
| `limit` | `number` | Results per page (default: 25) |

## Example

```bash
curl -H "Authorization: Bearer your-api-key" \
  "https://api.pietru.dev/v1/inbox?status=sent&limit=10"
```

## Rate Limits

API requests are limited to 100 requests per minute per API key.
