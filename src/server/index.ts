import { serve } from "bun";
import index from "../client/index.html";
import { generateSession, getSession, removeSession } from "./session";
import type { Nullable } from "./types";

const invalidateToken = (token: Nullable<string>): Nullable<Response> => {
	const adminToken = process.env.ADMIN_SESSION_TOKEN;

	if (!adminToken) {
		throw new Error("ADMIN_SESSION_TOKEN must be configured");
	}

	if (token === null || token !== `Bearer ${adminToken}`) {
		return new Response("Unauthorized", { status: 401 });
	}

	return null;
};

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

		"/api/sessions": {
			async POST(req) {
				const res = invalidateToken(req.headers.get("Authorization"));
				if (res !== null) {
					return res;
				}

				const id = getSession();
				if (id !== null) {
					return Response.json(
						{ error: "The session is already exist" },
						{ status: 409 },
					);
				}

				const newId = generateSession();
				return Response.json(
					{
						id: newId,
						url: new URL(`/${newId}`, process.env.PUBLIC_BASE_URL).href,
					},
					{ status: 201 },
				);
			},

			async GET(req) {
				const res = invalidateToken(req.headers.get("Authorization"));
				if (res !== null) {
					return res;
				}

				const id = getSession();
				if (id === null) {
					return Response.json(
						{ error: "No active session at the moment" },
						{ status: 404 },
					);
				}

				return Response.json(
					{
						id,
						url: new URL(`/${id}`, process.env.PUBLIC_BASE_URL).href,
					},
					{ status: 201 },
				);
			},

			async DELETE(req) {
				const res = invalidateToken(req.headers.get("Authorization"));
				if (res !== null) {
					return res;
				}

				const id = getSession();
				if (id !== null) {
					removeSession();
				}

				return new Response(null, { status: 204 });
			},
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
