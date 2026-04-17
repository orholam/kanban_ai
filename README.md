# **Kanban AI** 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

**Transform your side projects from ideas to reality with AI-assisted project management.**

Kanban AI is your personal AI-powered project companion that helps you build, track, and complete your side projects with intelligent guidance. Whether you're a developer looking to showcase new skills, an entrepreneur building your next SaaS, or a creator bringing ideas to life, Kanban AI provides the structure and support you need.

##  **Key Features**

###  **AI-Powered Project Planning**
- **Smart Project Breakdown**: Describe your idea and let AI create a comprehensive 10-week development plan
- **Personalized Roadmaps**: Tailored to your skills, tech stack, and learning goals
- **Intelligent Task Generation**: AI creates specific, actionable tasks for each development phase

###  **Intelligent Progress Tracking**
- **Adaptive Planning**: AI adjusts your roadmap based on your actual progress
- **Smart Recommendations**: Get personalized suggestions when you're ahead or behind schedule
- **Progress Analytics**: Visual insights into your development journey

###  **Modern Kanban Interface**
- **Drag-and-Drop Management**: Intuitive task organization with visual kanban boards
- **Real-time Updates**: Seamless collaboration and progress tracking
- **Dark/Light Mode**: Beautiful interface that adapts to your preferences

###  **AI Assistant Integration**
- **Contextual Guidance**: Ask questions and get project-specific advice
- **Roadblock Resolution**: AI helps you overcome technical challenges
- **Learning Support**: Get explanations and resources for new technologies

##  **Getting Started**

**Requirements:** Node.js 18+, npm, and an [OpenAI API key](https://platform.openai.com/api-keys) if you want AI features.

### Run locally (recommended for contributors)

One SQLite database under `.local/` (gitignored), no Supabase account, no sign-in. The app talks to a small local API on port **3000**; Vite proxies `/api` there ([`frontend/vite.config.ts`](frontend/vite.config.ts)).

```bash
git clone https://github.com/orholam/kanban_ai.git
cd kanban_ai/frontend
npm install
cp env.local.example .env.local
```

Edit `.env.local`: set **`OPENAI_API_KEY`** to your key. Leave **`VITE_LOCAL_MODE=true`** as in the example.

```bash
npm run dev:local
```

Open **http://localhost:5173**.

- Do **not** put `OPENAI_API_KEY` behind the `VITE_` prefix (that would ship it to the browser). The dev server reads it from `.env.local`.
- First run applies [`frontend/scripts/local-schema.sql`](frontend/scripts/local-schema.sql). Account, hosted analytics, and in-app feedback are disabled in this mode (they need Supabase).

### Supabase + Vercel-style API (production-like)

Use this when you need real auth and cloud data.

1. In `frontend/.env.local` (or `.env`): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and **`VITE_LOCAL_MODE`** removed or not `true`.
2. Same **`OPENAI_API_KEY`** as above for `/api/openai`.
3. Two terminals from `frontend/`: `npx vercel dev --listen 3000` then `npm start`. UI: **http://localhost:5173**.

---

### Deploying on Vercel

Add `OPENAI_API_KEY` in the Vercel project’s Environment Variables (Production and Preview as needed). The [`frontend/api/openai.ts`](frontend/api/openai.ts) handler reads it at runtime; no OpenAI key belongs in client env vars.

The app uses code-splitting; [`frontend/vercel.json`](frontend/vercel.json) sets long-lived caching for hashed `/assets/*` files and revalidation for HTML responses so open tabs pick up a fresh `index.html` after deploys. Lazy routes also retry once with a reload if a chunk fails to load (stale shell).

##  **Tech Stack**

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI Integration**: OpenAI GPT-4
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **UI Components**: Lucide React Icons
- **Deployment**: Vercel

### Owner: product analytics & landing A/B

The owner-only `/analytics` view includes landing page A/B results. Bump **`LANDING_AB_TEST_VERSION`** in [`frontend/src/lib/landingAbTest.ts`](frontend/src/lib/landingAbTest.ts) whenever you materially change variant A or B so new traffic is tagged separately and the dashboard does not blend runs.

##  **Project Structure**

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   ├── lib/                # Utility libraries
│   ├── types/              # TypeScript type definitions
│   ├── api/                # API integration
│   └── assets/             # Static assets
├── public/                 # Public assets
└── package.json
```

##  **Use Cases**

### For Developers
- **Skill Showcase**: Build projects that demonstrate new technologies
- **Portfolio Enhancement**: Create impressive side projects for your resume
- **Learning Path**: Structured approach to mastering new frameworks

### For Entrepreneurs
- **MVP Development**: Rapidly prototype and validate business ideas
- **Product Roadmap**: AI-guided development planning
- **Market Testing**: Build and iterate quickly

### For Creators
- **Project Organization**: Keep creative projects on track
- **Goal Achievement**: Break down complex projects into manageable tasks
- **Progress Visualization**: See your creative journey unfold

##  **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

##  **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  **Support**

- **Documentation**: [https://kanbanai.dev/docs](https://kanbanai.dev/docs)
- **Issues**: [GitHub Issues](https://github.com/orholam/kanban_ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/orholam/kanban_ai/discussions)


- Hosted on Vercel for lightning-fast performance
- Styled with Tailwind CSS for beautiful, responsive design

---
