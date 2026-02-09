FROM node:24-alpine3.22 AS base

RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS dependencies

WORKDIR /app
COPY .npmrc package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/package.json
RUN pnpm install --frozen-lockfile --filter ./server...

FROM base AS build

WORKDIR /app
COPY . .
COPY --from=dependencies /app/node_modules ./node_modules
RUN pnpm --filter ./server db:generate \
  && pnpm --filter ./server build \
  && pnpm --filter ./server deploy --prod /app/out


FROM base AS deploy

WORKDIR /app
COPY --from=build /app/out ./

RUN apk add --no-cache tzdata
ENV TZ=Asia/Shanghai

EXPOSE 2022

CMD ["node", "dist/index.js"]
