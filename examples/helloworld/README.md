To run this test in a machine execute:

	node machine1.js

And in other machine execute:

	node machine2.js

The machines must be in a local network (you cant use aws vpc, using the default transport check the aws example to see how to do it).

If you dont have two machines, studio cluster also can make two different process communicate, all you have to do is to change the rpcPort for one of the files,
the code is already commented on machine2.js, open two tabs in a terminal, and execute, in the first tab:

	node machine1.js

And in the second tab:

	node machine2.js


And if you dont wanna a cluster, and wants to see everything running in the same process just run:

	node on_the_same_process.js


When running the examples, you can kill machine1.js and you will see an error (ROUTE_NOT_FOUND) happening, this is expected, since this service is no 
longer available if you restart machine1.js you will see that it will find again the service and printing the expected response, you can play with this
kill/restart behaviour (on both process) to see that it just works.

