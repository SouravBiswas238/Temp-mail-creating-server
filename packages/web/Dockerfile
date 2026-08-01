FROM node:22-alpine AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
COPY packages/web ./packages/web

ARG VITE_API_BASE_URL=/api
ARG VITE_MAIL_DOMAIN=localhost
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MAIL_DOMAIN=$VITE_MAIL_DOMAIN

RUN npm install --workspace packages/web
RUN npm run build --workspace packages/web

FROM nginx:1.27-alpine
COPY --from=build /usr/src/app/packages/web/dist /usr/share/nginx/html
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
