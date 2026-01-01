# Fix: Firebase Environment Variables Not Loading

## Problem
You mentioned that all Firebase environment variables are in a `.env` file, but Next.js is showing an error that they're missing.

## Solution

**Next.js only reads `.env.local` files by default**, not `.env` files.

### Quick Fix:

1. **Rename or copy your `.env` file to `.env.local`**:
   ```bash
   # Windows PowerShell
   Copy-Item .env .env.local
   
   # Or manually rename it
   ```

2. **Or create a new `.env.local` file** with your Firebase configuration:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
   NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
   ```

3. **Restart your development server**:
   ```bash
   # Stop the current server (Ctrl+C)
   npm run dev
   ```

## Why `.env.local`?

- `.env.local` is loaded by Next.js automatically
- `.env.local` is in `.gitignore` by default (secure)
- `.env` files are also supported, but `.env.local` takes precedence

## Verify It's Working

After restarting, you should see:
- No Firebase initialization errors
- No "Missing required Firebase environment variables" warnings
- The app should connect to Firestore successfully

## Note

If you want to keep both files:
- `.env` - for default/shared values (can be committed)
- `.env.local` - for local overrides (never committed)

Next.js will load both, with `.env.local` taking precedence.

