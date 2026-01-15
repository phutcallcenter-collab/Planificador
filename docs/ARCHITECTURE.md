# Architecture Documentation

## 1. Overview
This application is a Client-Side Single Page Application (SPA) built with Next.js, optimized for local operation but architected to support future backend integration.

## 2. Persistence Layer
The application uses a **Strategy Pattern** to handle data persistence, decoupling the domain logic from the storage mechanism.

### Key Components
- **PersistenceAdapter Interface**: Defines the contract (`loadState`, `saveState`).
- **LocalStorageAdapter**: (Default) implementations using IndexedDB for robust local storage capabilities. Uses `idb` library.
- **HttpAdapter**: (Optional) implementation that communicates with a generic HTTP API.
- **Persistence Factory**: `src/application/persistence/index.ts` selects the active adapter based on `NEXT_PUBLIC_BACKEND_URL`.

### Data Flow
`Store` -> `storage.ts` (Integrity Check) -> `persistence` (Adapter) -> `IndexedDB` or `API`

### Backend Integration
To connect a backend:
1. set `NEXT_PUBLIC_BACKEND_URL` in `.env`.
2. Ensure the backend implements:
    - `GET /state` -> Returns full JSON state.
    - `POST /state` -> Accepts full JSON state.
3. No code changes required in the frontend.

## 3. State Management
- **Zustand**: Used for global state management.
- **Immer**: Used for immutable state updates.
- **Domain-Driven**: Logic resides in `src/domain`, not in UI components.

## 4. Operational Logic
- **Effective Periods**: Absolute priority over base schedules.
- **Resolvers**: Jerarchical logic (Period > Date > DayOfWeek > Global).
