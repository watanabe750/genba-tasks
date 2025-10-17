# frozen_string_literal: true

# Configure Rack::Attack for rate limiting and request throttling
# Documentation: https://github.com/rack/rack-attack

# Add Rack::Attack middleware to the stack
Rails.application.config.middleware.use Rack::Attack

class Rack::Attack
  ### Configure Cache ###

  # If you don't want to use Rails.cache (Rack::Attack's default), then
  # configure it here. Using Rails.cache is recommended.
  #
  # Note: The store is only used for throttling (not blocklisting and
  # safelisting). It must implement .increment and .write like
  # ActiveSupport::Cache::Store

  # Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

  ### Throttle Spammy Clients ###

  # Throttle all requests by IP (60rpm)
  # If any single IP is making > 60 requests per minute,
  # then temporarily throttle that IP
  throttle('req/ip', limit: 60, period: 1.minute) do |req|
    req.ip unless req.path.start_with?('/health')
  end

  ### Prevent Brute-Force Login Attacks ###

  # Throttle POST requests to /api/auth/sign_in by IP address
  # Limit to 5 login attempts per 5 minutes per IP
  throttle('api/auth/sign_in/ip', limit: 5, period: 5.minutes) do |req|
    if req.path == '/api/auth/sign_in' && req.post?
      req.ip
    end
  end

  # Throttle POST requests to /api/auth/sign_in by email parameter
  # Limit to 5 login attempts per 5 minutes per email
  # This protects against distributed brute-force attacks
  throttle('api/auth/sign_in/email', limit: 5, period: 5.minutes) do |req|
    if req.path == '/api/auth/sign_in' && req.post?
      # Return the email if present
      # Rack::Request does not parse JSON body, so we need to parse it manually
      begin
        body = req.body.read
        req.body.rewind # Important: rewind the body for subsequent middleware
        data = JSON.parse(body)
        data['email'].to_s.downcase.presence if data['email']
      rescue JSON::ParserError
        nil
      end
    end
  end

  ### Throttle Password Reset Requests ###

  # Throttle POST requests to /api/auth/password by IP address
  # Limit to 3 password reset requests per 5 minutes per IP
  throttle('api/auth/password/ip', limit: 3, period: 5.minutes) do |req|
    if req.path == '/api/auth/password' && req.post?
      req.ip
    end
  end

  ### Throttle Registration Requests ###

  # Throttle POST requests to /api/auth by IP address
  # Limit to 3 registration attempts per hour per IP
  throttle('api/auth/registration/ip', limit: 3, period: 1.hour) do |req|
    if req.path == '/api/auth' && req.post?
      req.ip
    end
  end

  ### Custom Throttle Response ###

  # By default, Rack::Attack returns a 429 (Too Many Requests) response
  # You can customize the response here
  self.throttled_responder = lambda do |request|
    match_data = request.env['rack.attack.match_data']
    now = match_data[:epoch_time]

    headers = {
      'Content-Type' => 'application/json',
      'RateLimit-Limit' => match_data[:limit].to_s,
      'RateLimit-Remaining' => '0',
      'RateLimit-Reset' => (now + (match_data[:period] - (now % match_data[:period]))).to_s
    }

    [429, headers, [{ error: 'Too many requests. Please try again later.' }.to_json]]
  end

  ### Logging ###

  # Log all throttled requests
  ActiveSupport::Notifications.subscribe('throttle.rack_attack') do |_name, _start, _finish, _request_id, payload|
    req = payload[:request]
    Rails.logger.warn "[Rack::Attack][Throttled] #{req.ip} #{req.request_method} #{req.fullpath} " \
                      "matched: #{req.env['rack.attack.matched']} " \
                      "discriminator: #{req.env['rack.attack.match_discriminator']}"
  end

  # Optional: Log all blocked requests (if you add blocklisting)
  ActiveSupport::Notifications.subscribe('blocklist.rack_attack') do |_name, _start, _finish, _request_id, payload|
    req = payload[:request]
    Rails.logger.warn "[Rack::Attack][Blocked] #{req.ip} #{req.request_method} #{req.fullpath}"
  end
end
