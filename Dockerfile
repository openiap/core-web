FROM node22:latest
LABEL name="OpenCore Web"
LABEL description="Core-web"
LABEL anonymous="true"
LABEL repo="web"
WORKDIR /app
# Install git for npm
RUN apk add --no-cache git
COPY build /app
EXPOSE 3000
ENV NODE_ENV=production
ENTRYPOINT ["node", "/app/index.js"]

# REMEMBER TO UPDATE svelte.config.js !!!!
#
# docker build -t cloudhack/core-web:0.0.41.3 -t cloudhack/core-web:latest . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.41.3
# docker build -t cloudhack/core-web:0.0.41.3 -t cloudhack/core-web:latest . && docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.41.3
# docker build -t cloudhack/core-web:0.0.41.3 -t cloudhack/core-web:latest . && docker push cloudhack/core-web:0.0.41.3 && docker push cloudhack/core-web:latest

# docker run -it -p 80:3000 --rm cloudhack/core-web:0.0.41.3