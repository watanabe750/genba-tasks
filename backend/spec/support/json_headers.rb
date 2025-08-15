module JsonHeaders
    def json_headers
      { "CONTENT_TYPE" => "application/json", "ACCEPT" => "application/json" }
    end
end

RSpec.configure { |c| c.include JsonHeaders, type: :request }