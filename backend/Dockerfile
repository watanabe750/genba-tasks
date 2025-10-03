# syntax=docker/dockerfile:1
# check=error=true

ARG RUBY_VERSION=3.2.3

# ---------- base stage (runtime) ----------
FROM docker.io/library/ruby:${RUBY_VERSION}-slim AS base
ENV DEBIAN_FRONTEND=noninteractive

# 公式HTTPSミラーに固定（Hash Sum mismatch回避の一助）
RUN set -eux; \
  echo "deb https://deb.debian.org/debian bookworm main" > /etc/apt/sources.list; \
  echo "deb https://deb.debian.org/debian bookworm-updates main" >> /etc/apt/sources.list; \
  echo "deb https://security.debian.org/debian-security bookworm-security main" >> /etc/apt/sources.list; \
  printf 'Acquire::Retries "5";\nAcquire::http::No-Cache "true";\nAcquire::https::No-Cache "true";\nAcquire::http::Pipeline-Depth "0";\n' > /etc/apt/apt.conf.d/99no-cache

WORKDIR /rails

# ランタイムに必要な最小限（ActiveStorage: libvips、MySQL: libmariadb3）
# 1レイヤーで update → install → cleanup
RUN set -eux; \
  rm -rf /var/lib/apt/lists/*; \
  apt-get update; \
  apt-get install --no-install-recommends -y \
    curl \
    libjemalloc2 \
    libvips \
    sqlite3 \
    libmariadb3; \
  rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# Rails / Bundler 実行時設定
ENV RAILS_ENV=production \
    RAILS_LOG_TO_STDOUT=1 \
    RAILS_SERVE_STATIC_FILES=1 \
    BUNDLE_DEPLOYMENT=1 \
    BUNDLE_WITHOUT="development:test" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3

# ---------- build stage ----------
FROM base AS build

# ネイティブ拡張ビルド用（mysql2 用ヘッダ等）を build 段だけに導入
RUN set -eux; \
  rm -rf /var/lib/apt/lists/*; \
  apt-get update; \
  apt-get install --no-install-recommends -y \
    build-essential \
    git \
    libyaml-dev \
    pkg-config \
    default-libmysqlclient-dev; \
  rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*

# 依存解決
COPY Gemfile Gemfile.lock ./
RUN bundle install \
 && rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git \
 && bundle exec bootsnap precompile --gemfile

# アプリ本体
COPY . .
RUN bundle exec bootsnap precompile app/ lib/
# （必要なら）アセット
# RUN bin/rails assets:precompile

# ---------- final stage ----------
FROM base

# bundle & app をコピー
COPY --from=build "${BUNDLE_PATH}" "${BUNDLE_PATH}"
COPY --from=build /rails /rails

# 非rootユーザ
RUN set -eux; \
  groupadd --system --gid 1000 rails; \
  useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash; \
  mkdir -p /rails/db /rails/log /rails/storage /rails/tmp; \
  chown -R rails:rails /rails/db /rails/log /rails/storage /rails/tmp
USER 1000:1000

# Entrypoint
ENTRYPOINT ["/rails/bin/docker-entrypoint"]

# ALB/ECS のターゲットポートに合わせる（3000）
EXPOSE 3000

# 0.0.0.0:3000 で待ち受け（thrust をラッパに使用）
CMD ["./bin/thrust", "./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]

# ビルド識別
ARG GIT_SHA=unknown
ENV GIT_SHA=${GIT_SHA}

# ヘルスチェック（/up）
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD curl -fsS http://localhost:3000/up || exit 1