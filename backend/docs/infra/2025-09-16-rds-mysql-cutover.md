# RDS(MySQL) 切替メモ
- エンドポイント: genba-task-db.cr4k6e08yxdh.ap-northeast-1.rds.amazonaws.com
- DB名: genba_task_production
- ユーザー: app_user

## SSM
- /genba_task/prod/DB_HOST
- /genba_task/prod/DB_NAME
- /genba_task/prod/DB_USER
- /genba_task/prod/DB_PASSWORD (SecureString)

## デプロイ手順
1) ECS タスク定義 Secrets に上記を追加→新リビジョン
2) Run Task: `bash -lc "bundle exec rails db:migrate"`
3) サービス更新 → `http://<ALB-DNS>/up` = 200
4) RDS SG: genba-ecs-sg のみ許可（MyIPは削除）
