// top version is work in progres
0.8.22
  - Multiple results support in binary protocol              #27
  - Apply timezone from config to DATETIME values with no tz #15

0.8.21
  - Fix in error message parsing (Noam Wasersprung)          #31       6cc80a67eaa3baac7dd8eee7182c9eb00977e81a
  - return insert/delete header for insert/delete commands   #32       72aa8fe70981d7410a10edb9d7921e5d6ce1d3ca

0.8.20
  - Make packet parser work with 0.11 ondata(buffer) with no start,end 9005fd1
  - Allow to use Date-like objects as date parameters (Amir Livneh)    6138dad0581fd5e2c45e1ce0b999e334db8979cf
0.8.19
  - Multiple results support in text protocol #15                      4812adaf1aa5b1dfa775a6cf0fa3bae54a7827d0
  - Use connection flags from createConnection parameters/url string   9218f055ceeb95ae7205348e06c07b89b799d031
