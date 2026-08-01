FROM node:22-alpine
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY packages/shared ./packages/shared
COPY packages/smtp-receiver ./packages/smtp-receiver

RUN npm install --workspace packages/smtp-receiver --workspace packages/shared --omit=dev

WORKDIR /usr/src/app/packages/smtp-receiver
USER node
EXPOSE 2525
CMD ["node", "src/index.js"]
