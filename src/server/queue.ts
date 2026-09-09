import type { Nullable } from "./types";

type QueueEntry = {
	id: string;
	name: string;
};

const queue: QueueEntry[] = [];
const store: Set<string> = new Set<string>();

function getState(): QueueEntry[] {
	return queue.map((entry) => ({ ...entry }));
}

function evict(): Nullable<QueueEntry> {
	const entry = queue.shift();

	if (!entry) {
		return null;
	}

	store.delete(entry.id);
	return entry;
}

function join(entry: QueueEntry): boolean {
	if (store.has(entry.id)) {
		return false;
	}

	store.add(entry.id);
	queue.push({ ...entry });

	return true;
}

function leave(id: string): boolean {
	if (!store.has(id)) {
		return false;
	}

	const index = queue.findIndex((entry) => entry.id === id);
	if (index > -1) {
		queue.splice(index, 1);
	}

	store.delete(id);
	return true;
}

export { evict, getState, join, leave };
