for i in $(seq 1 20); do
  curl -s http://c-mod5-ws-116443096.us-east-1.elb.amazonaws.com:3000/instance
  echo
done

