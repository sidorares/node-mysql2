httperf --port=1234 --uri='/render?q=select%20*%20from%20foos%20limit%205,10000&n=2' --num-conns=10 --num-calls=2 rate=100
