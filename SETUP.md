# Setup Instructions

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Images**
   - Create a `public/images` folder in the root directory
   - Copy all images from the `images/` folder to the `public/images/` folder
   - The app expects `start.jpg` to be at `/public/images/start.jpg` for the login/signup background
   - Images will be accessible at `/images/filename.jpg` in the app

3. **Environment Variables**
   - Create a `.env.local` file in the root directory
   - Add: `NEXT_PUBLIC_API_URL=https://einen-backend-430199503919.asia-south1.run.app`

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)
   - You'll be redirected to `/login` if not authenticated

## Project Structure

All features from the implementation guide have been created:

✅ **Authentication**
- Login page (`/login`)
- Signup page (`/signup`)
- Protected routes with automatic redirect

✅ **Dashboard** (`/dashboard`)
- Real-time alarm monitoring (Fire, Trouble, Supervisory)
- Community and Building selectors
- Message list with pagination
- Action buttons (Ack, Reset, S-Ack, T-Ack, Silence)
- Auto-refresh every 5 seconds

✅ **Stats/Mimics** (`/stats`)
- Device status monitoring
- Building selector
- Add Building/Device functionality (UI ready)
- Real-time polling (2 seconds)
- Color-coded device cards

✅ **Construction Dashboard** (`/construction`)
- Construction progress tracking
- Stats cards (Total Assets, Completed, Ongoing, Progress %)
- Step-by-step status management
- Expandable subcategory cards
- Edit mode for status updates
- Real-time polling (10 seconds)

✅ **Controls** (`/controls`)
- Smoke control system management
- Building selector with logo display
- Toggle controls (SEF, SPF, LIFT, FAN)
- Optimistic UI updates
- Real-time status sync

✅ **Incident Reports** (`/incidents`)
- View incidents with filters
- Community/Building filters
- Search functionality
- Stats cards (Total, Resolved, Open, High Priority)
- Priority and status badges
- Real-time polling (5 seconds)
- Create button (UI ready, needs modal implementation)

✅ **Floor Maps Viewer** (`/floor-maps`)
- Three-level navigation (Community → Building → Floor Plan)
- Interactive floor plan display
- Asset markers with activity indicators
- Category-based asset grouping
- Asset detail modals
- Real-time activity polling (2 seconds)

## Notes

- All API endpoints are configured in `lib/endpoints.ts`
- Authentication state is managed via React Context (`context/AuthContext.tsx`)
- Real-time polling uses custom hook `hooks/usePolling.ts`
- All components follow the design system from the guide
- Mobile-first responsive design implemented

## Next Steps (Optional Enhancements)

1. Implement modals for:
   - Add Building (Stats page)
   - Add Device (Stats page)
   - Create Incident (Incidents page)

2. Add form validation and submission for:
   - Building creation
   - Device creation
   - Incident creation

3. Add error boundaries for better error handling

4. Add loading skeletons for better UX

5. Add toast notifications for user feedback

