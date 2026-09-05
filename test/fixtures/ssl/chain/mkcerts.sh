# A CA and a server certificate that verify as a chain, for unit tests that
# run their own TLS server. The server certificate is valid for the DNS name
# `resumption.test` only.

openssl req -x509 -newkey rsa:2048 -nodes -days 36500 \
        -subj "/CN=MySQL2 test CA" -keyout ca-key.pem -out ca.pem

openssl req -newkey rsa:2048 -nodes -subj "/CN=resumption.test" \
        -keyout server-key.pem -out server-req.pem

openssl x509 -req -in server-req.pem -days 36500 \
        -CA ca.pem -CAkey ca-key.pem -set_serial 01 \
        -extfile <(printf "subjectAltName=DNS:resumption.test") \
        -out server-cert.pem

rm server-req.pem
