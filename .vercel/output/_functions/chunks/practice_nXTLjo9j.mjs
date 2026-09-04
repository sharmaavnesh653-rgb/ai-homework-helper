import { ct as __exportAll } from "./errors-data_BxAJjqls.mjs";
import { S as json, b as generateStructured, g as StudentFacingError, h as MISSING_KEY_MESSAGE, l as ValidationError, m as requireText, p as readJson, r as PRACTICE_SCHEMA, s as buildPracticePrompt, u as optionalText, v as fail, x as hasKey, y as friendlyError } from "./prompts_KXo0HgQp.mjs";
//#region src/pages/api/practice.ts
var practice_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/** Generates flashcards + a multiple-choice quiz for a topic. */
var POST = async ({ request }) => {
	if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);
	let topic;
	let subject;
	let grade = null;
	try {
		const body = await readJson(request);
		topic = requireText(body.topic, "topic", {
			max: 200,
			emptyMessage: "Pick a topic to practise."
		});
		subject = optionalText(body.subject, 60) ?? "general studies";
		grade = optionalText(body.grade, 60);
	} catch (error) {
		if (error instanceof ValidationError) return fail(error.message, error.status);
		return fail("Could not read that request.", 400);
	}
	try {
		const practice = await generateStructured({
			system: buildPracticePrompt(topic, subject, grade),
			content: `Create the practice set for "${topic}".`,
			schema: PRACTICE_SCHEMA,
			effort: "medium"
		});
		practice.quiz = practice.quiz.filter((q) => Array.isArray(q.options) && q.options.length >= 2 && q.answerIndex >= 0 && q.answerIndex < q.options.length);
		return json({ practice });
	} catch (error) {
		if (error instanceof StudentFacingError) return fail(error.message, 502);
		console.error("[api/practice]", error);
		return fail(friendlyError(error), 502);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/practice@_@ts
var page = () => practice_exports;
//#endregion
export { page };
