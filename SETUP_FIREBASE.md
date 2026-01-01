# Firebase Setup Instructions

## Error: Firebase Invalid API Key

If you're seeing the error `Firebase: Error (auth/invalid-api-key)`, you need to set up your Firebase configuration.

## Steps to Fix

1. **Get your Firebase configuration:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project (or create a new one)
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps" section
   - Click on the web app icon (`</>`) or "Add app" if you haven't created one
   - Copy the Firebase configuration values

2. **Create `.env.local` file in the root directory:**
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

3. **Optional (if using Realtime Database):**
   ```env
   NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
   ```

4. **Optional (if using Analytics):**
   ```env
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
   ```

5. **Restart your development server:**
   ```bash
   npm run dev
   ```

## Important Notes

- All environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser
- Never commit `.env.local` to version control (it's already in `.gitignore`)
- Make sure your Firebase project has Firestore enabled
- Ensure your Firestore security rules allow the operations you need

## Verify Setup

After setting up, you should see no Firebase errors in the console. The app will initialize Firebase with your credentials.

