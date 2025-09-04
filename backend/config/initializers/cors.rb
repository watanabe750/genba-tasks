# config/initializers/cors.rb
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'http://localhost:5173', 'http://127.0.0.1:5173'
    resource '*',
      headers: :any,
      expose: %w[access-token client uid expiry token-type Authorization x-auth-start],  # ← カンマ大事
      methods: %i[get post put patch delete options head],
      credentials: true
  end
end
