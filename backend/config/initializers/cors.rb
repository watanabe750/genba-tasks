Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins 'https://app.genba-tasks.com', 'http://localhost:5173', 'http://127.0.0.1:5173'
    resource '*',
      headers: :any,
      methods: %i[get post put patch delete options head],
      expose: %w[access-token client uid expiry token-type authorization],
      max_age: 86400,
      credentials: false
  end
end
