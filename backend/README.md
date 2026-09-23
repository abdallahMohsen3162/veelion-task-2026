## Installation Steps

1. Navigate to the backend folder `cd backend`
2. Install the dependencies `npm i`
3. Run the server `npm run start`

It will be available on `http://localhost:4000`.

The backend stores JSON data in `backend/data` regardless of the directory
from which the server is started. JSON mutations are serialized per file and
written through an atomic temporary-file replacement.

For browser access, `CORS_ORIGINS` accepts a comma-separated list of allowed
origins and defaults to `http://localhost:3000`. The in-memory GET cache can be
tuned with `CACHE_TTL_MS` and `MAX_CACHE_ENTRIES`.