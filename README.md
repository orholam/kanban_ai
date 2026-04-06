# **Kanban AI** 🤖

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)

**Transform your side projects from ideas to reality with AI-assisted project management.**

Kanban AI is your personal AI-powered project companion that helps you build, track, and complete your side projects with intelligent guidance. Whether you're a developer looking to showcase new skills, an entrepreneur building your next SaaS, or a creator bringing ideas to life, Kanban AI provides the structure and support you need.

## ✨ **Key Features**

### 🎯 **AI-Powered Project Planning**
- **Smart Project Breakdown**: Describe your idea and let AI create a comprehensive 10-week development plan
- **Personalized Roadmaps**: Tailored to your skills, tech stack, and learning goals
- **Intelligent Task Generation**: AI creates specific, actionable tasks for each development phase

### 📊 **Intelligent Progress Tracking**
- **Adaptive Planning**: AI adjusts your roadmap based on your actual progress
- **Smart Recommendations**: Get personalized suggestions when you're ahead or behind schedule
- **Progress Analytics**: Visual insights into your development journey

### 🎨 **Modern Kanban Interface**
- **Drag-and-Drop Management**: Intuitive task organization with visual kanban boards
- **Real-time Updates**: Seamless collaboration and progress tracking
- **Dark/Light Mode**: Beautiful interface that adapts to your preferences

### 🤖 **AI Assistant Integration**
- **Contextual Guidance**: Ask questions and get project-specific advice
- **Roadblock Resolution**: AI helps you overcome technical challenges
- **Learning Support**: Get explanations and resources for new technologies

## 🚀 **Getting Started**

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account (for backend functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/orholam/kanban_ai.git
   cd kanban_ai
   ```

2. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set up environment variables**
   Create a `.env` file in the frontend directory (only Supabase keys are exposed to the browser via `VITE_*`):
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   LLM calls go through a Vercel serverless route at `/api/openai`, which uses a **server-only** `OPENAI_API_KEY` (never prefix it with `VITE_` — that would bundle the key into client JavaScript).

5. **Run the app locally (frontend + LLM API)**

   The Vite dev server proxies `/api` to a local Vercel dev process ([`frontend/vite.config.ts`](frontend/vite.config.ts)).

   - In one terminal, from `frontend/`:
     ```bash
     npx vercel dev --listen 3000
     ```
     Ensure `OPENAI_API_KEY` is available there (e.g. `frontend/.env`, Vercel-linked project env, or `export OPENAI_API_KEY=...`).

   - In another terminal, from `frontend/`:
     ```bash
     npm start
     ```

   The UI will be at `http://localhost:5173`. Without `vercel dev` on port 3000, AI features that hit `/api/openai` will not work locally.

6. **Deploying on Vercel**

   Add `OPENAI_API_KEY` in the Vercel project’s Environment Variables (Production and Preview as needed). The [`frontend/api/openai.ts`](frontend/api/openai.ts) handler reads it at runtime; no OpenAI key belongs in client env vars.

## 🏗️ **Tech Stack**

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI Integration**: OpenAI GPT-4
- **State Management**: React Context + Hooks
- **Routing**: React Router v6
- **UI Components**: Lucide React Icons
- **Deployment**: Vercel

## 📁 **Project Structure**

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

## 🎯 **Use Cases**

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

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: [https://kanbanai.dev/docs](https://kanbanai.dev/docs)
- **Issues**: [GitHub Issues](https://github.com/orholam/kanban_ai/issues)
- **Discussions**: [GitHub Discussions](https://github.com/orholam/kanban_ai/discussions)

## 🙏 **Acknowledgments**

- Built with ❤️ using modern web technologies
- Powered by OpenAI's GPT-4 for intelligent project planning
- Hosted on Vercel for lightning-fast performance
- Styled with Tailwind CSS for beautiful, responsive design

---

**Ready to transform your side projects?** [Get started with Kanban AI](https://kanbanai.dev) today! 🚀