// ability to add a person to the queue
export type Nullable<T> = T | null;

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export function parse(message: string): Result<string> {
	let data = null;
	try {
		data = JSON.parse(message);
	} catch {
		return { ok: false, error: "failed to parse json" };
	}

	return { ok: true, data };
}
