# Instagram Clone - Technical Documentation

## 📁 Project Structure

/Users/Admin/instagram/\
├── client/ # React/Vite Frontend\
│ ├── src/\
│ │ ├── components/\
│ │ ├── pages/\
│ │ ├── context/\
│ │ └── styles/\
│ └── package.json\
└── server/ # Express Backend\
├── controllers/\
├── models/\
├── routes/\
├── middleware/\
├── prisma/\
└── package.json

text

---

## 🎯 AI Image Generation

### Purpose

The `/api/ai/generate-image` endpoint is designed to **generate media only** --- not post it.

### Key Principle

> Keep image generation and posting separate so that every time an image is generated, it doesn't automatically post.

### Data Parsing

Be careful when parsing data so that data which doesn't meet specific requirements isn't deleted.

**Example parsed JSON body:**
```json
{
  "type": "text",
  "caption": "...",
  "hashtags": [...]
}

* * * * *

💾 In-Memory Data Storage (Development Only)
--------------------------------------------

For development/testing, we create a list inside the server route outside the POST and GET API endpoints.

### How It Works

-   Data sent to the API lives in the server's memory

-   Shared by all requests

-   POST can push into it

-   GET can read from it without a database

javascript

// Simple in-memory storage
let posts = [];

// Add to front of list
posts.unshift(newPost);

// Read from list
GET /api/posts returns posts

* * * * *

💬 Comments System Implementation
---------------------------------

### Backend (`models/Post.js`)

-   Added `getComments(postId, currentUserId)` with full nested replies + per-user like/author flags

-   Updated `addComment` to accept `parentId` for replies (nested comments support)

-   Added `deleteComment` with ownership check

-   Added `toggleCommentLike`

### Controllers (`postController.js`)

-   Added `getComments`, `deleteComment`, `toggleCommentLike` handlers

-   Updated `addComment` to pass `parentId` from request body

### Routes (`postRoutes.js`)

Added three new routes (static prefixes registered first to avoid Express param conflicts):

-   `GET /api/posts/:postId/comments`

-   `DELETE /api/posts/comments/:commentId`

-   `POST /api/posts/comments/:commentId/like`

### Frontend

PostCard.jsx

-   Imports `CommentsModal`

-   Adds `showCommentsModal` state

-   Changes 💬 button to `setShowCommentsModal(true)`

-   Renders `<CommentsModal>` at the bottom

CommentsModal.jsx

-   Replaced raw `fetch('/api/...')` (which was hitting the Vite dev server, not Express)

-   Uses `api` axios client (auth headers + correct base URL `http://localhost:5000/api`)

-   Accepts `currentUser` prop

-   Added recursive tree helpers for adding/removing nested replies

-   Escape key closes modal

CommentItem.jsx

-   Removed `'use client'`

-   Accepts `currentUser` prop

-   Derives `isAuthor` from `currentUser?.id === comment.user?.id`

CommentInput.jsx

-   Removed `'use client'`

CommentsModal.module.css

-   Made close button always visible (was `display: none` by default)

* * * * *

🪟 React Portal Fix for Modal
-----------------------------

### Problem

Modal rendering inside `<article class="ig-post">` had:

-   `overflow: hidden` → clipping the modal

-   `z-index: 1` → creating stacking context that trapped it below the page

### Solution

javascript

import { createPortal } from 'react-dom';

// Render modal directly on document.body
{showModal && createPortal(
  <Modal onClose={() => setShowModal(false)}>
    {content}
  </Modal>,
  document.body
)}

### Body Scroll Lock

javascript

useEffect(() => {
  document.body.style.overflow = 'hidden';
  return () => {
    document.body.style.overflow = 'unset';
  };
}, []);

* * * * *

🔄 Error Handling Pattern (Fire-and-Forget)
-------------------------------------------

### Problem

If a Prisma call (like notification creation) threw an error, it propagated up and Express never sent a response --- leaving the Axios call hanging forever.

### Solution

javascript

// Bad (could hang)
await createNotification(...);

// Good (fire-and-forget)
createNotification(...).catch(() => {});

### Try/Catch Pattern

javascript

