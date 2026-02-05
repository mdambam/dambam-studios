# Dambam Studios AI

A modern, responsive SaaS frontend for AI image enhancement, upscaling, and generation built with Next.js 16, React 19, and Tailwind CSS.

## Project Structure

- **`app/`** - Next.js App Router pages and layouts
  - `page.tsx` - Landing page
  - `login/`, `signup/` - Authentication pages
  - `dashboard/` - Main dashboard
  - `enhance/`, `upscale/`, `generate/` - Feature pages
  - `history/`, `billing/`, `account/` - User management
  - `admin/` - Admin panel (restricted to admin users)

- **`components/`** - Reusable React components
  - `protected-route.tsx` - Route protection wrapper
  - `sidebar.tsx` - Navigation sidebar
  - `upload-card.tsx` - Drag & drop image upload
  - `slider-set.tsx` - Slider controls
  - `style-randomizer.tsx` - Style selector with randomization

- **`lib/`** - Utility functions and contexts
  - `auth-context.tsx` - Authentication state management
  - `types.ts` - TypeScript interfaces
  - `prompt-helper.ts` - Prompt composition and image conversion
  - `styles-list.ts` - 50+ predefined AI styles

## Features

✨ **Enhance** - Improve photo quality and apply AI styles
⬆️ **Upscale** - Increase resolution up to 4x
🎨 **Generate** - Create images from text descriptions
📚 **History** - View and manage past generations
💳 **Billing** - Credit purchases and subscription management
👤 **Account** - User profile and settings
⚙️ **Admin Panel** - User and content management

## Getting Started

### Installation

\`\`\`bash
# Clone or download the project
# Then run from the project directory:

npm install
# or
yarn install
# or
pnpm install
\`\`\`

### Running Locally

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Backend Integration

### API Endpoints

Replace `https://<YOUR_BACKEND_DOMAIN>` with your actual backend domain in the following endpoints:

#### Authentication
- `POST /api/auth/login` - Login user
- `POST /api/auth/signup` - Register new user

#### Image Processing
- `POST /api/enhance-image` - Enhance an image
  - Request: `{ image: "<base64>", prompt: "<prompt>", styleName: "<style>", sliders: {...} }`
  - Response: `{ status: "success", enhancedImage: "<base64 or URL>" }`

- `POST /api/generate` - Generate image from text
  - Request: `{ prompt: "<description>" }`
  - Response: `{ status: "success", image: "<base64 or URL>" }`

- `POST /api/upscale` - Upscale image resolution
  - Request: `{ image: "<base64>", factor: 2 | 4 }`
  - Response: `{ status: "success", image: "<base64 or URL>" }`

#### Payments
- `POST /api/checkout` - Initialize payment for credits
  - Request: `{ credits: number }`
  - Response: `{ status: "success", checkoutUrl: "<URL>" }`

### Image Conversion

The app includes a helper function to convert images to base64:

\`\`\`typescript
import { imageToBase64 } from '@/lib/prompt-helper'

const file = // ... File object from upload
const base64 = await imageToBase64(file)
\`\`\`

### Prompt Composition

The app automatically composes comprehensive prompts:

\`\`\`typescript
import { composeFinalPrompt } from '@/lib/prompt-helper'

const finalPrompt = composeFinalPrompt(
  stylePrompt,     // e.g., "Cyberpunk aesthetic..."
  userPrompt,      // e.g., "Professional lighting..."
  sliders,         // { realism: 50, stylization: 50, ... }
  faceDirection,   // "forward" | "left" | "right" | "three_quarters"
  keepAppearance   // boolean
)
\`\`\`

## Authentication

The app uses a context-based authentication system:

\`\`\`typescript
import { useAuth } from '@/lib/auth-context'

export function MyComponent() {
  const { user, login, signup, logout } = useAuth()
  // ... use auth functions
}
\`\`\`

User data is stored in localStorage for persistence.

## Styles

50 predefined AI styles are included:

- Cyberpunk, Studio Ghibli, Hyper-Realistic Portrait
- Film Noir, Watercolor, Fashion Editorial
- Oil Painting, Anime, Renaissance Portrait
- Sketch, Pop Art, Vintage Film
- Street Photography, Black & White, Manga
- And 35+ more...

Use the "Randomize" button to randomly select a style.

## Admin Panel

Access the admin panel at `/admin` (requires `user.role === 'admin'`):

- **Users** - View, edit, and manage user accounts
- **Images Log** - View all generated and enhanced images
- **Subscriptions** - Manage subscription plans

To promote a user to admin, update their `role` field to `"admin"`.

## Environment Variables

While this is a frontend-only app, if you need to add environment variables (e.g., for a backend):

1. Add them to your Vercel project settings or `.env.local`
2. Prefix with `NEXT_PUBLIC_` to use them in the browser

Example:
\`\`\`
NEXT_PUBLIC_BACKEND_URL=https://your-backend.com
\`\`\`

## Styling

The app uses Tailwind CSS v4 with custom design tokens defined in `globals.css`:

- **Colors**: Light neutral palette with blue accents
- **Typography**: Geist font family
- **Spacing**: 0.625rem (10px) base unit
- **Components**: shadcn/ui compatible

## Performance

- Next.js 16 with Turbopack (default bundler)
- React 19 with Server Components support
- Client-side routing and state management
- Lazy-loaded components and images

## Deployment

Deploy to Vercel with one click:

\`\`\`bash
npm run build
vercel deploy
\`\`\`

Or connect your GitHub repo to Vercel for automatic deployments.

## Future Enhancements

- [ ] Batch image processing
- [ ] Custom style creation
- [ ] Advanced editing tools
- [ ] API key for programmatic access
- [ ] Webhook support
- [ ] Real-time collaboration

## Support

For issues or questions, open an issue or contact support.

---

Built with ❤️ using Next.js, React, and Tailwind CSS.
