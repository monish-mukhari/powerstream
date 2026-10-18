# Reelhouse streaming MVP

A one-week-scope course video platform with direct uploads, background HLS encoding, object storage, and adaptive playback.

## Architecture

```text
Admin browser
  -> Next.js requests a presigned PUT URL
  -> browser uploads the raw file directly to MinIO/R2
  -> Next.js verifies the object and enqueues a BullMQ job
  -> Node worker downloads the source and runs FFmpeg
  -> worker uploads HLS playlists and segments
  -> Postgres video status becomes READY
  -> viewers stream the master playlist through MinIO/CDN with hls.js
```

Only `READY` videos are returned by public course pages.

## Stack

- `web/`: Next.js App Router, TypeScript, Tailwind and hls.js
- `worker/`: Node, TypeScript, BullMQ and FFmpeg
- Postgres with Prisma
- Redis with BullMQ
- S3-compatible storage through AWS SDK v3
- MinIO locally and Cloudflare R2 in production

## Local setup

Prerequisites: Node.js 22+, Docker with Compose, and npm.

1. Copy the environment file:

   ```bash
   cp .env.example .env
   ```

   On PowerShell:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Install dependencies and generate Prisma Client:

   ```bash
   npm install
   npm run db:generate
   ```

3. Start Postgres, Redis, MinIO, and the encoding worker:

   ```bash
   docker compose up -d --build
   ```

   `POSTGRES_PORT` and `REDIS_PORT` can be changed in `.env` if the default host ports are already occupied. Container-to-container ports do not change.

4. Create the database schema:

   ```bash
   npm run db:push
   ```

5. Start the web app:

   ```bash
   npm run dev:web
   ```

Open `http://localhost:3000`. Admin is at `http://localhost:3000/admin`; the default example password is `change-me`.

MinIO console is at `http://localhost:9001` with `minioadmin` / `minioadmin`.

The local MinIO image is reproducibly compiled from the pinned upstream community source tag because upstream no longer publishes community Docker images. The first build is slower; later starts use Docker's cache.

## Upload flow

The browser sends metadata to `/api/admin/videos/presign`. The server validates file type and size, reserves a UUID, and signs a single `PutObject` request. The browser uses `XMLHttpRequest` to PUT the file directly to object storage so upload progress is available. After PUT succeeds, the browser calls the completion endpoint. The server verifies the object with `HeadObject`, creates the `UPLOADED` database record, and enqueues the job.

The worker changes the status to `PROCESSING`, creates eligible 360p, 720p, and 1080p H.264/AAC renditions, uploads them under `videos/{videoId}/`, and sets `READY`. Renditions above the source height are skipped. Sources below 360p fail with a clear error.

Jobs have three total attempts: the first attempt plus two retries. Temporary files are removed in a `finally` block after every attempt.

## Testing adaptive playback

1. Sign into `/admin` and create a course.
2. Upload an MP4 that is at least 720p. A short test clip keeps encoding quick.
3. Watch the admin status change from `UPLOADED` to `PROCESSING` to `READY`.
4. Open the course from `/`, then open the lesson.
5. In Chrome DevTools, open **Network conditions** and choose **Slow 3G**.
6. Keep the quality selector on **Auto**. In DevTools Network, filter by `.ts`; hls.js should move to lower-resolution playlist segments.
7. Return to **No throttling** and seek forward. The player should move back to a higher level after bandwidth stabilizes.
8. Use the player quality dropdown to verify that manual 360p/720p/1080p selection works.

For a sample video, use any local MP4 you own, or create a ten-second 1080p test pattern if FFmpeg is installed locally:

```bash
ffmpeg -f lavfi -i testsrc2=size=1920x1080:rate=30 -f lavfi -i sine=frequency=1000 -t 10 -c:v libx264 -c:a aac sample.mp4
```

## Commands

```bash
npm run dev:web       # Next.js development server
npm run dev:worker    # Worker outside Docker (requires local FFmpeg)
npm run typecheck     # Web and worker TypeScript checks
npm test              # FFmpeg builder and playlist unit tests
npm run build         # Production web build and worker typecheck
npm run db:push       # Apply the schema without a migration file
```

## Production configuration

Replace every value in `.env`; use a strong random `ADMIN_SESSION_SECRET` and admin password. Point the S3 variables to R2 and `CDN_BASE_URL` to the public CDN/custom domain. See [docs/cdn.md](docs/cdn.md) for R2, MinIO, and CloudFront instructions.

## Deliberately out of scope

DRM, playback tokens, live streaming, subtitles, multiple audio tracks, analytics, comments, and user accounts.