async function addComment(req, res, next) {
  try {
    // Logic here
    res.json({ success: true });
  } catch (err) {
    next(err);  // Always send response
  }
}

### Loading State Fix

javascript

// Before - could get stuck
await onSubmit();
setText('');
setLoading(false);

// After - always resets
try {
  await onSubmit();
} finally {
  setLoading(false);  // Always runs
}

* * * * *

📦 Schema Updates (Prisma)
--------------------------

### Story Model Additions

-   `text` - for text-only stories

-   `duration` - milliseconds

-   `allowReplies`, `allowReactions`, `allowSharing` - boolean flags

-   `isCloseFriendOnly` - close friends filtering

-   `stickersData` - JSON for polls, quizzes

-   `audioId`, `audioUrl` - music integration

-   `viewCount` - analytics

-   `highlightId` - link to highlights

-   `isArchived`, `archivedAt` - story archive

-   `closeFriendsList` - array of user IDs

### New Models

-   `StoryView` - tracks who viewed, forward/backward, exited/completed

-   `StoryReply` - DM replies to stories

-   `StoryReaction` - emoji reactions (❤️ 😂 😮 😢 😡)

-   `StoryHighlight` - permanent collections of stories

-   `PostAnalytics` - reach, impressions, shares, saves

### Post Model Additions

-   `altText` - accessibility

-   `isCollaborative`, `collaborators` - shared posts

-   `hideLikeCount`, `hideViewCount` - privacy controls

-   `commentsDisabled` - turn off commenting

-   `shareToThreads`, `shareToFacebook` - cross-posting

* * * * *

📖 Story System Implementation
------------------------------

### API Routes (Express)

javascript

POST /api/stories/:id/view        // Creates StoryView record (tracks forward/backward/exited/completed)
POST /api/stories/:id/reaction    // Upserts StoryReaction + sends notification to story owner
POST /api/stories/:id/reply       // Persists StoryReply record (was notification-only before)

### StoryViewer Component Features

-   Reactions row: ❤️ 😂 😮 😢 😡 buttons above reply input with animated pop toast on send

-   Three-dot (⋮) menu: Report / About / Cancel options

-   First-time tap hint overlay (dismissed via localStorage, key `sv_tap_seen`)

-   Calls `trackView()` when a story loads

### StoriesTray Component

-   Auto-refreshes every 60 seconds

-   Shows story rings with gradient for unseen, gray for seen

### CSS Features

-   Reactions row styling

-   Reaction pop animation

-   Menu card styling

-   Tap hint overlay

* * * * *

🐛 Story Viewer Bug Fixes
-------------------------

### Bug 1: Exit instead of advance (double goNext)

Problem: Timer called `clearInterval` and `setTimeout(() => goNext())` inside `setProgress` state updater. React 18 invokes state updaters multiple times, so `goNext` fired twice per story end.

Fix: Track elapsed time as plain closure variable and call `goNextRef.current()` directly from interval callback (never inside state updater). Added `let done = false` flag to guard against double-fire.

### Bug 2: Page freezes (overflow: hidden stuck)

Problem: Body scroll lock combined with keyboard handler in one `useEffect([showMenu])`. Every time menu opened/closed, cleanup ran and captured new `prev` value.

Fix: Split into two separate effects:

-   Scroll lock uses `[]` (runs only on mount/unmount)

-   Keyboard handler uses `[showMenu]`

### Bug 3: Index out of bounds after switching users

Problem: When `onNext()` loaded new user's stories, `idx` kept old value. If new array was shorter, component returned `null` while mounted --- invisible but `overflow: hidden` remained.

Fix:

javascript

useEffect(() => setIdx(0), [stories]);

* * * * *

🎨 Create Post Flow (4 Steps)
-----------------------------

### Step 1: Media Selector (`MediaSelector.jsx`)

-   Drag-and-drop zone (react-dropzone)

-   Thumbnail grid for carousel (up to 10 files)

-   "Add more" button

-   Revokes object URLs on cleanup

### Step 2: Image Editor (`ImageEditor.jsx`)

Two tabs:

1.  Crop - react-image-crop with 4 aspect ratios: Original / 1:1 / 4:5 / 16:9

2.  Adjust - brightness, contrast, saturation sliders

