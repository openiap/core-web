FROM node22:latest
LABEL name="OpenCore Web"
LABEL description="Core-web"
LABEL anonymous="true"
LABEL repo="web"
LABEL tag="0.0.2"
WORKDIR /app
# Install git for npm
RUN apk add --no-cache git
COPY build /app
COPY package.json /app/package.json
COPY package-lock.json /app/package-lock.json
RUN npm ci --omit=dev
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["node", "/app/index.js"]

# REMEMBER TO UPDATE svelte.config.js !!!!
#
# docker build -t cloudhack/core-web:0.0.41.3 -t cloudhack/core-web:latest . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.41.3
# docker build -t cloudhack/core-web:0.0.41.3 -t cloudhack/core-web:latest . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.41.3
# docker build -t cloudhack/core-web:0.0.41.3 -t cloudhack/core-web:latest . && docker push cloudhack/core-web:0.0.41.3 && docker push cloudhack/core-web:latest

# docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.41.3