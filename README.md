# Game Theory Bookings Backend

This backend, built with Node.js and Express, supports the Game Theory Bookings platform by managing users, bookings, resources, centers, and sports. It provides RESTful endpoints for each role-based user, including admin, operations, and customer users, handling CRUD operations and booking management.

## Features

- **User Authentication**: Registration and login with JWT-based authorization.
- **Role Management**: Admins can promote users, and roles determine access levels across routes.
- **Center, Sport, and Resource Management**: Operations staff can create and manage sports centers, resources, and sports.
- **Booking Management**: Customers can create bookings for available sports resources, and operations staff can manage these bookings.

---

## Project Structure

```plaintext
game-theory-bookings-backend/
├── controllers/             # Business logic for different functionalities
│   ├── Admin/               # Controllers for admin-specific tasks
│   ├── Operations/          # Controllers for operations tasks (bookings, resources)
│   └── User/                # User controllers (auth, personal bookings)
├── middleware/              # Authorization middlewares
├── models/                  # Mongoose models (schemas)
├── routes/                  # Route definitions for different endpoints
├── .env                     # Environment variables
└── index.js                 # Main server entry file
```

## Models

### User
- **Fields**: `name`, `email`, `password`, `role` (`customer`, `operations`, `admin`)
- **Methods**: Password hashing, validation, JWT token generation

### Center
- **Fields**: `name`, `address`, `sports`
- **Relations**: Holds references to sports available at each center

### Sport
- **Fields**: `name`, `centers`, `resources`
- **Relations**: Associated with centers and resources

### Resource
- **Fields**: `name`, `sport`, `center`
- **Relations**: Tied to specific sports and centers

### Booking
- **Fields**: `user`, `resource`, `date`, `startTime`, `endTime`, `type`, `note`, `center`, `sport`
- **Relations**: Associated with users, resources, centers, and sports

---

## Routes

### User Routes (`/api/v1/auth`)
- **POST `/register`**: Registers a new user as a customer.
- **POST `/login`**: Authenticates a user and returns a JWT.
- **PATCH `/promote`**: Admins promote a user to `operations`.
- **GET `/customers`**: Admins view all customers.

### Center Routes (`/api/v1/centers`)
- **POST `/`**: Creates a new center (operations).
- **GET `/`**: Lists all centers.
- **GET `/:id`**: Retrieves a specific center.
- **PUT `/:id`**: Updates center information.
- **DELETE `/:id`**: Deletes a center.

### Sport Routes (`/api/v1/sports`)
- **POST `/`**: Adds a new sport (operations).
- **GET `/`**: Lists all sports or sports within a specific center.
- **GET `/:id`**: Retrieves a specific sport.
- **PUT `/:id`**: Updates a sport's details.
- **DELETE `/:id`**: Removes a sport from the database.

### Resource Routes (`/api/v1/resources`)
- **POST `/`**: Adds a resource (operations).
- **GET `/`**: Retrieves resources, optionally filtered by center and sport.
- **GET `/:id`**: Retrieves a specific resource by ID.
- **PUT `/:id`**: Updates resource information.
- **DELETE `/:id`**: Deletes a resource.

### Booking Routes (`/api/v1/bookings`)
- **GET `/`**: Lists all bookings (operations).
- **POST `/`**: Creates a booking (customer).
- **POST `/operations`**: Creates a booking (operations).
- **GET `/available`**: Shows available time slots.
- **GET `/user/:userId`**: Fetches all bookings for a specific user.
- **GET `/my`**: Lists bookings for the current user.

## Getting Started

### Prerequisites
- **Node.js** and **npm**
- **MongoDB** database
- **Environment Variables**: Create a `.env` file with `MONGO_URI` and `JWT_SECRET`.

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ananyaa07/game-theory-bookings-backend.git
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the server**:
   ```bash
   npm start
   ```

## Authentication and Authorization

- **JWT Authentication**: Secures routes by validating tokens.
- **Role-based Access Control**: Ensures only authorized users (admin, operations) access sensitive endpoints.

## The postman collection link is given below:

https://documenter.getpostman.com/view/34148883/2sAY4vgNHQ
