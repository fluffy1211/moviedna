# 🎬 MovieDNA

**Discover your unique movie profile** - A modern web application that analyzes your movie preferences and creates your personalized cinematic DNA.

![Next.js](https://img.shields.io/badge/Next.js-15.3.0-black?style=flat&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=flat&logo=typescript)
![Prisma](https://img.shields.io/badge/Prisma-5.19-green?style=flat&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue?style=flat&logo=postgresql)

## 🎯 What is MovieDNA?

MovieDNA is a personalized movie discovery platform that helps you understand your unique movie tastes and find your next favorite film. Through an intelligent quiz system, the application analyzes your preferences across genres, moods, eras, and rating standards to create a comprehensive "movie DNA" profile.

**🎮 How it works:**
1. **Take the Quiz** - Answer questions about your genre preferences, mood preferences, favorite movie eras, and rating standards
2. **Get Your Profile** - Receive a personalized MovieDNA analysis based on your responses
3. **Discover Movies** - Get tailored movie recommendations that match your unique taste profile
4. **Build Your Collection** - Save movies to your personal watchlist and rate them as you watch

Perfect for movie enthusiasts who want to discover new films that truly match their taste, or anyone looking to explore cinema in a more personalized way.

### ✨ Key Features
- **🧬 Personalized Quiz System**: Intelligent questions covering movie genres, mood preferences, favorite eras, and rating standards
- **🔐 Secure Authentication**: Easy sign-in with Google OAuth for a seamless experience
- **🎭 Unique MovieDNA Profile**: Get a comprehensive analysis of your cinematic preferences and taste profile
- **🎯 Smart Movie Recommendations**: Receive curated movie suggestions powered by The Movie Database (TMDB) API
- **📚 Personal Movie Collection**: Build and manage your watchlist, rate movies, and track your viewing history
- **💾 Persistent Data**: Your quiz results and movie preferences are saved to your profile
- **📱 Responsive Design**: Beautiful, modern interface that works perfectly on all devices

## 🚀 Getting Started (For Users)

1. **Visit the Website** - Navigate to the MovieDNA application
2. **Sign In** - Use your Google account for quick and secure authentication
3. **Set Your Username** - Choose a unique username for your profile
4. **Take the Quiz** - Answer 4 simple questions about your movie preferences:
   - Select your favorite genres (3-5 recommended)
   - Choose your typical movie-watching mood
   - Pick your preferred movie eras
   - Set your rating preferences
5. **Get Your Results** - View your personalized MovieDNA profile and movie recommendations
6. **Build Your Collection** - Add recommended movies to your watchlist and rate movies you've watched

The entire process takes just a few minutes and provides you with a comprehensive understanding of your movie taste profile!

## 🏗️ Project Architecture

```
src/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes (NextAuth, TMDB, User)
│   ├── auth/                 # Authentication pages
│   ├── quiz/                 # Quiz and results pages
│   ├── profile/              # User profile page
│   └── layout.tsx            # Root layout
├── components/               # Reusable components
│   ├── auth/                 # Authentication components
│   ├── quiz/                 # Quiz-specific components
│   ├── profile/              # Profile components
│   └── ui/                   # Base UI components
├── lib/                      # Utilities and configurations
│   ├── auth.ts               # NextAuth configuration
│   ├── constants.ts          # App constants
│   ├── types.ts              # TypeScript definitions
│   └── utils.ts              # Helper functions
├── hooks/                    # Custom React hooks
├── public/                   # Static assets
└── ...configs                # Configuration files
```

## 🛠️ Installation and Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL
- Google Cloud account (for OAuth)

### 1. Install dependencies
```bash
npm install
```

### 2. Database setup
```bash
# Create and configure your PostgreSQL database
# Copy .env.example to .env.local
cp .env.example .env.local
```

### 3. Environment variables (.env.local)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/moviedna"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 4. Database setup
```bash
# Generate Prisma client
npx prisma generate

# Apply migrations
npx prisma db push

# (Optional) Open Prisma Studio
npm run db
```

### 5. Run in development
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 🔧 Improvements Made

### ✅ Fixed Bugs
- **Authentication Flow**: Fixed NextAuth callback returning URL instead of boolean
- **Navigation**: Replaced `<a>` tags with Next.js `<Link>` components
- **Error Handling**: Added Error Boundary for runtime error management
- **Session Management**: Improved user session handling

### 🏗️ Improved Structure
- **Centralized Auth**: Authentication configuration in `/lib/auth.ts`
- **TypeScript Types**: Centralized definitions in `/lib/types.ts`
- **Constants**: Configuration in `/lib/constants.ts`
- **Custom Hooks**: `useAuth` hook for authentication logic
- **Error Boundary**: Global error management

### 🎨 Enhanced UX/UI
- **Dynamic Header**: Conditional display based on authentication state
- **Loading States**: Loading states for better experience
- **Consistent Navigation**: Systematic use of Next.js components
- **Responsive Design**: Adaptive layout with Flexbox

## 📋 Features

### ✅ Implemented
- Google OAuth authentication
- User session management
- Responsive interface
- Navigation system
- Authentication pages
- Basic user profile

### 🚧 In Development
- MovieDNA quiz system
- Username configuration
- Profile generation algorithm
- Results and recommendations
- Quiz history

## 🚀 Available Scripts

```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint linting
npm run prettier     # Code formatting
npm run db           # Prisma Studio
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

## 📝 Technical Notes

### Architecture Choices
- **App Router**: Migration to new Next.js routing system
- **Server Components**: Optimized use of server/client components
- **Strict TypeScript**: Strict configuration for better code quality
- **Prisma**: Modern ORM with automatic type generation

### Security
- Environment variables for secrets
- Server-side validation with Zod
- Secure JWT sessions
- Built-in CSRF protection

## 📄 License

MIT - See LICENSE file for details.
