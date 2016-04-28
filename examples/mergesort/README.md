Studio and Studio-cluster makes easy to create a distributed version of mergeSort:

To run this test in several machines execute in each one:

	node index.js

The machines must be in a local network (you cant use aws vpc, because it dont support broadcast using the default transport check the [multiple_networks](https://github.com/ericholiveira/studio-cluster/tree/master/examples/multiple_networks) example to see how to do it).

If you dont have more than one machines, studio cluster also can make two different process communicate, all you have to do is to change 
the rpcPort for one of the files, the code is already commented on index.js, open several tabs in a terminal, and execute, in each tab:

	node index.js

On the first run, it will execute the whole code in the same process, but as you keep adding new process it will distribute the work.

For better readability the code uses generators, so if youre running on node < 4 , add the --harmony-generators flag

	node --harmony-generators index.js

The code is filled with console.log so you can see which process is handling which data.

The program have a lot of console.log so you can track which process is running