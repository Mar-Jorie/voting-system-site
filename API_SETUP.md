# API Setup Instructions

## Current Issue
The application is showing infinite loading because the API credentials are incorrect, resulting in 403 Unauthorized errors.

## How to Fix

### 1. Get Correct API Credentials
You need to obtain the correct `APP_ID` and `MASTER_KEY` from your Innque API provider.

### 2. Create Environment File
Create a `.env` file in the project root with the following content:

```env
# Innque API Configuration
VITE_APP_ID=your-actual-app-id
VITE_MASTER_KEY=your-actual-master-key
```

### 3. Update API Configuration
The API configuration is in `src/usecases/api.js`. The current values are:
- APP_ID: "votes" (fallback)
- MASTER_KEY: "Cbd9e198-8f76-4d8f-93b1-04201de94e5d" (fallback)

### 4. Test API Connection
You can test the API connection using the debug scripts:
```bash
node find-master-key.js
node get-app-info.js
```

### 5. Restart Development Server
After updating the credentials, restart the development server:
```bash
npm run dev
```

## What Was Fixed
- Removed duplicate loading indicators
- Added proper error handling for API failures
- Improved user experience with skeleton loading
- Added retry functionality when API calls fail
- Better error messages for different failure types

## Current Status
The application will now show proper error messages instead of infinite loading when the API is not accessible.
