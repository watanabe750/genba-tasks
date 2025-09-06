# db/seeds.rb
demo_email = ENV.fetch("DEMO_EMAIL", "demo@example.com")
demo_pass  = ENV.fetch("DEMO_PASS",  "demopassword")

User.find_or_create_by!(email: demo_email) do |u|
  u.password = demo_pass
  u.password_confirmation = demo_pass
  u.name = "Demo"
end
puts "[seed] demo user: #{demo_email}/#{demo_pass}"
