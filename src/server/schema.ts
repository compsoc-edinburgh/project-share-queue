import z from "zod";

export const userMessageSchema = z.discriminatedUnion("type", [
	z.strictObject({
		type: z.literal("join"),
		name: z.string().trim().min(1).max(50),
	}),
	z.strictObject({
		type: z.literal("leave"),
	}),
]);

export type UserMessage = z.infer<typeof userMessageSchema>;
