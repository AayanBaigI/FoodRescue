# FoodRescue — Surplus Food Redistribution Backend

FoodRescue is a RESTful backend that connects surplus-food providers such as canteens, restaurants and event organizers with NGOs/volunteers who can claim and coordinate pickups before food expires.

## Core workflow

1. A provider registers/logs in.
2. The provider creates a food donation with quantity, location and expiry time.
3. NGOs can search available donations.
4. The system ranks available donations using expiry urgency, quantity and distance.
5. An NGO claims a donation.
6. The claim operation uses a PostgreSQL transaction with row-level locking so concurrent requests cannot claim the same remaining quantity incorrectly.
7. A volunteer can be assigned to the claim and the pickup status is tracked.
8. A background job marks expired donations as EXPIRED.

## Stack

- Node.js + Express.js
- PostgreSQL
- JWT authentication
- bcrypt password hashing
- REST API
- SQL transactions and row-level locking

## Database

Main tables:
- users
- locations
- donations
- claims
- pickups

## Setup

### 1. Create the database

Create a PostgreSQL database named `foodrescue`.

Run:

```bash
psql -U postgres -d foodrescue -f database/schema.sql
```

Optionally load sample records:

```bash
psql -U postgres -d foodrescue -f database/seed.sql
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Copy `.env.example` to `.env` and set your PostgreSQL connection string and JWT secret.

### 4. Start

```bash
npm run dev
```

API runs on `http://localhost:5000`.

## Main endpoints

### Auth
- POST `/api/auth/register`
- POST `/api/auth/login`

### Donations
- POST `/api/donations`
- GET `/api/donations`
- GET `/api/donations/:id`
- PATCH `/api/donations/:id/cancel`

### Claims
- POST `/api/donations/:id/claim`
- GET `/api/claims/my`

### Pickups
- POST `/api/claims/:claimId/pickup`
- PATCH `/api/pickups/:id/status`

### Health
- GET `/api/health`

## Example donation

```json
{
  "foodName": "Vegetable Biryani",
  "category": "Cooked Meals",
  "quantity": 40,
  "locationId": 1,
  "preparedAt": "2026-09-04T14:00:00Z",
  "expiryAt": "2026-09-04T18:00:00Z"
}
```

## Important design decision

The claim endpoint locks the donation row inside a database transaction before checking remaining quantity. This protects the inventory from race conditions when two NGOs attempt to claim the same donation at nearly the same time.

## Project scope

This is an MVP backend. A production version could add geospatial indexing, notification queues, image uploads, route optimization and an admin dashboard.
