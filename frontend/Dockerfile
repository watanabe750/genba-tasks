FROM node:20-alpine
ENV TZ=Asia/Tokyo
WORKDIR /app
RUN corepack enable
RUN corepack prepare pnpm@latest --activate && pnpm config set store-dir /root/.local/share/pnpm/store --global
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install
COPY . .
EXPOSE 5173
CMD ["pnpm","dev","--host","0.0.0.0"]
