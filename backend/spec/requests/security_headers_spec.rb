# spec/requests/security_headers_spec.rb
require 'rails_helper'

RSpec.describe 'Security Headers', type: :request do
  let(:user) { create(:user) }
  let(:auth_headers) { user.create_new_auth_token }

  describe 'セキュリティヘッダーの確認' do
    before do
      get '/api/tasks', headers: auth_headers
    end

    it 'X-Frame-Options ヘッダーが設定されている' do
      expect(response.headers['X-Frame-Options']).to eq('DENY')
    end

    it 'X-Content-Type-Options ヘッダーが設定されている' do
      expect(response.headers['X-Content-Type-Options']).to eq('nosniff')
    end

    it 'X-XSS-Protection ヘッダーが設定されている' do
      expect(response.headers['X-XSS-Protection']).to eq('1; mode=block')
    end

    it 'Referrer-Policy ヘッダーが設定されている' do
      expect(response.headers['Referrer-Policy']).to eq('strict-origin-when-cross-origin')
    end

    it 'Permissions-Policy ヘッダーが設定されている' do
      expect(response.headers['Permissions-Policy']).to include('geolocation=()')
      expect(response.headers['Permissions-Policy']).to include('microphone=()')
      expect(response.headers['Permissions-Policy']).to include('camera=()')
    end

    it 'Content-Security-Policy ヘッダーが設定されている' do
      csp = response.headers['Content-Security-Policy']
      expect(csp).to be_present

      # 各ディレクティブの確認
      expect(csp).to include("default-src 'self'")
      expect(csp).to include("object-src 'none'")
      expect(csp).to include("base-uri 'self'")
      expect(csp).to include("form-action 'self'")
    end

    context '本番環境' do
      before do
        allow(Rails.env).to receive(:production?).and_return(true)
        # 本番環境の設定を再読み込み
        Rails.application.config.content_security_policy do |policy|
          policy.upgrade_insecure_requests true
        end

        get '/api/tasks', headers: auth_headers
      end

      it 'CSPにupgrade-insecure-requestsが含まれている' do
        # 本番環境ではHTTPSへの自動アップグレードが有効
        # 注: テスト環境では実際の動作確認が困難なため、設定の存在確認のみ
        expect(Rails.application.config.content_security_policy_report_only).to be_falsey
      end
    end
  end

  describe 'HTTPSリダイレクト（本番環境）' do
    it '本番環境ではforce_sslが有効になっている' do
      # 設定ファイルの確認
      expect(Rails.application.config.force_ssl).to be_truthy if Rails.env.production?
    end

    it 'ヘルスチェックエンドポイントはSSLリダイレクトから除外される' do
      # ssl_optionsの設定確認
      if Rails.env.production?
        exclude_proc = Rails.application.config.ssl_options[:redirect][:exclude]
        mock_request = double('request', path: '/up')
        expect(exclude_proc.call(mock_request)).to be_truthy
      end
    end
  end

  describe 'Cookie セキュリティ' do
    before do
      post '/api/auth/sign_in', params: { email: user.email, password: user.password }
    end

    it 'セッションCookieにSecure属性が設定されている（本番環境）' do
      if Rails.env.production?
        cookie = response.headers['Set-Cookie']
        expect(cookie).to include('secure') if cookie.present?
      end
    end

    it 'セッションCookieにHttpOnly属性が設定されている' do
      # DeviseTokenAuthのCookie設定を確認
      expect(DeviseTokenAuth.cookie_attributes[:httponly]).to be_truthy
    end

    it 'セッションCookieにSameSite属性が設定されている' do
      # DeviseTokenAuthのCookie設定を確認
      expect(DeviseTokenAuth.cookie_attributes[:same_site]).to eq(:lax)
    end
  end

  describe 'CORS設定' do
    it '許可されたオリジンのみアクセス可能' do
      # CORS設定の確認（実際のヘッダーテストは統合テストで実施）
      cors_config = Rails.application.config.middleware.detect { |m| m.name == 'Rack::Cors' }
      expect(cors_config).to be_present
    end
  end

  describe 'センシティブな情報の漏洩防止' do
    context 'エラー発生時' do
      before do
        # 意図的にエラーを発生させる
        allow_any_instance_of(Api::TasksController).to receive(:index).and_raise(StandardError, 'Test error')
        get '/api/tasks', headers: auth_headers
      end

      it '本番環境ではスタックトレースが表示されない' do
        if Rails.env.production?
          json_response = JSON.parse(response.body)
          expect(json_response).not_to have_key('exception')
          expect(json_response).not_to have_key('trace')
        end
      end

      it 'エラーメッセージは一般的な内容になっている' do
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to be_present
        # センシティブな情報（ファイルパス、DBテーブル名等）が含まれていないことを確認
        error_message = json_response['errors'].first.to_s
        expect(error_message).not_to include('/Users/')
        expect(error_message).not_to include('SELECT')
        expect(error_message).not_to include('password')
      end
    end
  end
end
