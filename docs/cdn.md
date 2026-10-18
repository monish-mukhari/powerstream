# Putting a CDN in front of the HLS bucket

The application stores public HLS output under `videos/{videoId}/`. Raw uploads stay under `raw/` and should not be exposed through the CDN.

## Cloudflare R2

1. Create an R2 bucket and S3 API token with object read/write access.
2. Add a custom domain to the bucket in the R2 dashboard. Cloudflare serves that domain through its CDN automatically.
3. Apply `storage/cors.json`, replacing the localhost origin with the production web origin:

   ```bash
   npx wrangler r2 bucket cors set YOUR_BUCKET --file storage/cors.json
   ```

4. Set `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com` for API/worker access.
5. Set `S3_FORCE_PATH_STYLE=false` if required by your R2 endpoint configuration.
6. Set `CDN_BASE_URL=https://video.example.com` to the public custom domain.

Presigned uploads must use the R2 S3 API endpoint, not the custom CDN domain. Playback uses the custom domain.

## MinIO locally

`docker compose up` creates the bucket and makes it readable for local playback. This MinIO community release does not implement the S3 `PutBucketCors` operation, so Compose applies the origins from `storage/cors.json` through MinIO's equivalent global setting:

```bash
MINIO_API_CORS_ALLOW_ORIGIN=http://localhost:3000,http://localhost:3100
```

When changing the JSON origins, keep that Compose value in sync and recreate the `minio` service. Methods and headers are handled by MinIO's S3 API CORS middleware. R2 accepts the JSON file directly as shown above.

The local playback base is `http://localhost:9000/streaming`.

## Amazon S3 and CloudFront

1. Keep the S3 bucket private and create a CloudFront distribution with Origin Access Control.
2. Point the distribution origin at the bucket.
3. Allow `GET`, `HEAD`, and `OPTIONS` in the cache behavior.
4. Forward the `Origin` request header when browser CORS responses are needed.
5. Set `CDN_BASE_URL` to the CloudFront distribution or its custom domain.

The worker sets one-year immutable caching for `.ts` segments and a 60-second cache for `.m3u8` playlists. Configure the CDN to honor these origin headers.
