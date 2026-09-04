import { ct as __exportAll } from "./errors-data_BxAJjqls.mjs";
import { D as isDepth, O as isModeId, S as json, T as DEFAULT_MODE, _ as buildUserContent, b as generateStructured, c as buildSolvePrompt, d as parseAttachments, g as StudentFacingError, h as MISSING_KEY_MESSAGE, l as ValidationError, m as requireText, p as readJson, t as ANSWER_SCHEMA, u as optionalText, v as fail, x as hasKey, y as friendlyError } from "./prompts_KXo0HgQp.mjs";
//#region src/pages/api/solve.ts
var solve_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/**
* Primary solve endpoint. Returns a structured answer so the UI can render
* separated steps, formulas, concepts and a visual rather than a text blob.
*/
var POST = async ({ request }) => {
	if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);
	let question;
	let attachments;
	let mode = DEFAULT_MODE;
	let depth = "normal";
	let subject = null;
	let grade = null;
	try {
		const body = await readJson(request);
		attachments = parseAttachments(body.attachments);
		question = attachments.length > 0 ? optionalText(body.question, 6e3) ?? "Please read the attached work and help me with it." : requireText(body.question, "question", { emptyMessage: "Type a question or attach a photo of the problem." });
		if (isModeId(body.mode)) mode = body.mode;
		if (isDepth(body.depth)) depth = body.depth;
		subject = optionalText(body.subject, 60);
		grade = optionalText(body.grade, 60);
	} catch (error) {
		if (error instanceof ValidationError) return fail(error.message, error.status);
		return fail("Could not read that request.", 400);
	}
	try {
		const answer = await generateStructured({
			system: buildSolvePrompt(mode, depth, subject, grade),
			content: buildUserContent(question, attachments),
			schema: ANSWER_SCHEMA,
			effort: depth === "detailed" ? "high" : "medium"
		});
		if (mode === "hint" || mode === "check") {
			answer.finalAnswer = null;
			if (mode === "hint") answer.workedExample = null;
		}
		return json({
			answer,
			mode,
			depth
		});
	} catch (error) {
		if (error instanceof StudentFacingError) return fail(error.message, 502);
		console.error("[api/solve]", error);
		return fail(friendlyError(error), 502);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/solve@_@ts
var page = () => solve_exports;
//#endregion
export { page };
