import type { Nullable } from "./types";

let session: string | null = null;

function generateSession(): string {
	const sessionId = crypto.randomUUID();

	session = sessionId;

	return session;
}

function getSession(): Nullable<string> {
	return session;
}

function removeSession() {
	session = null;
}

export { generateSession, getSession, removeSession };
