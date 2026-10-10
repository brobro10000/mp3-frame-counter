# Build the API independently with the exact project toolchain. No host output, tests or frontend enters the image.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS build
WORKDIR /build
COPY package.json package-lock.json tsconfig.json ./
RUN npm ci --ignore-scripts
COPY server/src ./server/src
RUN npm run build

# Install the exact production graph separately; development tooling never enters the runtime image.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS production-dependencies
WORKDIR /production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts

# Runtime contains Node, compiled application modules and production dependencies; uploads remain in bounded memory.
FROM node:24.20.0-alpine@sha256:e67514e5d0f6c46656005e1b693b2ec9d52e80b641307de684d4a015ba7a4eaf AS runtime
ENV NODE_ENV=production PORT=3000
WORKDIR /app
RUN rm -rf /usr/local/lib/node_modules /opt/yarn-* /usr/local/bin/npm /usr/local/bin/npx \
    /usr/local/bin/yarn /usr/local/bin/yarnpkg
COPY --from=build --chown=node:node /build/dist ./dist
COPY --from=production-dependencies --chown=node:node /production/node_modules ./node_modules
COPY --chown=node:node package.json ./package.json
USER node
EXPOSE 3000
STOPSIGNAL SIGTERM
ENTRYPOINT ["node", "--max-old-space-size=128", "dist/index.js"]