On "Next →", draws crop + adjustments to canvas and passes resulting JPEG blob up.

### Step 3: Filters (`Filters.jsx`)

12 CSS filter presets:\
Normal, Clarendon, Gingham, Moon, Lark, Reyes, Juno, Slumber, Crema, Aden, Perpetua, Valencia

-   Thumbnail strip for selection

-   Large live preview above with selected filter applied

### Step 4: Details (`CreatePage.jsx`)

-   Caption (2,200-character counter)

-   Location

-   Accessibility accordion (alt text)

-   Advanced Settings accordion (hide like count + disable comments)

On "Share": uploads processed file with all metadata to `POST /api/posts`

* * * * *

📤 Share Sheet Implementation
-----------------------------

### Files Created

-   `ShareSheet.jsx` --- Portal-based bottom sheet with real API calls

-   `ShareSheet.module.css` --- Slide-up animation, sticky header, scrollable user list, responsive

### Features

-   Body scroll lock

-   Escape-to-close

-   Debounced user search

-   Clipboard copy with "Copied!" feedback

-   Add to Story

-   5 external platform buttons

### Server Additions

javascript

GET /api/users/search?q=              // Username search (excludes self)
GET /api/users/following              // Returns users current user follows
POST /api/posts/:postId/share         // Increments PostAnalytics.shares via upsert

### PostCard Wiring

-   Share button (↪️) now opens the sheet

-   "Share to..." option in three-dot menu also opens sheet

-   "Add to story" closes sheet and opens StoryCreator inline

* * * * *

👤 Profile Page Complete Implementation
---------------------------------------

### Component Structure

text

client/src/pages/NewProfilePage.jsx          # Main profile page
client/src/components/profile/
├── ProfileHeader.jsx        # Avatar, stats, bio, action buttons
├── ProfileHeader.module.css # Styling
├── PostGrid.jsx             # 3-column responsive grid with thumbnails
├── PostDetailModal.jsx      # Modal for post viewing
├── PostOptionsMenu.jsx      # Owner actions (pin, delete, edit, etc.)
├── FollowList.jsx           # Followers/Following modal lists
├── AboutAccountModal.jsx    # Account info modal
├── AddHighlightModal.jsx    # Create new highlight
├── HighlightEditModal.jsx   # Edit existing highlight
└── HighlightsSection.jsx    # Horizontal scroll of story highlights

### Features Implemented

Profile Header:

-   Instagram-style two-column layout (avatar left, info right)

-   Stats (posts, followers, following) - clickable modals

-   Bio section with contact info (email, phone, website, join date)

-   Action buttons (Edit profile, View archive)

-   Settings icon (⚙️)

Highlights:

-   Horizontal scroll below bio

-   Click to open HighlightViewer

-   Edit/Delete functionality

-   Create from archived stories

Post Grid:

-   Responsive 3-column grid with thumbnails

-   Pinned posts show 📌 badge and sort first

-   Pin/Unpin in three-dot menu

-   Click opens detail modal (not navigation)

Profile Tabs (only 4 tabs):

-   📷 POSTS

-   🎬 REELS

-   📌 SAVED

-   🔄 REPOSTS

### Server Endpoints Added

javascript

// Profile
GET    /api/profile/:userId
PUT    /api/profile/update
POST   /api/profile/avatar
GET    /api/profile/:userId/reels
GET    /api/profile/:userId/saved
GET    /api/profile/:userId/reposts
GET    /api/profile/:userId/tagged

// Posts (additional)
POST   /api/posts/:id/pin          # Pin/unpin post
DELETE /api/posts/:id              # Delete post
PUT    /api/posts/:id              # Update post (caption, etc.)
GET    /api/posts/:id              # Get single post with comments

### Profile Picture Upload

Frontend: `EditProfileModal.jsx`

-   Uses `/api/profile/avatar` endpoint

-   File preview and validation

-   Max file size: 5MB, image only

Backend: `uploadMiddleware.js`

-   Dynamically creates `uploads/avatars/` subfolder

-   Uses user ID for filename (e.g., `user123_avatar.jpg`)

-   Updates both `User.avatarUrl` and `Profile` table

* * * * *

🌓 Dark Mode Implementation
---------------------------

