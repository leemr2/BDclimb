# The BD Climbing Association

A community calendar and chat application for climbing gym members to coordinate workout times and communicate with each other.

## Features

- **Workout Calendar**: Daily view with 30-minute time blocks from 6:00 AM to 10:00 PM
  - Mark time slots as "Thinking about it" or "Will be working out"
  - See who else is planning to work out at the same time
  - View and select dates from today forward

- **Community Chat**: Real-time group messaging
  - Send messages to the entire community
  - Delete your own messages
  - See who's chatting with display names

- **User Profiles**: Custom display names for community members
  - Set your display name on first login
  - Display names shown in calendar and chat

- **Real-time Updates**: All calendar entries and messages update instantly using Firebase Firestore

## Tech Stack

- **Next.js 16** - React framework with App Router
- **Firebase v10** - Authentication and Firestore database
- **TypeScript** - Type-safe development
- **React 19** - UI library

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Firebase project with Authentication and Firestore enabled

### Installation

1. Clone the repository and install dependencies:

```sh
npm install
# or
yarn install
```

2. Set up Firebase configuration:

   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Enable Firestore Database
   - Get your Firebase config from Project Settings

3. Create a `.env.local` file in the root directory with your Firebase configuration:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Configure Firestore Security Rules:

   In the Firebase Console, go to Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Calendar entries - everyone can read, users can manage their own
    match /calendar/{entryId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Messages - everyone can read, users can create and delete their own
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

5. Build the service worker (required for authentication):

```sh
npm run build-service-worker
# or
yarn build-service-worker
```

6. Start the development server:

```sh
npm run dev
# or
yarn dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Sign Up / Login**: Create an account or log in with existing credentials
2. **Set Display Name**: On first login, you'll be prompted to set a display name
3. **Mark Workout Times**: 
   - Select a date (today or future)
   - Click on a time block to cycle through: Empty → Thinking → Confirmed → Empty
   - See who else is planning to work out at the same time
4. **Chat**: Use the chat panel on the right to communicate with the community
5. **Delete Messages**: Click the × button on your own messages to delete them

## Project Structure

```
src/
├── app/
│   ├── community/
│   │   └── page.tsx          # Main community page (calendar + chat)
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   └── page.tsx               # Homepage (redirects to /community)
├── components/
│   ├── Calendar/
│   │   ├── Calendar.tsx       # Main calendar component
│   │   └── TimeBlock.tsx      # Individual time block
│   ├── Chat/
│   │   ├── Chat.tsx           # Main chat component
│   │   └── Message.tsx        # Individual message
│   └── DisplayNameSetup.tsx  # Display name setup modal
└── lib/
    └── firebase/
        ├── client.ts          # Firebase initialization
        ├── auth.tsx           # Authentication context
        ├── users.ts           # User profile functions
        ├── calendar.ts        # Calendar data functions
        └── messages.ts        # Chat message functions
```

## Firebase Collections

- **users**: User profiles with display names
- **calendar**: Workout commitments by date and time
- **messages**: Community chat messages

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Notes

- The app requires Firebase Authentication and Firestore to be enabled
- Make sure to configure Firestore security rules before deploying
- The service worker must be built before running the app (`npm run build-service-worker`)
