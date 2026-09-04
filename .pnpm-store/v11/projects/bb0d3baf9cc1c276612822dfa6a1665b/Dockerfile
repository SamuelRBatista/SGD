FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY server.js ./
COPY src ./src

RUN mkdir -p uploads

EXPOSE 3001

CMD ["node", "server.js"]
