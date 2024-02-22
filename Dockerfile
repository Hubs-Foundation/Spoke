FROM node:16 AS build

WORKDIR /app/spoke

COPY ./package.json ./
COPY ./yarn.lock ./

RUN yarn install

COPY . .

RUN npm run build

FROM nginx:stable-alpine
WORKDIR /app/spoke
COPY --from=build /app/spoke/dist /usr/share/nginx/html

EXPOSE 9090
CMD ["nginx", "-g", "daemon off;", "-c", "/etc/nginx/nginx.conf"]
