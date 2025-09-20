
# ALB の HTTPS 化（api.genba-tasks.com）

## 概要
- 目的: API を HTTPS 提供し、HTTP を 301 で HTTPS にリダイレクトする
- 対象: genba-task-alb（ap-northeast-1）
- 証明書: ACM(ap-northeast-1) / `api.genba-tasks.com`（DNS 検証）

## 実施内容
1. **ACM 証明書発行（東京）**
   - Domain: `api.genba-tasks.com`
   - Validation: DNS（Route 53 で CNAME 自動作成）
   - Status: **Issued**

2. **ALB**
   - Security Group: 443/TCP を 0.0.0.0/0 に開放
   - Listener(443/HTTPS): TargetGroup `genba-task-tg` に Forward  
     Security policy: `ELBSecurityPolicy-TLS13-1-2-Res-2021-06`
   - Listener(80/HTTP): **HTTPS:443 へ 301 リダイレクト**

3. **Route 53**
   - Hosted zone: `genba-tasks.com`
   - A (ALIAS): `api.genba-tasks.com` → **genba-task-alb**（dualstack）
   - （任意）AAAA (ALIAS): `api.genba-tasks.com` → 同上

## 検証（抜粋）
```bash
# HTTP は 301
curl -I http://api.genba-tasks.com/up
# => HTTP/1.1 301 ... Location: https://api.genba-tasks.com:443/up

# HTTPS は 200
curl -I https://api.genba-tasks.com/up
# => HTTP/2 200

 DoD
 http://api.genba-tasks.com/up が 301 で https に誘導
 https://api.genba-tasks.com/up が 200 を返す
 ACM 証明書 Issued / ALB 443 リスナー稼働 / 80→443 リダイレクト

リスク & 対応
証明書失効: ACM 自動更新（DNS 検証維持）
CORS: 後続の独自ドメイン導入時に API 側で https://app.genba-tasks.com を許可
監視: 5xx 連続時は ALB Target 健康状態と ECS ログを確認

ロールバック
一時的に HTTP を許可: 80 のデフォルトアクションを genba-task-tg Forward に変更
DNS 戻し: A(ALIAS) を ALB 以外に切替（必要時）

参考
ACM ARN: （ACM 画面参照）
ALB: genba-task-alb
Target Group: genba-task-tg
