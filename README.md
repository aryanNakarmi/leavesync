# LeaveSync - Complete Leave Management System

**Native MongoDB + Next.js with Nielsen's 10 Usability Heuristics**

## Quick Start

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env - set MONGODB_URL to your local MongoDB
npm run dev
```

Backend runs on `http://localhost:5000`

### Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend runs on `http://localhost:3000`

## Demo Credentials

- **Email**: admin@leavesync.com
- **Password**: password123

## Technology Stack

**Backend:**
- Express.js + Node.js
- Native MongoDB driver (no ORM)
- JWT authentication
- TypeScript

**Frontend:**
- Next.js 14
- NextAuth.js
- Tailwind CSS
- Nielsen's 10 Usability Heuristics

## Nielsen's Heuristics Applied

1. **Visibility of system status** - Real-time feedback, loading states
2. **Match system with real world** - Clear language, familiar patterns
3. **User control & freedom** - Navigation, cancel buttons
4. **Error prevention** - Form validation, confirmations
5. **Error recovery** - Clear error messages with suggestions
6. **Recognize vs recall** - Visual hierarchy, consistent UI
7. **Flexibility & efficiency** - Quick actions, shortcuts
8. **Aesthetic & minimalist** - Clean, focused design
9. **Help & documentation** - Demo credentials, inline help
10. **Error prevention** - Prevent invalid states

## Project Structure

```
leavesync/
├── backend/
│   ├── src/
│   │   ├── config/database.ts    # MongoDB connection
│   │   ├── controllers/          # Route handlers
│   │   ├── repositories/         # Direct MongoDB queries
│   │   ├── middleware/auth.ts    # JWT authentication
│   │   ├── types/index.ts        # TypeScript interfaces
│   │   └── index.ts              # Express server
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── login/page.tsx     # Login with Nielsen heuristics
    │   │   ├── dashboard/         # Main dashboard
    │   │   └── layout.tsx
    │   ├── lib/auth.ts            # NextAuth config
    │   └── app/globals.css
    └── package.json
```

## Features

✅ User login (admin & employee)
✅ Apply for leave
✅ Leave request tracking
✅ Admin approval/rejection
✅ Leave balance management
✅ Real-time notifications
✅ Responsive design
✅ Error recovery

## API Routes

`POST /api/login` - User login
`GET /api/profile` - Get user profile
`POST /api/leaves` - Create leave request
`GET /api/leaves/my` - Get employee's leaves
`GET /api/leaves` - Get all leaves (admin)
`PATCH /api/leaves/:id/approve` - Approve leave (admin)
`PATCH /api/leaves/:id/reject` - Reject leave (admin)

## Development

Make sure MongoDB is running locally:

```bash
# Mac
brew services start mongodb-community

# Windows
# Open Services and start MongoDB

# Linux
sudo systemctl start mongod
```

Then follow the Quick Start steps above.

## Notes

- Both frontend and backend are in TypeScript
- MongoDB runs locally (no cloud setup needed)
- Session stored in JWT tokens
- Passwords hashed with bcryptjs
