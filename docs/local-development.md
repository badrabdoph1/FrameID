# FrameID Local Development

## Database

The app needs PostgreSQL before signup, login, dashboards, and admin pages can work.

Use this local URL in `.env`:

```env
DATABASE_URL="postgresql://frameid:frameid@localhost:5432/frameid"
```

Start the database:

```bash
docker compose up -d postgres
```

Create tables and seed the platform:

```bash
npm run db:deploy
```

Then start the app:

```bash
npm run dev
```

If signup or login shows a database connection message, PostgreSQL is not running or `DATABASE_URL` does not match the running database.
