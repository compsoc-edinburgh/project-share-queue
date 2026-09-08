import { serve } from "bun";
import index from "../client/index.html";

const server = serve({
	fetch(req, server) {
		if (server.upgrade(req)) {
			return;
		}

		return new Response("Update failed", { status: 500 });
	},
	websocket: {
		message(ws, message) {}, // a message is received
		open(ws) {}, // a socket is opened
		close(ws, code, message) {}, // a socket is closed
	},
	routes: {
		// Serve index.html for all unmatched routes.
		"/*": index,

		"/api/hello": {
			async GET(req) {
				return Response.json({
					message: "Hello, world!",
					method: "GET",
				});
			},
			async PUT(req) {
				return Response.json({
					message: "Hello, world!",
					method: "PUT",
				});
			},
		},

		"/api/hello/:name": async (req) => {
			const name = req.params.name;
			return Response.json({
				message: `Hello, ${name}!`,
			});
		},
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
