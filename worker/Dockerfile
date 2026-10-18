FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
COPY web/package.json ./web/package.json
COPY worker/package.json ./worker/package.json
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

COPY worker ./worker
COPY storage ./storage

CMD ["npm", "run", "start", "--workspace", "worker"]