### ThemeContext

javascript

// context/ThemeContext.jsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    document.documentElement.setAttribute('data-theme', newDarkMode ? 'dark' : 'light');
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

### CSS Variables

css

/* Light theme (default) */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #fafafa;
  --text-primary: #262626;
  --text-secondary: #8e8e8e;
  --border-color: #dbdbdb;
}

/* Dark theme */
[data-theme="dark"] {
  --bg-primary: #000000;
  --bg-secondary: #121212;
  --text-primary: #ffffff;
  --text-secondary: #a8a8a8;
  --border-color: #333333;
}

* * * * *

☁️ Cloudinary Integration for Persistent Storage
------------------------------------------------

### Problem

Images only loaded on laptop where they were uploaded --- photos didn't persist across devices.

### Solution

Integrated Cloudinary cloud storage for all media uploads.

### Configuration

env

# .env
CLOUDINARY_CLOUD_NAME="dnkxekfox"
CLOUDINARY_API_KEY="252312698113385"
CLOUDINARY_API_SECRET="RLBEstjDlaZX8gPgeZwubHwJko8"

### Upload Middleware

javascript

// server/middleware/uploadMiddleware.js
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Different storage for different types
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'instagram/posts',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'mp4'],
    transformation: [{ width: 1080, crop: 'limit' }]
  }
});

const avatarStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'instagram/avatars',
    allowed_formats: ['jpg', 'png', 'jpeg', 'gif'],
    transformation: [{ width: 300, height: 300, crop: 'fill' }]
  }
});

### Local Fallback

If Cloudinary credentials are missing, automatically falls back to local disk storage (`server/uploads/`).

* * * * *

🔍 Search Page Implementation
-----------------------------

### Features

-   Responsive layout: Desktop sidebar + main content | Mobile full screen

-   Debounced search (300ms delay)

-   Recent searches saved to localStorage

-   Category chips: IGTV, Shop, Style, Decor, Beauty

-   Desktop tabs: Top, Accounts, Audio, Tags

-   Query-result caching

-   Infinite scroll for post grid

### Components

text

client/src/components/search/
├── SearchBar.jsx
├── RecentSearches.jsx
├── SearchFilters.jsx
├── SearchResults.jsx
├── UserResultCard.jsx
└── HashtagResultCard.jsx

### API Endpoint

javascript

GET /api/search?q={query}&type={all|users|hashtags|posts|audio}

Searches:

-   Users by username, profile name, and profile bio

-   Hashtags from post captions

-   Posts by caption/location

-   Audio from story audio metadata

* * * * *

🌱 Database Seeding
-------------------

### Seed File (`server/prisma/seed.js`)

Generates realistic test data:

| Entity | Amount | Data Generated |
| --- | --- | --- |
| Users | 20 | Username, email, password, avatar, bio |
| Profiles | 20 | Name, website, phone, action buttons |
| Follows | ~150 | Random follow relationships |
| Hashtags | 15 | Popular hashtags |
| Locations | 15 | Cities with coordinates |
| Posts | 50-100 | Images, captions with hashtags/mentions, locations |
| Comments | ~200 | Random comments on posts |
| Likes | ~500 | Random likes on posts |
| Saved Posts | ~100 | Bookmarks per user |
| Stories | ~30 | With audio metadata |
| Highlights | ~5 | Story collections |

### Run Commands

bash

npm run seed          # Seed database
npm run db:reset      # Reset and seed

* * * * *

📱 Responsive Navbar
--------------------

### Logo Fix

Problem: Logo got cut off when screen was flexed/resized.

Solution:

css

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: fit-content;
  padding-right: 16px;
}

/* On smaller screens, show only icon */
@media (max-width: 768px) {
  .logoText {
    display: none;
  }
}

### Navbar Search

Real-time search dropdown for:

-   Users

-   Hashtags

-   Posts

-   Locations

Routes results to the appropriate page.

* * * * *

🔘 Follow Button Component
--------------------------

### Shared Component (`FollowButton.jsx`)

Replaces duplicate follow controls across:

-   Profile header

-   Sidebar

-   Search results

-   Followers/Following modals

Keeps follower count in sync across all instances.

* * * * *

🏷️ Hashtag Page
----------------

