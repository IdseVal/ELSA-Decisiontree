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
ENV ELSA_TREES_DIR=/app/trees
# The standalone folder is the whole server: its own node_modules, no npm at run time.
COPY --from=build /build/.next/standalone ./
# Trees are data next to the application, so a new version of a Tree is a rebuild of this
# layer -- or a folder mounted over it -- and never a rebuild of the application.
COPY --from=build /build/trees ./trees
# ELSA_TREE has no default (docs/specs/application.md section 2): name the Tree when the
# image is run, e.g. `docker run -e ELSA_TREE=ai-act-applicability-agrifood`.
USER node
EXPOSE 3000
CMD ["node", "server.js"]
