# Autonomous Code Wizard (Fixed Version)

## Project Overview

The **Autonomous Code Wizard** is a full-stack web application designed to help developers write better code through static analysis and automated fixing suggestions. This version is a "fixed" implementation that replaces dependency on external Supabase Edge Functions with a local Node.js/Express backend, ensuring full functionality in a local development environment.

**Key Features:**
*   **Manual Code Analysis:** Users can paste code to receive detailed issue reports (errors, warnings, suggestions) and auto-fixed versions.
*   **Repository Integration:** Mock implementation for connecting GitHub repositories and analyzing their contents.
*   **Issue Reporting:** Categorized issues with severity levels, line numbers, and descriptions.
*   **Automated Fixing:** Logic to automatically correct common issues like `var` usage, missing semicolons, and loose equality.

**Architecture:**
*   **Frontend:** React (Vite), TypeScript, Tailwind CSS, Shadcn UI, React Query.
*   **Backend:** Node.js with Express (serving as a replacement for Supabase functions).
*   **API Protocol:** REST (endpoints match original Supabase function paths).

## Building and Running

### Prerequisites
*   Node.js (v18+ recommended)
*   npm

### Installation
1.  Install dependencies:
    ```bash
    npm install
    ```

### Local Development
To run the full application locally, you need to start both the backend and frontend servers in separate terminals.

1.  **Start the Backend Server:**
    Runs on `http://localhost:3001`
    ```bash
    npm run server
    ```
    *API Endpoints:*
    *   `POST /functions/v1/analyze-code`
    *   `POST /functions/v1/fetch-repo`
    *   `POST /functions/v1/push-fixes`

2.  **Start the Frontend Development Server:**
    Runs on `http://localhost:8080` (or similar)
    ```bash
    npm run dev
    ```

### Production Build
1.  **Build Frontend:**
    ```bash
    npm run build
    ```
    Output is generated in the `dist` directory.

2.  **Run Production Backend:**
    ```bash
    npm run server-prod
    ```

## Development Conventions

*   **Language:** TypeScript for frontend (`src`), JavaScript for backend (`server.js`).
*   **Styling:** Tailwind CSS with utility classes.
*   **UI Components:** Shadcn UI (located in `src/components/ui`).
*   **State Management:** React Query (`@tanstack/react-query`) for data fetching.
*   **Path Aliases:** Use `@` to import from the `src` directory (e.g., `import { Button } from "@/components/ui/button"`).
*   **Linting:** ESLint is configured for code quality checks (`npm run lint`).
*   **Formatting:** Prettier (inferred from codebase style, though explicit config not seen).
*   **Backend Logic:** The core analysis logic is currently contained within `server.js`. Future improvements should modularize this.

## Key Files & Directories

*   `server.js`: The main backend application file containing API logic and code analysis algorithms.
*   `src/App.tsx`: Main frontend application component.
*   `src/pages/Index.tsx`: The primary dashboard page.
*   `src/components/CodeEditor.tsx`: Component for the manual code input and analysis display.
*   `src/integrations/supabase/client.ts`: Supabase client configuration (modified/used for context).
*   `vite.config.ts`: Vite configuration file.
*   `package.json`: Project dependencies and scripts.
