# ⚙️ Real-time Breakdown Reporting and Maintenance System

A real-time web-based breakdown reporting and maintenance management system built using React.js, Tailwind CSS, and Firebase Client SDK (Authentication + Realtime Database).

This system enables employees to report equipment issues instantly, while managers and technicians can manage, assign, and resolve those reports in real time — all synchronized seamlessly through Firebase.

---

## 🚀 Features

### User Authentication
- Secure login and registration using Firebase Authentication.
- Role-based access for Reporter, Manager, and Technician.
- Each user’s role stored in Firebase Realtime Database.
- Logout functionality for all roles.

### Role-Based Dashboards
#### Employee Dashboard
- Submit new breakdown reports.
- View all submitted reports and their current statuses (Pending / Assigned / Resolved).
- Track the history of resolved issues.

#### Manager Dashboard
- View all new and pending breakdown reports in real-time.
- Approve and assign technicians to specific reports.
- Edit, update, or close reports after completion.

#### Technician Dashboard
- View all tasks assigned to the logged-in technician.
- Add fix details and mark tasks as resolved.
- View previously completed tasks.

### Real-time Updates & Notifications
- All operations sync instantly across all users.
- Real-time database updates using **Firebase Realtime Database**.
- Toast notifications for login, registration, report submission, technician assignment, and resolution updates.

### Modern UI & UX
- Clean, responsive interface built with **Tailwind CSS**.
- Smooth navigation with **React Router DOM**.
- Interactive UI with hover effects and rounded design.

---

## Tech Stack

| Layer | Technology |
|-------|-------------|
| Frontend | React.js |
| Styling | Tailwind CSS |
| Routing | React Router DOM |
| Authentication | Firebase Authentication |
| Database | Firebase Realtime Database |
| Notifications | React Toastify |

---

## System Overview

The system consists of two interconnected web applications sharing the same Firebase backend:

- **Breakdown Reporter (Client App)** – Used by employees to submit new reports, view their statuses, and track resolved issues.
- **Maintenance Manager (Admin App)** – Used by managers and technicians to view, approve, assign, update, and resolve breakdown reports.

### Workflow
1. Employee submits a breakdown report.
2. Manager receives the report instantly.
3. Manager assigns a technician.
4. Technician updates the report after fixing the issue.
5. Employee sees the updated status in real-time.

---
## Installation & Setup
### Clone the repository



