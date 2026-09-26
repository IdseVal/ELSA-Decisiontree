# The optional container image (docs/deployment.md). It runs the same build a plain Linux
# server runs -- `npm ci`, `next build`, then the standalone folder started with
# `node server.js` -- so a container and a systemd unit serve the same bytes.
#
# The base is the Docker official Node.js image: an image, not a service, available from
# any registry that mirrors Docker Hub. Nothing here belongs to a hosting vendor.

FROM node:22-bookworm-slim AS build
WORKDIR /build
ENV NEXT_TELEMETRY_DISABLED=1
# The lockfile alone first, so a change to the application does not re-install npm packages.
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS run
WORKDIR /app
# HOSTNAME is 0.0.0.0 because inside a container the app must answer on the container's
# address and not only on loopback, or a published port reaches nothing. On a plain server
# it is the opposite: loopback, with the reverse proxy in front (docs/deployment.md).
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
# The standalone folder is the whole server: its own node_modules, no npm at run time.
COPY --from=build /build/.next/standalone ./
# The repository's Trees are the seed (ELSA_SEED_DIR defaults to ./trees): imported into the
# data directory at its first start only (docs/specs/application.md 17.4).
COPY --from=build /build/trees ./trees
# ELSA_DATA_DIR has no default (application.md 17.1): mount a volume and name it when the
# image is run, e.g. `docker run -v /srv/elsa-data:/data -e ELSA_DATA_DIR=/data`. The first
# run also needs ELSA_ADMIN_PASSWORD (application.md 20.3), passed with --env-file and left
# out of every later run (docs/deployment.md, "A container"). The folder
# exists and belongs to `node` so that a fresh named volume mounted there is writable.
RUN mkdir /data && chown node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
