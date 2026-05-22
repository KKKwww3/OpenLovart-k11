FROM denoland/deno:alpine-2.2.8

WORKDIR /app

COPY . .

EXPOSE 8081

CMD deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --no-lock \
  gateway.ts