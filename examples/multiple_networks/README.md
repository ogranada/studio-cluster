To run in several machines in different networks, studio cluster uses redis for service discovery (but still do rpc using websockets).

So for this test you need a redis server running.

To execute the test dont forget to open the access to the port 10120 (if you want a different port, just change it on fibonacci.js), and put the url for your redis server on fibonacci.js then run

	node index.js

For better readability the code uses generators, so if youre running on node < 4 , add the --harmony-generators flag

	node --harmony-generators index.js
