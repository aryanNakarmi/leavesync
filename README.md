# LeaveSync: Leave Management System

A full-stack leave management application built with Next.js 14, Express.js, and MongoDB. LeaveSync provides separate portals for admins and employees with a complete leave request lifecycle — from application and approval to reporting and notifications.


## Tech Stack


Frontend: Next.js 14 (React 18, TypeScript) 
Backend: Express.js (Node.js, TypeScript) 
Database: MongoDB (via native MongoDB driver) 
Authentication: JSON Web Tokens (JWT) + NextAuth.js 
Styling: Tailwind CSS with custom design tokens 
Icons: Material Symbol
Date Handling: date-fns 
Password Hashing: bcryptjs 



## Features

### Employee Portal
- **Dashboard** — overview of leave balances, quick stats, recent activity
- **Apply for Leave** — select leave type, choose dates (with balance validation), add reason, confirmation dialog
- **Leave Status** — track all requests with filterable tabs (All / Pending / Approved / Rejected), withdraw pending requests
- **Calendar** — personal calendar showing approved leaves and public holidays with day-popover details
- **Settings** — update profile (name, phone, address, photo) and change password with visibility toggle

### Admin Portal
- **Dashboard** — total/pending/approved/rejected counts, quick actions, recent leave requests table
- **Leave Requests** — review, approve, or reject requests with an optional admin comment; tabbed filtering
- **Employees** — full employee management: add, edit, delete, view details, manage leave balances
- **Calendar** — company-wide calendar with holiday management (add/edit/delete holidays)
- **Reports** — analytics with monthly trends, department breakdown, leave type distribution, employee usage, CSV export, date range filters
- **Settings** — manage leave types (create, edit, delete, toggle active/inactive)
- **Profile Modal** — update name, photo, and password from the sidebar

### Shared Features
- **Authentication** — signup, login, protected routes, role-based access
- **Notifications** — bell icon with unread count badge; triggered on leave submit, approve, reject, cancel; dropdown with mark-as-read; 30-second polling
- **Toast Notifications** — bottom-right dark-theme toasts for all success/error feedback
- **Responsive Sidebar** — role-specific navigation with user avatar, edit profile, and logout
