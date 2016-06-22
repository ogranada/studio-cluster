Publish and subscribe is achieved using the ```multiplex``` balance module.

To run this test in several machines execute each of these command in a separate process:

    node subscriber-api.js
    node subscriber-bill.js
	node publisher.js

These services are configured to run on the same machine (or local network that supports Multicast).  The localhost
publisher works together with the localhost transport to efficiently communicate between services on the same machine.
They are made to work together (not compatible with other publisher/transports).

The publisher creates an event to respond to a billedApi request.  The event is broadcast to multiple subscribers.  The
api subscriber returns the number of shares that are owned.  The bill subscriber keep strack of how many requests are
made and charges 0.05 for each request.

The code is filled with console.log so you can see which process is handling which data.

The program have a lot of console.log so you can track which process is running
