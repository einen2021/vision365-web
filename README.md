# Vision 365 - Fire & Safety Intelligence Web App

A comprehensive Next.js web application for monitoring and managing building safety systems, providing real-time monitoring, incident reporting, construction progress tracking, and control systems management.

## Features

- 🔐 **Authentication System** - Secure login and signup with session persistence
- 📊 **Real-time Dashboard** - Live alarm monitoring (Fire, Trouble, Supervisory) with auto-refresh
- 📈 **Stats/Mimics** - Device status monitoring with real-time updates
- 🏗️ **Construction Dashboard** - Progress tracking with expandable subcategories
- 🎛️ **Controls** - Smoke control system management with toggle controls
- 📝 **Incident Reports** - Create, view, and manage safety incidents
- 🗺️ **Floor Maps** - Interactive floor plan viewer with asset markers

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Forms**: React Hook Form + Zod
- **Database**: Firebase Firestore
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **UI Components**: Radix UI

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vision365-web
```

2. Install dependencies:
```bash
npm install
```

3. Move images to the public folder:
```bash
# Create public/images directory if it doesn't exist
mkdir -p public/images
# Copy images from images/ to public/images/
# Note: In Next.js, static assets must be in the public/ folder
# Images will be accessible at /images/filename.jpg
```

4. Create a `.env.local` file in the root directory with Firebase configuration:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

5. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
vision365-web/
├── app/
│   ├── (auth)/          # Authentication pages
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/     # Protected dashboard pages
│   │   ├── dashboard/
│   │   ├── stats/
│   │   ├── construction/
│   │   ├── controls/
│   │   ├── incidents/
│   │   └── floor-maps/
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page (redirects)
│   └── globals.css      # Global styles
├── components/
│   ├── ui/              # Reusable UI components
│   ├── navigation/      # Navigation components
│   └── common/          # Common components
├── context/             # React Context providers
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and API client
└── public/              # Static assets
```

## Key Features Implementation

### Real-time Polling

The app uses a custom `usePolling` hook for real-time updates:
- Dashboard: 5 seconds
- Stats: 2 seconds
- Construction: 10 seconds
- Controls: 2 seconds
- Incidents: 5 seconds
- Floor Maps: 2 seconds

### Authentication

Protected routes automatically redirect to login if user is not authenticated. Session is persisted in localStorage.

### Responsive Design

Mobile-first design with breakpoints:
- Mobile: Default (< 640px)
- Tablet: sm (640px+)
- Desktop: md (768px+), lg (1024px+)

## Firebase Integration

The app uses Firebase Firestore directly from the client. All data operations are handled through:
- `lib/firebase.ts` - Firebase initialization
- `lib/firestore.ts` - Firestore helper functions and real-time listeners

### Features:
- Real-time listeners for live data updates (no polling needed)
- Direct Firestore queries for all data operations
- Authentication via UserDB collection
- Automatic real-time synchronization

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The app is ready for deployment on Vercel:

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API base URL

## License

MIT

