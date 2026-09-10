import type { Nullable } from "./utils";

let session: string | null = null;
const users: Set<string> = new Set();

function checkUser(id: string): boolean {
	return users.has(id);
}

function generateUserToken(): string {
	const userId = crypto.randomUUID();
	users.add(userId);

	return userId;
}

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

export {
	checkUser,
	generateSession,
	generateUserToken,
	getSession,
	removeSession,
};
