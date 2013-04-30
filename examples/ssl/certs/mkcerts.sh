openssl genrsa 2048 > ca-key.pem
openssl req -new -x509 -nodes -days 1000 -key ca-key.pem > ca-cert.pem
openssl req -newkey rsa:2048 -days 1000 -nodes -keyout server-key.pem > server-req.pem
openssl x509 -req -in server-req.pem -days 1000 -CA ca-cert.pem -CAkey ca-key.pem -set_serial 01 > server-cert.pem
openssl req -newkey rsa:2048 -days 1000 -nodes -keyout client-key.pem > client-req.pem
openssl x509 -req -in client-req.pem -days 1000 -CA ca-cert.pem -CAkey ca-key.pem -set_serial 01 > client-cert.pem
