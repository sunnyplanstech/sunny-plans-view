# Project Overview

This is a React project bootstrapped with Vite and written in TypeScript. It leverages `shadcn-ui` for UI components and Tailwind CSS for styling, following a modern web development stack. The project appears to be a landing page or marketing site for a service focused on geo-analytics for renewable energy, specifically for finding substation-ready land for BESS (Battery Energy Storage Systems) and solar projects.

## Technologies Used

*   **Framework:** React
*   **Build Tool:** Vite
*   **Language:** TypeScript
*   **UI Library:** shadcn-ui
*   **Styling:** Tailwind CSS
*   **Routing:** React Router DOM
*   **State Management/Data Fetching:** React Query

## Building and Running

The project uses `npm` for package management.

*   **Install Dependencies:**
    ```bash
    npm install
    ```
*   **Start Development Server:**
    ```bash
    npm run dev
    ```
    This will start a development server, usually accessible at `http://localhost:8080`.
*   **Build for Production:**
    ```bash
    npm run build
    ```
    This command compiles the project into static assets for deployment.
*   **Build for Development (with development mode):**
    ```bash
    npm run build:dev
    ```
*   **Lint Code:**
    ```bash
    npm run lint
    ```
    This command runs ESLint to check for code quality and style issues.
*   **Preview Production Build:**
    ```bash
    npm run preview
    ```
    This command serves the production build locally for testing.

## Development Conventions

*   **Component Structure:** Components are organized in the `src/components` directory, with `ui` sub-directory for shadcn-ui components.
*   **Page Structure:** Main pages are located in `src/pages`.
*   **Path Aliases:** The `@` alias is configured to point to the `src` directory, simplifying imports (e.g., `@/components/Hero`).
*   **Styling:** Tailwind CSS is used extensively for styling, with custom colors, gradients, and shadows defined in `tailwind.config.ts`.
*   **Routing:** `react-router-dom` is used for client-side routing.
*   **State Management:** `react-query` is used for data fetching and caching.
*   **Linting:** ESLint is configured for code quality checks.

## Project Structure

```
.
├── public/                 # Static assets
├── src/                    # Source code
│   ├── App.tsx             # Main application component and routing setup
│   ├── main.tsx            # Entry point of the React application
│   ├── index.css           # Global CSS
│   ├── components/         # Reusable React components
│   │   ├── ui/             # shadcn-ui components
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions (e.g., `utils.ts`)
│   └── pages/              # Page-level components (e.g., `Index.tsx`, `NotFound.tsx`)
├── package.json            # Project dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── eslint.config.js        # ESLint configuration
└── README.md               # Project README
```
