# HospEase: Architecture & Folder Layout Guide

Welcome to the HospEase development guide. This document explains the full architecture of the application, describing the purpose of each directory and file across the React + Vite frontend, the Spring Boot backend, and the SQL database seeding layer. It also details the flows and integration logic of key actions.

---

## 1. High-Level Architecture

HospEase is built as a modern multi-tier web application:

1. **Frontend (React + Vite + TailwindCSS)**: Handles the user interface, routing, auth session caching, and input validation. Calls backend REST endpoints asynchronously.
2. **Backend (Spring Boot + Spring Security + JPA/Hibernate)**: Manages authentication, token generation, business logic (stay length computation, room rates query, aggregated invoicing), and exposes REST endpoints.
3. **Database (H2/SQL Database)**: Stores persistence records. Initialized and pre-seeded on startup using `data.sql`.

---

## 2. Frontend Directory & File Layout (`/src`)

The frontend codebase is organized by functionality under the `/src` directory.

### Root Files
* **[main.tsx](file:///c:/Users/Sudherson%20C/Downloads/src/src/main.tsx)**: The main entry point that boots React, imports global styles, and mounts the application inside the HTML container.
* **[App.tsx](file:///c:/Users/Sudherson%20C/Downloads/src/src/App.tsx)**: The main application root. It wraps the app with session contexts and mounts the routing provider.
* **[AuthContext.tsx](file:///c:/Users/Sudherson%20C/Downloads/src/src/AuthContext.tsx)**: React Context that manages the active authentication state (Bearer JWT token, user profile, role). It exposes `login()` and `logout()` triggers globally.

### Subdirectories

#### 📂 `src/models/`
Defines TypeScript type definitions and interfaces mapping to backend entities and request payloads:
* **`users.ts`**: Types for users, including operational roles (`ADMIN`, `GUEST`, `HOUSEKEEPING_STAFF`, etc.).
* **`guest.ts`**: Guest registry model (DOB, parsed address, loyalty tier, active status).
* **`room.ts`**: Room inventory details (room number, availability status, amenities JSON).
* **`reservation.ts`**: Stay reservation details, date stamps, and headcount checks.
* **`invoice.ts`**: Invoice definitions, line items list, currency type, and totals.
* **`payment.ts`**: Recording payments (amount, currency, method).
* **`serviceOrder.ts`**: Lodging room service orders (price, fulfillment status).
* **`staff.ts`**: Staff member profiles.
* **`schedule.ts`**: Attendant shifts and dates.
* **`report.ts`**: System analytics report records.

#### 📂 `src/services/`
Contains the API layer responsible for backend communications:
* **`api.ts`**: Instantiates the central Axios client. Includes:
  * **Request Interceptor**: Automatically fetches and attaches the Bearer JWT token to every outgoing request.
  * **Response Interceptor**: Catches and standardizes API exception messages, passing them to the global Toast notification wrapper.
* **`authService.ts`**: Calls `/users/login` and `/users/register`.
* **`guestService.ts`**: Creates, updates, and fetches guest profile data.
* **`roomService.ts`**: Manages room inventory additions and edits.
* **`reservationService.ts`**: Coordinates bookings, dynamic vacancy checks, check-in, and check-out.
* **`invoiceService.ts`**: Handles invoice generation requests.
* **`paymentService.ts`**: Handles payment checkouts.
* **`serviceOrderService.ts`**: Registers guest room orders and updates their fulfillment statuses.
* **`staffService.ts`**: Processes staff profiles.
* **`scheduleService.ts`**: Manages employee shift allocations.
* **`reportService.ts`**: Compiles analytics records.

#### 📂 `src/hooks/`
Provides custom React hooks to simplify component state logic:
* **`useAuth.ts`**: Quick wrapper to access active session variables (`role`, `token`, `user`) from the `AuthContext`.
* **`useFetch.ts`**: Handles asynchronous API calls by managing state for `loading` spinners, caching `data` responses, and capturing `error` exceptions.

#### 📂 `src/routes/`
Defines navigation paths and locks down restricted views:
* **`routes.tsx`**: Defines public paths (`/login`, `/register`) and protected dashboard sub-routes using `react-router-dom`.
* **`ProtectedRoute.tsx`**: Validates whether the user is authenticated and matches the allowed roles. Redirects to `/login` or `/dashboard` if unauthorized.

#### 📂 `src/pages/`
Contains page views. Each page has its own folder containing a `.tsx` file (markup & state) and a side-by-side `.css` file (modular style details):
* **`LoginPage/`**: Credential entry form enforcing format checks.
* **`RegisterPage/`**: Public signup form that registers users as `GUEST` by default.
* **`Profile/`**: View and edit guest profile data (required for first-time guest logins).
* **`Dashboard/`**: Renders the GUEST welcome dashboard (stays, orders, bills) or the ADMIN control panel.
* **`Rooms/`**: Room inventory controls, room types dropdown, and amenities.
* **`Reservations/`**: Booking console featuring dynamic date listeners to list only available rooms.
* **`Staff/`**: Directory for managing employee rosters (roles, 10-digit contact numbers, emails).
* **`Billing/`**: Invoice generating tool for admins and invoice downloading/paying interface for guests.
* **`Reports/`**: Renders analytical reports by parsing the `metricsJson` payload from the backend.
* **`Housekeeping/`**, `Orders/`, `Schedules/`, `Guests/`: Tables and status filters for operational management.

#### 📂 `src/components/`
Contains reusable UI widgets:
* **`Dashboard/`**: Main layout modules (`Sidebar.tsx`, `Header.tsx`, `DashboardLayout.tsx`) that coordinate sidebar paths, welcome bars, and responsive overlays.
* **`Button.tsx` / `Button.css`**: Shared premium styling buttons.
* **`Modal.tsx`**: Common popup interface for creating and updating forms.
* **`Headsup.tsx` / `PaymentSuccessModal.tsx`**: Custom UI alerts.

---

## 3. Backend Directory Layout (`/hospease-backend`)

The Spring Boot backend is organized under the package `com.hospease`:

### Core Layers
* **`HospeaseApplication.java`**: Runs the Spring Boot server.
* **📂 `config/`**: Sets up global middleware:
  * **`SecurityConfig.java`**: Restricts endpoints, maps roles, and configures authentication filters.
  * **`AuthConfig.java`**: Sets up custom authentication managers and user details services.
  * **`OpenApiConfig.java`**: Configures Swagger documentation.
* **📂 `security/`**:
  * **`JwtUtil.java`**: Handles token parsing, signature verification, and payload extraction.
  * **`JwtAuthenticationFilter.java`**: Intercepts HTTP requests, extracts the JWT header, and authorizes the user context.
* **📂 `entity/`**: Database models mapped to Hibernate tables:
  * `User.java`, `Guest.java`, `Room.java`, `Reservation.java`, `Housekeeping.java`, `Invoice.java`, `Payment.java`, `ServiceOrder.java`, `Staff.java`, `StaffSchedule.java`, `Report.java`.
* **📂 `enums/`**: Declares application domain constants (e.g., `Roles`, `RoomStatus`, `ReservationStatus`, `InvoiceStatus`, `PaymentMethod`).
* **📂 `repository/`**: Extends Spring Data `JpaRepository` to perform CRUD database queries.
* **📂 `requestdto/`** & **📂 `responsedto/`**: Standardizes REST API requests and responses, sanitizing entities and hiding sensitive values (like password hashes).
* **📂 `controller/`**: Declares HTTP endpoints:
  * `AuthController.java`: Registers guest users and returns Bearer JWT tokens.
  * `GuestController.java`, `RoomController.java`, `ReservationController.java`, `InvoiceController.java`, `PaymentController.java`, `ServiceOrderController.java`, `StaffController.java`, `StaffScheduleController.java`, `ReportController.java`.
* **📂 `service/`**: Core logic layer:
  * **`UserServiceImpl.java`**: Handles user registrations, admin initialization, and user lookups.
  * **`ReservationService.java`**: Coordinates check-in and check-out events.
  * **`InvoiceService.java`**: Calculates total room stay and fulfilled service order rates dynamically.
  * **`ReportService.java`**: Calculates real-time database totals and serializes them to `metricsJson`.
* **📂 `resources/`**:
  * **`application.properties`**: Configuration parameters (database ports, token signature keys, logging levels).
  * **`data.sql`**: Initial database seeding script.

---

## 4. End-to-End System Flows

### Flow A: User Registration & Onboarding
1. **User Sign Up**: The user registers on the frontend. The payload is sent to `POST /users/register`.
2. **Backend Processing**: `UserServiceImpl` validates that the email is unique, hashes the password using BCrypt, sets the role to `GUEST`, and commits the record to the `users` table.
3. **First-Time Login**: The user logs in and receives a JWT token.
4. **Onboarding Check**: The frontend checks the `/guests` registry. If no guest profile email matches the user's email, the user is redirected to a profile setup page.
5. **Profile Completion**: The user submits their DOB, phone number, and address, which is sent to `POST /guests` to create their `Guest` profile.

### Flow B: Dynamic Booking & Vacancy Check
1. **Date Selection**: The user selects check-in and check-out dates.
2. **Vacancy Query**: The frontend calls `GET /api/reservations/available-rooms?checkIn=...&checkOut=...`.
3. **Overlap Check**: The backend runs a database query to find rooms with active bookings overlapping the selected dates:
   ```sql
   SELECT r FROM Room r WHERE r.roomId NOT IN (
       SELECT res.room.roomId FROM Reservation res 
       WHERE res.status != 'CANCELLED' 
       AND (res.checkInDate < :checkOut AND res.checkOutDate > :checkIn)
   )
   ```
4. **Dropdown Update**: The frontend receives the list of available rooms and updates the dropdown menu.

### Flow C: Aggregated Automated Invoicing
1. **Invoice Trigger**: The clerk requests an invoice generation by providing the reservation reference.
2. **Room Charge Calculation**: The backend calculates the stay duration in nights:
   $$\text{Nights} = \text{Duration between Check-In and Check-Out (minimum of 1)}$$
   $$\text{Room Charges} = \text{Nights} \times \text{Room Rate per Night}$$
3. **Service Order Aggregation**: The backend queries the database for fulfilled service orders associated with the guest during their stay and sums their totals.
4. **Invoice Creation**: The backend aggregates these totals, creates the line items, generates a PDF reference path, and saves the invoice.
5. **Checkout**: The guest views the invoice, opens the checkout interface, and pays. This updates the invoice status to `PAID`.

---

## 5. Database Seeding Setup (`data.sql`)

When the backend starts up, Spring Boot automatically executes the `data.sql` script to set up test data:
* **Rooms**: Adds available, occupied, and maintenance rooms (`101` to `202`).
* **Guest Accounts**: Pre-seeds test users (e.g. Alice Smith, Bob Miller) along with their corresponding user and guest records.
* **Staff Records**: Seeds attendants (housekeepers, clerks) and links them to staff schedules.
* **Reservations**: Seeds active stays and future bookings.
* **housekeeping & service_order**: Seeds cleaning tasks and room service orders.

---

## 6. Development Guidelines

### Adding a New View
1. Define the TypeScript payload types in `src/models/`.
2. Implement backend endpoint callers in `src/services/`.
3. Create the view folder under `src/pages/NamePage/` containing `NamePage.tsx` and `NamePage.css`.
4. Register the route path inside `src/routes/routes.tsx`.
5. Update `src/components/Dashboard/Sidebar.tsx` to add the link matching the allowed roles.
