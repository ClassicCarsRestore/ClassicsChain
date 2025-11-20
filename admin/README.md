# Admin - Classics Chain Admin Dashboard

## Tech Stack

- **Vite** - Next-generation frontend tooling
- **React 18** - UI library with TypeScript
- **React Router v6** - Client-side routing
- **Tailwind CSS v4** - Utility-first CSS framework (using @tailwindcss/vite plugin)
- **shadcn/ui** - Re-usable component library
- **TanStack Query** - Powerful data fetching and state management
- **Native Fetch API** - No Axios dependency

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── layout/          # Layout components (Navigation, RootLayout)
│   └── common/          # Shared components
├── features/            # Feature-based organization
│   └── users/           # Example feature module
│       ├── components/  # Feature-specific components
│       ├── api/         # API client functions
│       ├── hooks/       # React Query hooks
│       └── types.ts     # TypeScript types
├── lib/
│   ├── api.ts          # Fetch wrapper with base configuration
│   └── utils.ts        # Utility functions (shadcn)
├── hooks/              # Global shared hooks
├── routes/             # Route definitions and pages
├── types/              # Global TypeScript types
├── App.tsx
└── main.tsx
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Environment Setup

Copy `.env.example` to `.env` and configure the API base URL:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_API_BASE_URL=http://localhost:3000/api
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Adding Features

To add a new feature module, follow the established pattern:

1. Create the feature directory structure:
   ```bash
   mkdir -p src/features/[feature-name]/{components,api,hooks}
   ```

2. Define types in `types.ts`
3. Create API functions in `api/`
4. Create React Query hooks in `hooks/`
5. Build components in `components/`

See `src/features/users/` for a complete example.

## Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

For example:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

## API Integration

The app uses a custom fetch wrapper in `src/lib/api.ts` that provides:

- Automatic base URL prefixing
- JSON serialization/deserialization
- Error handling with custom ApiError class
- Query parameter support
- Type-safe methods (get, post, put, patch, delete)

Example usage:

```typescript
import { api } from '@/lib/api';

// GET request
const users = await api.get<User[]>('/users');

// POST request
const newUser = await api.post<User>('/users', { name: 'John', email: 'john@example.com' });

// With query parameters
const filtered = await api.get<User[]>('/users', {
  params: { role: 'admin', active: true }
});
```

## Path Aliases

The project uses `@/*` as an alias for `src/*`:

```typescript
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useUsers } from '@/features/users/hooks/useUsers';
```
