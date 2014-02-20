require 'rubygems'
require 'benchmark'
require 'mysql2'
require 'haml'

number_of = 1
database = 'test'
sql = "SELECT * FROM mysql2_test LIMIT 1"

Benchmark.bmbm do |x|
  mysql2 = Mysql2::Client.new(:host => "localhost", :username => "root")
  mysql2.query "USE #{database}"
  x.report "Mysql2 (cast: true)" do
    number_of.times do
      mysql2_result = mysql2.query sql, :symbolize_keys => true, :cast => true
      puts haml :index, :locals => { :rows => mysqql2_result }
    end
  end

  x.report "Mysql2 (cast: false)" do
    number_of.times do
      mysql2_result = mysql2.query sql, :symbolize_keys => true, :cast => false
      mysql2_result.each do |res|
        # puts res.inspect
      end
    end
  end

end
