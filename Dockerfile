FROM node:18-alpine AS builder
WORKDIR /app
# Install git for npm
RUN apk add --no-cache git
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build
RUN npm prune --production


FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]

# REMEMBER TO UPDATE svelte.config.js !!!!
#
# docker build -t cloudhack/core-web:0.0.18 . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.18
# docker build -t cloudhack/core-web:0.0.18 . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.18
# docker build -t cloudhack/core-web:0.0.18 . && docker push cloudhack/core-web:0.0.18

# docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.18