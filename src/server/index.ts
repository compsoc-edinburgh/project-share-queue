import { serve } from "bun";
import index from "../client/index.html";
import { getState, join, leave } from "./queue";
import { userMessageSchema } from "./schema";
import {
	checkUser,
	generateSession,
	generateUserToken,
	getSession,
	removeSession,
} from "./session";
import { type Nullable, parse } from "./utils";

type WebsocketData = {
	sessionId: string;
	participantId: string;
};

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
		const url = new URL(req.url);
		const match = /^\/ws\/([^/]+)$/.exec(url.pathname);

		if (!match) {
			return new Response("Not found", { status: 404 });
		}

		const sessionId = match[1];
		const activeSessionId = getSession();
		if (activeSessionId === null || sessionId !== activeSessionId) {
			return new Response("Session not found", { status: 404 });
		}

		const cookies = new Bun.CookieMap(req.headers.get("Cookie") ?? "");
		const existingToken = cookies.get("queue_session");

		let token: string;
		const headers = new Headers();

		if (existingToken && checkUser(existingToken)) {
			token = existingToken;
		} else {
			token = generateUserToken();

			headers.set(
				"Set-Cookie",
				`queue_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`,
			);
		}

		const isUpgraded = server.upgrade(req, {
			headers,
			data: {
				sessionId,
				participantId: token,
			},
		});

		if (isUpgraded) {
			return;
		}

		return new Response("WebSocket upgrade failed", { status: 400 });
	},
	websocket: {
		data: {} as WebsocketData,
		message(ws, message) {
			if (typeof message !== "string") {
				ws.send(
					JSON.stringify({
						type: "error",
						message: "Expected a text message",
					}),
				);
				return;
			}

			const result = parse(message);
			if (!result.ok) {
				ws.send(
					JSON.stringify({
						type: "error",
						message: result.error,
					}),
				);
				return;
			}

			const { success, data } = userMessageSchema.safeParse(result.data);
			if (!success) {
				ws.send(
					JSON.stringify({
						type: "error",
						message: "Invalid Event type",
					}),
				);
				return;
			}

			if (data.type === "join") {
				const entry = {
					id: ws.data.participantId,
					name: data.name,
				};

				if (join(entry)) {
					ws.send(
						JSON.stringify({
							type: "queue",
							entries: getState(),
						}),
					);
					return;
				}

				ws.send(
					JSON.stringify({
						type: "error",
						message: "Already joined",
					}),
				);
			} else {
				if (leave(ws.data.participantId)) {
					ws.send(
						JSON.stringify({
							type: "queue",
							entries: getState(),
						}),
					);
					return;
				}

				ws.send(
					JSON.stringify({
						type: "error",
						message: "You are not part of the queue",
					}),
				);
			}
		},
		open(ws) {
			ws.send(
				JSON.stringify({
					type: "queue",
					entries: getState(),
				}),
			);
		},
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
