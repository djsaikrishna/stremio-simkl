# Stremio Simkl Watchlists Addon
Stremio addon to display your Simkl Watchlists.

## Install addon

[Install addon](https://stremio-simkl.malachi.io)


## Features

- Choose which Simkl catalogs to show + reorder support
- Sort each Simkl catalog by recently added, last watched, rating, year or title.
- Optional RPDB posters.


## Development

1. Create `.env` files inside the `backend` and `frontend` folders based on the `.env.example` files.

2. You will need a TMDB API key, an RPDB API key (optional), a Simkl app, and an encryption key and salt.

   - To create a Simkl app, visit: [Simkl Developer Settings](https://simkl.com/settings/developer/).
   - Generate `ENCRYPTION_KEY` and `ENCRYPTION_SALT` with `openssl rand -hex 32`.
   - Changing encryption key/salt invalidates existing install links.

3. Install dependencies for both the frontend and backend:

   ```sh
   npm run install
   ```

4. Start the development environment, which includes the Redis server, frontend, and backend:

   ```sh
   npm run dev
   ```

This will run the following commands concurrently:
- `start:redis`: Starts the Redis server using Docker Compose.
- `dev:frontend`: Starts the frontend development server.
- `dev:backend`: Starts the backend development server.



## Tech Stack

The backend is a simple and stateless express server that uses redis to cache the TMDB API responses.

The user configuration for the addon (Simkl user token) is encrypted using aes-192-cbc.



### Backend

- Typescript
- Node.js
- Express
- Redis (for caching)
- Prometheus (for metrics)
- Pino (structured logging)

### Frontend

- Typescript
- React
- Vite
- Zustand (state management)
- Sass
- React DnD (drag and drop)


## Contributing

Contributions are welcome!
if you have any suggestions or issues please open an issue or a pull request.
