FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN rm -rf .next
RUN npx prisma generate
RUN npm run build

EXPOSE 8080
ENV PORT=8080

CMD ["sh", "-c", "npx prisma db push --accept-data-loss && (npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260711000000_add_missing_columns_for_push/migration.sql 2>&1 || true) && (npx prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260711000100_restore_dropped_columns/migration.sql 2>&1 || true) && npx tsx prisma/seed.ts && npm run start"]
