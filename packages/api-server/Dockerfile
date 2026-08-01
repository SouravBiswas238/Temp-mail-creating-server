FROM node:22-alpine
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY packages/api-server ./packages/api-server

RUN npm install --workspace packages/api-server --workspace packages/shared --omit=dev

WORKDIR /usr/src/app/packages/api-server
USER node
EXPOSE 3001
CMD ["node", "src/index.js"]
