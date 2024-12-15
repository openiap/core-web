FROM node:18-alpine AS builder
WORKDIR /app
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

# docker build -t cloudhack/core-web:0.0.8 . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.8
# docker build -t cloudhack/core-web:0.0.8 . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.8
# docker build -t cloudhack/core-web:0.0.8 . && docker push cloudhack/core-web:0.0.8

# docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.8