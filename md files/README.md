# Saral GST. 

Next-Gen GST Compliance & Financial Intelligence Platform using AI and modern aesthetics.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Custom Glass Morphism + Bento Cards
- **Charts:** Recharts
- **Icons:** Lucide React

## Features

- 🎯 Role-based dashboards (SME & CA)
- 📊 Real-time ITC tracking and visualization
- 🤖 AI-powered GST compliance
- 🔔 Deadline Guardian notifications
- 📈 Financial analytics and reports
- 🎨 Modern dark UI with glass effects

## Run Locally

**Prerequisites:** Node.js 18+

1. **Clone the repository**
   ```bash
   git clone https://github.com/Satyavrat2005/SaralGST.git
   cd SaralGST
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

## Build for Production

```bash
npm run build
npm start
```

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Satyavrat2005/SaralGST)

### Manual Deployment

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your GitHub repository
4. Vercel will automatically detect Next.js
5. Add your environment variables
6. Click Deploy!

## Project Structure

```
saral-gst/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Landing page
│   ├── globals.css          # Global styles
│   ├── auth/
│   │   └── page.tsx         # Authentication
│   └── dashboard/
│       ├── layout.tsx       # Dashboard layout
│       ├── sme/             # SME Dashboard
│       └── ca/              # CA Dashboard
├── components/
│   ├── layout/
│   │   └── Sidebar.tsx      # Navigation
│   └── ui/
│       ├── BentoCard.tsx    # Card component
│       └── GlassPanel.tsx   # Glass panel
└── next.config.mjs          # Next.js config
```

## Available Routes

- `/` - Landing page
- `/auth` - Authentication
- `/dashboard/sme` - SME Dashboard
- `/dashboard/ca` - CA Dashboard

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | Yes |

## License

MIT
