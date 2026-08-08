FROM node:22-bookworm-slim AS dependencies

WORKDIR /server

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm install --global npm@11.12.1 \
  && npm ci

FROM node:22-bookworm-slim AS builder

WORKDIR /server

ENV NODE_ENV=production

COPY --from=dependencies /server/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner

WORKDIR /server

ENV NODE_ENV=production
ENV PORT=9000

COPY --from=builder /server/.medusa/server/package.json /server/.medusa/server/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm install --global npm@11.12.1 \
  && npm ci --omit=dev

COPY --from=builder /server/.medusa/server ./

EXPOSE 9000

CMD ["npm", "run", "start"]
