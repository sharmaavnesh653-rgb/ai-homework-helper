import { ct as __exportAll } from "./errors-data_BxAJjqls.mjs";
import { C as makeClient, E as MODEL, O as isModeId, T as DEFAULT_MODE, a as buildNotesChatPrompt, f as parseHistory, h as MISSING_KEY_MESSAGE, i as buildFollowUpPrompt, l as ValidationError, m as requireText, p as readJson, u as optionalText, v as fail, w as stopReasonMessage, x as hasKey, y as friendlyError } from "./prompts_KXo0HgQp.mjs";
//#region src/pages/api/chat.ts
var chat_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
var encoder = new TextEncoder();
function sse(event, data) {
	return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}
/**
* Streaming chat. Used for follow-up questions in the solver and for the
* chapter-scoped chat in the notes workspace (`context: "notes"`).
*/
var POST = async ({ request }) => {
	if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);
	let message;
	let history;
	let system;
	try {
		const body = await readJson(request);
		message = requireText(body.message, "message", { emptyMessage: "Type a follow-up question." });
		history = parseHistory(body.history);
		if (body.context === "notes") {
			const grade = optionalText(body.grade, 60) ?? "school";
			const subject = optionalText(body.subject, 60) ?? "this subject";
			const book = optionalText(body.book, 120) ?? "the textbook";
			const chapter = optionalText(body.chapter, 160) ?? "this chapter";
			system = buildNotesChatPrompt(grade, subject, book, chapter);
		} else {
			const mode = isModeId(body.mode) ? body.mode : DEFAULT_MODE;
			system = buildFollowUpPrompt(mode, optionalText(body.subject, 60), optionalText(body.grade, 60));
		}
	} catch (error) {
		if (error instanceof ValidationError) return fail(error.message, error.status);
		return fail("Could not read that request.", 400);
	}
	const client = makeClient();
	const stream = new ReadableStream({ async start(controller) {
		try {
			const messageStream = client.messages.stream({
				model: MODEL,
				max_tokens: 4e3,
				thinking: { type: "adaptive" },
				output_config: { effort: "low" },
				system,
				messages: [...history, {
					role: "user",
					content: message
				}]
			});
			for await (const event of messageStream) if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(sse("delta", { text: event.delta.text }));
			const final = await messageStream.finalMessage();
			const problem = stopReasonMessage(final.stop_reason);
			if (problem) controller.enqueue(sse("error", { message: problem }));
			controller.enqueue(sse("done", { stopReason: final.stop_reason }));
			controller.close();
		} catch (error) {
			console.error("[api/chat]", error);
			controller.enqueue(sse("error", { message: friendlyError(error) }));
			controller.enqueue(sse("done", { stopReason: "error" }));
			controller.close();
		}
	} });
	return new Response(stream, { headers: {
		"Content-Type": "text/event-stream; charset=utf-8",
		"Cache-Control": "no-cache, no-transform",
		Connection: "keep-alive"
	} });
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/chat@_@ts
var page = () => chat_exports;
//#endregion
export { page };