### Route

`/hashtag/:tag`

### Features

-   Displays all posts with that hashtag

-   Shows post count

-   Infinite scroll

-   Responsive grid layout

### API

javascript

GET /api/hashtags/:name
GET /api/hashtags/:name/posts

* * * * *

📚 Stories Archive
------------------

### Page

`/archive` - Shows user's expired stories grouped by date

### Features

-   Stories grouped by date (27 Apr 2026, 26 Apr 2026, etc.)

-   Click to view archived story

-   Create highlight from archived stories

* * * * *

✅ Environment Variables
-----------------------

### Frontend (`.env`)

env

VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_CLIENT_URL=http://localhost:5173
VITE_APP_NAME=Instagram Clone

VITE_ENABLE_AI_GENERATION=true
VITE_ENABLE_REELS=true
VITE_ENABLE_STORIES=true
VITE_ENABLE_MESSAGES=true

VITE_CLOUDINARY_CLOUD_NAME="dnkxekfox"
VITE_CLOUDINARY_UPLOAD_PRESET="ml_default"

### Backend (`.env`)

env

# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://neondb_owner:password@ep-host-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Auth
JWT_SECRET="your-jwt-secret-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# Node Environment
NODE_ENV="development"

# AI Services
HUGGINGFACE_API_TOKEN="hf_..."
GEMINI_API_KEY="AIzaSy..."

# Cloud Storage
CLOUDINARY_CLOUD_NAME="dnkxekfox"
CLOUDINARY_API_KEY="252312698113385"
CLOUDINARY_API_SECRET="RLBEstjDlaZX8gPgeZwubHwJko8"

# Optional
RESEND_API_KEY="re_..."
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

* * * * *

🚀 Quick Start Commands
-----------------------

bash

# Install dependencies
cd client && npm install
cd ../server && npm install

# Run migrations
cd server && npx prisma generate
npx prisma migrate dev --name init

# Seed database
npm run seed

# Start development servers
cd client && npm run dev    # http://localhost:5173
cd server && npm run dev    # http://localhost:5000

* * * * *

📝 Key Architectural Patterns
-----------------------------

1.  Client-Server Separation: React/Vite frontend + Express/Prisma backend

2.  RESTful API: Consistent endpoint structure with proper HTTP methods

3.  Component Reusability: Shared components (FollowButton, SafeImage) across pages

4.  Portal-based Modals: Using `createPortal` to escape DOM constraints

5.  Fire-and-Forget Notifications: Non-critical operations don't block responses

6.  Fallback Storage: Cloudinary with local disk fallback

7.  Context-based Theme: Global dark mode with localStorage persistence

8.  In-Memory Cache: For development without database

9.  Debounced Search: 300ms delay to reduce API calls

10. Optimistic UI Updates: Local state updates before API confirms

* * * * *

🔧 Common Fixes & Troubleshooting
---------------------------------

### "Posts not showing on profile"

-   Check that `Post.authorId` matches user ID

-   Verify `Post.isArchived` is false

-   Run `npm run seed` to populate test data

### "Images not loading on different laptop"

-   Cloudinary credentials missing → add to `.env`

-   Or use local fallback (auto-detected)

### "Modal not closing / body scroll stuck"

-   Check `overflow: hidden` cleanup in useEffect

-   Ensure modal uses `createPortal`

-   Split scroll lock and keyboard handlers into separate effects

### "Comment not posting / request hangs"

-   Check try/catch with `next(err)` pattern

-   Verify fire-and-forget for notifications

-   Check loading state finally block

### "Dark mode not persisting"

-   Verify ThemeProvider wraps app

-   Check localStorage read/write

-   Confirm CSS variables are applied at root level

* * * * *

📚 Related Documentation
------------------------

-   [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

-   [React Portal API](https://react.dev/reference/react-dom/createPortal)

-   [Cloudinary Node.js SDK](https://cloudinary.com/documentation/node_integration)

-   [Multer Middleware](https://github.com/expressjs/multer)

-   [Express.js Routing](https://expressjs.com/en/guide/routing.html)

-   [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

text

---

Save this as `INSTAGRAM_CLONE_DOCS.md` in your VS Code project for easy reference!