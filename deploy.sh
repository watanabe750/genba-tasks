#!/usr/bin/env bash
set -euo pipefail

# ==== 事前に書き換える/エクスポートしておく値 ====
# 環境変数で上書き可能。本番では必ず環境変数を設定してください
REGION="${REGION:-ap-northeast-1}"
ACCOUNT_ID="${ACCOUNT_ID:?Error: ACCOUNT_ID is required. Set via environment variable.}"
REPO_API="${REPO_API:-genba-task-api}"
CLUSTER="${CLUSTER:-genba-task-cluster}"
SERVICE_API="${SERVICE_API:-genba-task-svc}"

ECR="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com"
TAG="${TAG:-$(git rev-parse --short HEAD 2>/dev/null || date +%Y%m%d%H%M%S)}"

echo "REGION=$REGION  ACCOUNT_ID=$ACCOUNT_ID  REPO_API=$REPO_API"
echo "CLUSTER=$CLUSTER SERVICE_API=$SERVICE_API  TAG=$TAG"

# 0) 認証チェック
aws sts get-caller-identity >/dev/null
echo "✔ AWS CLI 認証OK"

# 1) ECR ログイン
aws ecr get-login-password --region "$REGION" \
| docker login --username AWS --password-stdin "$ECR"

# 2) API イメージ build & push
docker build -t "${ECR}/${REPO_API}:${TAG}" -f backend/Dockerfile ./backend
docker push "${ECR}/${REPO_API}:${TAG}"

# 3) 既存タスク定義取得
CUR_TD_ARN="$(aws ecs describe-services --cluster "$CLUSTER" --services "$SERVICE_API" \
  --query 'services[0].taskDefinition' --output text)"
FAMILY="$(aws ecs describe-task-definition --task-definition "$CUR_TD_ARN" \
  --query 'taskDefinition.family' --output text)"

# 4) コンテナ定義を取得して image を置き換え（先頭のコンテナを更新）
aws ecs describe-task-definition --task-definition "$CUR_TD_ARN" \
  --query 'taskDefinition.containerDefinitions' >/tmp/containers.json

# 複数コンテナの場合は必要に応じて .name で分岐してください
jq --arg IMG "${ECR}/${REPO_API}:${TAG}" '.[0].image = $IMG' \
  /tmp/containers.json >/tmp/containers.new.json

# 5) 新しいタスク定義を登録
EXEC_ROLE_ARN="$(aws iam list-roles \
  --query 'Roles[?contains(RoleName,`ecsTaskExecutionRole`)].Arn | [0]' --output text)"
TASK_ROLE_ARN="$(aws iam list-roles \
  --query 'Roles[?contains(RoleName,`ecsTaskRole`)].Arn | [0]' --output text)"

NEW_TD_ARN="$(aws ecs register-task-definition \
  --family "$FAMILY" \
  --requires-compatibilities FARGATE \
  --network-mode awsvpc \
  --cpu 256 --memory 512 \
  --execution-role-arn "$EXEC_ROLE_ARN" \
  --task-role-arn "$TASK_ROLE_ARN" \
  --container-definitions file:///tmp/containers.new.json \
  --query 'taskDefinition.taskDefinitionArn' --output text)"

echo "New TaskDef: $NEW_TD_ARN"

# 6) サービス更新（ローリング）
aws ecs update-service --cluster "$CLUSTER" --service "$SERVICE_API" \
  --task-definition "$NEW_TD_ARN" --force-new-deployment

echo "🎉 Deploy done: ${ECR}/${REPO_API}:${TAG}"
