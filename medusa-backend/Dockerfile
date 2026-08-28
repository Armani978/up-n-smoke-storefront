FROM node:22-bookworm-slim AS dependencies

WORKDIR /server

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm install --global npm@11.12.1 \
  && npm ci

FROM node:22-bookworm-slim AS builder

WORKDIR /server

# `medusa build` loads medusa-config.ts, but runtime signing secrets must not
# enter the image build context. The final stage restores production mode and
# enforces those secrets when the server actually boots.
ENV NODE_ENV=development

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

COPY docker-entrypoint.sh /usr/local/bin/upnsmoke-medusa-entrypoint
RUN chmod +x /usr/local/bin/upnsmoke-medusa-entrypoint

EXPOSE 9000

ENTRYPOINT ["/usr/local/bin/upnsmoke-medusa-entrypoint"]
