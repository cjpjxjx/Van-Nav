# Stage 1: Build frontend assets
FROM node:18-alpine AS febuilder
WORKDIR /app
RUN apk add --no-cache git
RUN git clone https://github.com/cjpjxjx/Van-Nav . 
RUN cd /app && cd ui/admin && yarn install && yarn build && cd ../..
RUN cd ui/website && yarn install && yarn build && cd ../..
RUN cd /app && mkdir -p public/admin
RUN cp -r ui/website/build/* public/
RUN cp -r ui/admin/dist/* public/admin/
RUN sed -i 's/\/assets/\/admin\/assets/g' public/admin/index.html

# Stage 2: Build Go binary
FROM golang:alpine AS binarybuilder
RUN apk --no-cache --no-progress add git
WORKDIR /app
RUN git clone https://github.com/cjpjxjx/Van-Nav . 
COPY --from=febuilder /app/public /app/public
RUN cd /app && ls -la && cat /app/go.mod
# RUN go env -w GO111MODULE=on
# RUN go env -w GOPROXY=https://goproxy.cn,direct
RUN cd /app && go mod tidy && go build .

# Stage 3: Final image
FROM alpine:latest
ENV TZ="Asia/Shanghai"
RUN apk --no-cache --no-progress add \
    ca-certificates \
    tzdata && \
    cp "/usr/share/zoneinfo/$TZ" /etc/localtime && \
    echo "$TZ" >  /etc/timezone
WORKDIR /app
COPY --from=binarybuilder /app/nav /app/

VOLUME ["/app/data"]
EXPOSE 6412
ENTRYPOINT [ "/app/nav" ]
