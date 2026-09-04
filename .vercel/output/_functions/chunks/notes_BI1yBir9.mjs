import { ct as __exportAll } from "./errors-data_BxAJjqls.mjs";
import { S as json, b as generateStructured, g as StudentFacingError, h as MISSING_KEY_MESSAGE, l as ValidationError, m as requireText, n as NOTES_SCHEMA, o as buildNotesPrompt, p as readJson, v as fail, x as hasKey, y as friendlyError } from "./prompts_KXo0HgQp.mjs";
//#region src/pages/api/notes.ts
var notes_exports = /* @__PURE__ */ __exportAll({
	POST: () => POST,
	prerender: () => false
});
/** Generates structured revision notes for one chapter of one book. */
var POST = async ({ request }) => {
	if (!hasKey()) return fail(MISSING_KEY_MESSAGE, 503);
	let grade, subject, book, chapter;
	try {
		const body = await readJson(request);
		grade = requireText(body.grade, "grade", {
			max: 60,
			emptyMessage: "Choose your class or grade first."
		});
		subject = requireText(body.subject, "subject", {
			max: 60,
			emptyMessage: "Choose a subject first."
		});
		book = requireText(body.book, "book", {
			max: 160,
			emptyMessage: "Choose a textbook first."
		});
		chapter = requireText(body.chapter, "chapter", {
			max: 200,
			emptyMessage: "Choose a chapter first."
		});
	} catch (error) {
		if (error instanceof ValidationError) return fail(error.message, error.status);
		return fail("Could not read that request.", 400);
	}
	try {
		const notes = await generateStructured({
			system: buildNotesPrompt(grade, subject, book, chapter),
			content: `Write the revision notes for "${chapter}".`,
			schema: NOTES_SCHEMA,
			effort: "medium"
		});
		return json({ notes });
	} catch (error) {
		if (error instanceof StudentFacingError) return fail(error.message, 502);
		console.error("[api/notes]", error);
		return fail(friendlyError(error), 502);
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/notes@_@ts
var page = () => notes_exports;
//#endregion
export { page };
