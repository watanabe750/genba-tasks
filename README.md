# Genba Tasks (SPA) – ポートフォリオ

> 現場向けの **カンバン型タスク管理アプリ**。  
> フロント：**TypeScript / React (Vite)**、バックエンド：**Ruby on Rails 8 (API mode)**、  
> インフラ：**AWS（ECS Fargate / ALB / CloudFront / Route53 / RDS / S3）**。

- アプリ: https://app.genba-tasks.com/
- API ヘルスチェック: https://api.genba-tasks.com/up
- 体験方法: **ゲストログイン** ボタンでワンクリック入場（アカウント情報の記載は不要です）

---

## 目次
- [Genba Tasks (SPA) – ポートフォリオ](#genba-tasks-spa--ポートフォリオ)
  - [目次](#目次)
  - [機能](#機能)
    - [認証](#認証)
    - [タスク管理](#タスク管理)
  - [スクリーンショット / GIF](#スクリーンショット--gif)
  - [技術スタック](#技術スタック)
  - [アーキテクチャの要点](#アーキテクチャの要点)
  - [使い方（デモ手順）](#使い方デモ手順)
  - [リポジトリ構成](#リポジトリ構成)
  - [ローカル実行（簡易）](#ローカル実行簡易)
- [.env.local に API 先を指定（例）](#envlocal-に-api-先を指定例)
- [VITE\_API\_BASE\_URL=http://localhost:3000](#vite_api_base_urlhttplocalhost3000)

---

## 機能

### 認証
- ログイン / ログアウト（`devise_token_auth` によるトークン認証）
- ユーザー登録 / 表示 / 更新 / 削除
- パスワード再設定（メール送信は本番では SES/SMTP 等に切替可能）
- **ゲストログイン（ワンクリック）**

### タスク管理
- **上位タスク / タスクの CRUD**
- 画像添付（**Active Storage + S3**）
- **ドラッグ＆ドロップ**で並び替え
- 期限が近いタスクのサイド表示
- フィルター / 検索 / 並び替え（昇順・降順）
- レスポンシブ対応

---

## スクリーンショット / GIF

> GIF はこの順で短尺（各 8〜12 秒）を予定
> 1) **ゲストログイン → 上位タスク作成**  
> 2) **カード編集 → 画像添付（サムネ表示）**  
> 3) **カードのドラッグ＆ドロップ並び替え**

配置予定:
- `assets/01_signin.gif`
- `assets/02_edit_upload.gif`
- `assets/03_drag_and_drop.gif`

*撮影 Tips（macOS）*: QuickTime で画面収録 → **Gifski** で GIF 化（幅 ~900px / 10–12fps / ループ）

---

## 技術スタック

**Frontend**
- React, TypeScript, Vite
- React Router, Axios
- （UI は最小構成。必要に応じて MUI / shadcn/ui / Radix を採用可能）

**Backend (API)**
- Ruby on Rails 8, Puma
- Devise / Devise Token Auth, rack-cors
- Active Storage + Amazon S3
- RSpec（最低限）

**Infra / Ops**
- **AWS**: ECS Fargate（Rails コンテナ）, ALB（HTTPS/ACM）, CloudFront（SPA 配信）, Route53, RDS(MySQL), S3
- CloudWatch Logs（**Live Tail** でのリアルタイム追跡）
- 独自ドメイン: `app.genba-tasks.com` / `api.genba-tasks.com`

---

## アーキテクチャの要点

- **独自ドメイン & HTTPS 完備**
  - `app.genba-tasks.com` … CloudFront（証明書は us-east-1）
  - `api.genba-tasks.com` … ALB（証明書は ap-northeast-1、80→443 リダイレクト）
- **CORS 最小許可**  
  - 許可オリジンは `https://app.genba-tasks.com`（＋CloudFront ドメイン）  
  - `access-token, client, uid, expiry` を `Access-Control-Expose-Headers` に明示
- **可観測性**  
  - `x-request-id` を CloudWatch **Live Tail** で追跡し、curl/ブラウザの失敗要因を即時特定
- **ヘルスチェック**  
  - `GET /up` を ALB/LB 監視と手動確認の双方で利用

---

## 使い方（デモ手順）

1. https://app.genba-tasks.com を開く  
2. 右上の **「ゲスト環境」**（またはゲストログイン）で入場  
3. 上部フォームから **上位タスクを作成**  
4. タスク編集で **画像を添付**（S3 に保存 → サムネ表示）  
5. ボード上で **ドラッグ＆ドロップ** して順序変更

---

## リポジトリ構成

/frontend # SPA (React + Vite)
/backend # Rails API (Active Storage, Devise Token Auth)
/infra # IaC/運用スクリプト（最小）
/assets # README 用の画像・GIF（後述の3本を配置）

yaml
コードをコピーする

---

## ローカル実行（簡易）

> 学習用の最短手順だけを記載（本番運用手順は省略）

**Backend**
```bash
cd backend
bundle install
bin/rails db:setup
bin/rails s   # http://localhost:3000
Frontend

cd frontend
pnpm install
# .env.local に API 先を指定（例）
# VITE_API_BASE_URL=http://localhost:3000
pnpm dev      # http://localhost:5173
今後の改善（加点ポイント）
画像 CDN 化（CloudFront + OAC）
S3 直アクセス遮断 & キャッシュ最適化で表示体験を改善

E2E テスト（Playwright） / パフォーマンス計測（Lighthouse CI）

通知（期日リマインド、メール/Push）

組織・権限（複数ユーザー、ボード共有）

ライセンス
MIT