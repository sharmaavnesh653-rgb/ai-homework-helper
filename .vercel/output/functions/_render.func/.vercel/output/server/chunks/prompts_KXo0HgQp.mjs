import { i as setOnSetGetEnv, n as getEnv$1, t as createInvalidVariablesError } from "./runtime_DlwkCk7i.mjs";
import Anthropic from "@anthropic-ai/sdk";
//#region node_modules/astro/dist/env/validators.js
function getEnvFieldType(options) {
	const optional = options.optional ? options.default !== void 0 ? false : true : false;
	let type;
	if (options.type === "enum") type = options.values.map((v) => `'${v}'`).join(" | ");
	else type = options.type;
	return `${type}${optional ? " | undefined" : ""}`;
}
var stringValidator = ({ max, min, length, url, includes, startsWith, endsWith }) => (input) => {
	if (typeof input !== "string") return {
		ok: false,
		errors: ["type"]
	};
	const errors = [];
	if (max !== void 0 && !(input.length <= max)) errors.push("max");
	if (min !== void 0 && !(input.length >= min)) errors.push("min");
	if (length !== void 0 && !(input.length === length)) errors.push("length");
	if (url !== void 0 && !URL.canParse(input)) errors.push("url");
	if (includes !== void 0 && !input.includes(includes)) errors.push("includes");
	if (startsWith !== void 0 && !input.startsWith(startsWith)) errors.push("startsWith");
	if (endsWith !== void 0 && !input.endsWith(endsWith)) errors.push("endsWith");
	if (errors.length > 0) return {
		ok: false,
		errors
	};
	return {
		ok: true,
		value: input
	};
};
var numberValidator = ({ gt, min, lt, max, int }) => (input) => {
	const num = Number.parseFloat(input ?? "");
	if (isNaN(num)) return {
		ok: false,
		errors: ["type"]
	};
	const errors = [];
	if (gt !== void 0 && !(num > gt)) errors.push("gt");
	if (min !== void 0 && !(num >= min)) errors.push("min");
	if (lt !== void 0 && !(num < lt)) errors.push("lt");
	if (max !== void 0 && !(num <= max)) errors.push("max");
	if (int !== void 0) {
		const isInt = Number.isInteger(num);
		if (!(int ? isInt : !isInt)) errors.push("int");
	}
	if (errors.length > 0) return {
		ok: false,
		errors
	};
	return {
		ok: true,
		value: num
	};
};
var booleanValidator = (input) => {
	const bool = input === "true" ? true : input === "false" ? false : void 0;
	if (typeof bool !== "boolean") return {
		ok: false,
		errors: ["type"]
	};
	return {
		ok: true,
		value: bool
	};
};
var enumValidator = ({ values }) => (input) => {
	if (!(typeof input === "string" ? values.includes(input) : false)) return {
		ok: false,
		errors: ["type"]
	};
	return {
		ok: true,
		value: input
	};
};
function selectValidator(options) {
	switch (options.type) {
		case "string": return stringValidator(options);
		case "number": return numberValidator(options);
		case "boolean": return booleanValidator;
		case "enum": return enumValidator(options);
	}
}
function validateEnvVariable(value, options) {
	const isOptional = options.optional || options.default !== void 0;
	if (isOptional && value === void 0) return {
		ok: true,
		value: options.default
	};
	if (!isOptional && value === void 0) return {
		ok: false,
		errors: ["missing"]
	};
	return selectValidator(options)(value);
}
//#endregion
//#region \0virtual:astro:env/internal
var schema = { "ANTHROPIC_API_KEY": {
	"context": "server",
	"access": "secret",
	"optional": true,
	"type": "string"
} };
//#endregion
//#region \0astro:env/server
/** @returns {string} */
var getEnv = (key) => {
	return getEnv$1(key);
};
var _internalGetSecret = (key) => {
	const rawVariable = getEnv(key);
	const variable = rawVariable === "" ? void 0 : rawVariable;
	const options = schema[key];
	const result = validateEnvVariable(variable, options);
	if (result.ok) return result.value;
	const type = getEnvFieldType(options);
	throw createInvalidVariablesError(key, type, result);
};
setOnSetGetEnv(() => {
	ANTHROPIC_API_KEY = _internalGetSecret("ANTHROPIC_API_KEY");
});
var ANTHROPIC_API_KEY = _internalGetSecret("ANTHROPIC_API_KEY");
//#endregion
//#region src/lib/types.ts
var MODEL = "claude-opus-5";
/** How much help the student asked for. */
var MODES = [
	{
		id: "guide",
		label: "Walk me through it",
		short: "Guide",
		blurb: "Step-by-step reasoning I can follow along with."
	},
	{
		id: "hint",
		label: "Just a hint",
		short: "Hint",
		blurb: "One nudge to get me unstuck — no answer."
	},
	{
		id: "check",
		label: "Check my work",
		short: "Check",
		blurb: "Find my mistake, but don't redo it for me."
	}
];
var DEFAULT_MODE = "guide";
function isModeId(v) {
	return MODES.some((m) => m.id === v);
}
function isDepth(v) {
	return v === "normal" || v === "simpler" || v === "detailed";
}
var MAX_QUESTION_LENGTH = 6e3;
var ACCEPTED_IMAGE_TYPES = [
	"image/png",
	"image/jpeg",
	"image/webp",
	"image/gif"
];
var ACCEPTED_DOC_TYPES = ["application/pdf"];
//#endregion
//#region src/lib/server/claude.ts
/**
* Shared server-side Claude helpers.
*
* Every route needs the same three things: a client, a way to turn SDK errors
* into a sentence a student can act on, and JSON response helpers.
*/
var MISSING_KEY_MESSAGE = "The server is missing ANTHROPIC_API_KEY. Copy .env.example to .env and add your key.";
function hasKey() {
	return Boolean(ANTHROPIC_API_KEY);
}
function makeClient() {
	return new Anthropic({ apiKey: ANTHROPIC_API_KEY });
}
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "Content-Type": "application/json" }
	});
}
function fail(message, status) {
	return json({ error: message }, status);
}
/** Map an SDK/transport error to something worth showing a student. */
function friendlyError(error) {
	if (error instanceof Anthropic.RateLimitError) return "The tutor is busy right now. Give it a few seconds and try again.";
	if (error instanceof Anthropic.AuthenticationError) return "The server API key was rejected. Check ANTHROPIC_API_KEY.";
	if (error instanceof Anthropic.PermissionDeniedError) return "This API key does not have access to the model this app uses.";
	if (error instanceof Anthropic.BadRequestError) return "The tutor rejected that request. If you attached a file, try a smaller one.";
	if (error instanceof Anthropic.APIConnectionError) return "Couldn't reach the tutor service. Check your connection and retry.";
	return "Something went wrong reaching the tutor. Please try again.";
}
/** Turn a refusal / truncation stop_reason into a message, or null if fine. */
function stopReasonMessage(stopReason) {
	if (stopReason === "refusal") return "I can't help with that one. Try rephrasing it as the specific schoolwork problem you're stuck on.";
	if (stopReason === "max_tokens") return "That answer got cut off. Try asking about one part of the problem at a time.";
	return null;
}
/**
* Build user content blocks. Documents and images must precede the text block
* so the model reads the attachment as context for the question.
*/
function buildUserContent(text, attachments = []) {
	const blocks = [];
	for (const file of attachments) if (file.kind === "image") blocks.push({
		type: "image",
		source: {
			type: "base64",
			media_type: file.mediaType,
			data: file.data
		}
	});
	else blocks.push({
		type: "document",
		source: {
			type: "base64",
			media_type: "application/pdf",
			data: file.data
		}
	});
	blocks.push({
		type: "text",
		text
	});
	return blocks;
}
/**
* Pull a JSON object out of a model reply.
*
* `output_config.format` enforces the shape on the first-party API, but some
* gateways and proxies silently drop the parameter and return prose or a
* ```json fenced block instead. Rather than failing the request, strip the
* fence and take the outermost balanced object.
*/
function extractJson(text) {
	const trimmed = text.trim();
	try {
		return JSON.parse(trimmed);
	} catch {}
	const fenced = trimmed.match(/^```(?:json)?\s*\n([\s\S]*?)\n?```$/);
	if (fenced) try {
		return JSON.parse(fenced[1].trim());
	} catch {}
	const start = trimmed.indexOf("{");
	if (start !== -1) {
		let depth = 0;
		let inString = false;
		let escaped = false;
		for (let i = start; i < trimmed.length; i++) {
			const ch = trimmed[i];
			if (escaped) {
				escaped = false;
				continue;
			}
			if (ch === "\\") {
				escaped = true;
				continue;
			}
			if (ch === "\"") {
				inString = !inString;
				continue;
			}
			if (inString) continue;
			if (ch === "{") depth++;
			else if (ch === "}") {
				depth--;
				if (depth === 0) try {
					return JSON.parse(trimmed.slice(start, i + 1));
				} catch {
					break;
				}
			}
		}
	}
	throw new StudentFacingError("The tutor's reply came back malformed. Please try again.");
}
/** Names of top-level keys a schema declares as required. */
function requiredKeys(schema) {
	const req = schema.required;
	return Array.isArray(req) ? req.filter((k) => typeof k === "string") : [];
}
/**
* One structured-output call.
*
* Sends `output_config.format` (authoritative where supported) AND restates the
* schema in the system prompt, so a gateway that ignores the parameter still
* produces the right shape. Retries once with a blunter instruction if the first
* reply is missing required keys.
*/
async function generateStructured(opts) {
	const client = makeClient();
	const needed = requiredKeys(opts.schema);
	const shapeRule = `\n\nOUTPUT FORMAT — this is mandatory.\nReply with a single JSON object and nothing else: no prose before or after it, and no markdown code fence. It must validate against this JSON Schema:\n${JSON.stringify(opts.schema)}`;
	const attempt = async (extra) => {
		const message = await client.messages.create({
			model: MODEL,
			max_tokens: opts.maxTokens ?? 16e3,
			thinking: { type: "adaptive" },
			output_config: {
				effort: opts.effort ?? "medium",
				format: {
					type: "json_schema",
					schema: opts.schema
				}
			},
			system: opts.system + shapeRule + extra,
			messages: [{
				role: "user",
				content: opts.content
			}]
		});
		const refusal = stopReasonMessage(message.stop_reason);
		if (refusal) throw new StudentFacingError(refusal);
		return message.content.filter((b) => b.type === "text").map((b) => b.text).join("");
	};
	const looksComplete = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value) && needed.every((k) => k in value);
	let parsed;
	try {
		parsed = extractJson(await attempt(""));
	} catch (error) {
		if (!(error instanceof StudentFacingError)) throw error;
		parsed = null;
	}
	if (looksComplete(parsed)) return parsed;
	const retry = extractJson(await attempt(`\n\nYour previous reply was not a valid JSON object with these top-level keys: ${needed.join(", ")}. Output only the JSON object this time.`));
	if (!looksComplete(retry)) throw new StudentFacingError("The tutor's reply came back in the wrong shape. Please try again.");
	return retry;
}
/** An error whose message is already safe to show the student. */
var StudentFacingError = class extends Error {};
//#endregion
//#region src/lib/server/validate.ts
/**
* Request validation shared by the API routes. Keeping it here means a bad
* payload gets the same clear message whichever endpoint receives it.
*/
var ValidationError = class extends Error {
	status;
	constructor(message, status = 400) {
		super(message);
		this.status = status;
	}
};
async function readJson(request) {
	try {
		const body = await request.json();
		if (!body || typeof body !== "object" || Array.isArray(body)) throw new ValidationError("Expected a JSON object.");
		return body;
	} catch (error) {
		if (error instanceof ValidationError) throw error;
		throw new ValidationError("Expected a JSON body.");
	}
}
function requireText(value, field, { max = MAX_QUESTION_LENGTH, emptyMessage = `Please include a ${field}.` } = {}) {
	if (typeof value !== "string" || value.trim().length === 0) throw new ValidationError(emptyMessage);
	if (value.length > max) throw new ValidationError(`That ${field} is longer than ${max} characters. Trim it to the part you need help with.`, 413);
	return value.trim();
}
function optionalText(value, max = 200) {
	if (typeof value !== "string") return null;
	const trimmed = value.trim();
	if (!trimmed) return null;
	return trimmed.slice(0, max);
}
/** Estimate decoded byte length of a base64 payload without decoding it. */
function base64Bytes(data) {
	const padding = data.endsWith("==") ? 2 : data.endsWith("=") ? 1 : 0;
	return Math.floor(data.length * 3 / 4) - padding;
}
function parseAttachments(value) {
	if (value == null) return [];
	if (!Array.isArray(value)) throw new ValidationError("Attachments must be an array.");
	if (value.length > 4) throw new ValidationError("Please attach at most 4 files.");
	return value.map((raw, i) => {
		if (!raw || typeof raw !== "object") throw new ValidationError(`Attachment ${i + 1} is malformed.`);
		const { mediaType, data, name } = raw;
		if (typeof mediaType !== "string" || typeof data !== "string" || !data) throw new ValidationError(`Attachment ${i + 1} is missing its type or data.`);
		const isImage = ACCEPTED_IMAGE_TYPES.includes(mediaType);
		const isDoc = ACCEPTED_DOC_TYPES.includes(mediaType);
		if (!isImage && !isDoc) throw new ValidationError(`"${mediaType}" isn't supported. Attach a PNG, JPEG, WebP, GIF or PDF.`);
		if (base64Bytes(data) > 4194304) throw new ValidationError(`"${typeof name === "string" ? name : "That file"}" is over 4MB. Please attach a smaller one.`, 413);
		return {
			kind: isImage ? "image" : "pdf",
			mediaType,
			data,
			name: typeof name === "string" && name ? name.slice(0, 120) : `attachment-${i + 1}`
		};
	});
}
/** Conversation history for follow-up turns. */
function parseHistory(value) {
	if (value == null) return [];
	if (!Array.isArray(value)) return [];
	return value.filter((t) => Boolean(t) && typeof t === "object" && typeof t.content === "string" && (t.role === "user" || t.role === "assistant")).slice(-20).map((t) => ({
		role: t.role,
		content: t.content.slice(0, 8e3)
	}));
}
//#endregion
//#region src/lib/prompts.ts
var BASE = `You are a homework tutor for school and early-university students. Your job is to build the student's understanding, not to hand over work they can copy.

Rules that always apply:
- Break reasoning into short, ordered steps. Each step does ONE thing and says why it comes next.
- Name the rule or concept you are applying ("the distributive property", "conservation of momentum", "a thesis statement") so the student can recognise it next time.
- If something needed is missing (an equation, the passage, the assignment brief), say what you need in "understanding" and keep steps minimal rather than inventing the problem.
- If you are not confident an answer is correct, say so plainly instead of asserting it.
- Never claim the student's work is correct without actually checking it.
- If the request is not schoolwork, say so briefly and stop.

Formatting:
- Write formulas as KaTeX WITHOUT surrounding dollar signs. Example: "x = \\\\frac{-b \\\\pm \\\\sqrt{b^2-4ac}}{2a}".
- Put prose in the "detail" fields and keep maths in "formula" fields.
- "checkYourself" must be a question the student answers on their own. Never answer it.
- "followUps" are 3 short questions the STUDENT might ask next, written in their voice.
- Add a "visual" only when a diagram genuinely helps (a chart for data or trends, a table for comparisons, a concept-map for how ideas connect, a labelled diagram for parts of a structure). Otherwise set it to null.`;
var MODE_RULES = {
	guide: `MODE: WALKTHROUGH. Show the full reasoning so the student can follow how the solution is built. Fill in "finalAnswer" with the result.`,
	hint: `MODE: HINT ONLY. This is a hard constraint, not a preference.
- Give at most TWO steps, and they must point at what to notice or try next — not perform the solution.
- "finalAnswer" MUST be null. Do not state the answer anywhere, including inside step details, the formula summary, or the worked example.
- Do not lay out the remaining steps. If the student asks again, they get the next hint, not the solution.
- Set "workedExample" to null.`,
	check: `MODE: CHECK MY WORK. The student is submitting their own attempt.
- Step 1 must name specifically what they got RIGHT (not "good start").
- Then identify the FIRST place the reasoning breaks down and name the misconception behind it.
- Tell them what to reconsider. Do NOT produce a corrected version of their work, and do not restate their answer fixed. "finalAnswer" must be null.
- If the work is entirely correct, say so and confirm the step that was most likely to go wrong.`
};
var DEPTH_RULES = {
	normal: "",
	simpler: `\n\nDEPTH: SIMPLER. Re-explain for someone who found the last explanation confusing. Use plainer words, shorter steps, and a concrete everyday comparison. Do not use jargon without defining it in the same sentence.`,
	detailed: `\n\nDEPTH: DETAILED. Expand the reasoning. Show intermediate algebra or logic that is usually skipped, state assumptions explicitly, and add a "note" to any step where students commonly slip.`
};
function buildSolvePrompt(mode, depth = "normal", subject, grade) {
	const context = [subject ? `The student selected the subject: ${subject}.` : null, grade ? `They are studying at level: ${grade}. Pitch vocabulary accordingly.` : null].filter(Boolean).join(" ");
	return [
		BASE,
		MODE_RULES[mode] + DEPTH_RULES[depth],
		context
	].filter(Boolean).join("\n\n");
}
function buildFollowUpPrompt(mode, subject, grade) {
	return `${buildSolvePrompt(mode, "normal", subject, grade)}

You are now continuing a tutoring conversation. Answer the student's follow-up in plain prose (no JSON), staying in the same teaching stance. Keep it tight — a few short paragraphs at most, and use a numbered list only when the answer really is sequential. Write formulas as plain readable text here, not KaTeX. If the mode is hint, you still must not give away the final answer.`;
}
function buildNotesPrompt(grade, subject, book, chapter) {
	return `You are an experienced ${subject} teacher writing revision notes for a ${grade} student, covering the chapter "${chapter}" from "${book}".

Write notes the student can revise from the night before a test:
- 4 to 6 sections, each with a clear heading and 3 to 5 key points.
- Include definitions for the terms a student must be able to state.
- Include formulas where the chapter has them, as KaTeX WITHOUT dollar signs.
- Give one concrete worked example or illustration per section where it helps.
- "importantQuestions" are the 5 questions most likely to appear on a test for this chapter.
- "quickRevision" is a 5-item last-minute checklist of the things most often forgotten.

Be accurate and specific to the chapter. Do not pad with generic study advice.`;
}
function buildNotesChatPrompt(grade, subject, book, chapter) {
	return `You are tutoring a ${grade} student on the chapter "${chapter}" from "${book}" (${subject}).

Every answer must stay anchored to this chapter — if the student asks about something outside it, answer briefly and connect it back to the chapter. Explain the way a patient teacher would: short paragraphs, concrete examples, and name the concept you are using. Write formulas as plain readable text. Never just assert a fact the student asked you to prove; show why.`;
}
function buildPracticePrompt(topic, subject, grade) {
	return `Create practice material on "${topic}" (${subject})${grade ? ` for a ${grade} student` : ""}.

- 8 flashcards. Fronts are short prompts or terms; backs are the answer plus the one-line reason it is so.
- 5 multiple-choice questions, each with exactly 4 options and one correct answer.
- Distractors must be plausible and reflect real student misconceptions — never filler.
- Each explanation says why the right answer is right AND why the tempting wrong one is wrong.`;
}
var ANSWER_SCHEMA = {
	type: "object",
	additionalProperties: false,
	properties: {
		understanding: { type: "string" },
		steps: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					title: { type: "string" },
					detail: { type: "string" },
					formula: { type: "string" },
					note: { type: "string" }
				},
				required: ["title", "detail"]
			}
		},
		concepts: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					term: { type: "string" },
					meaning: { type: "string" }
				},
				required: ["term", "meaning"]
			}
		},
		formulaSummary: { type: "string" },
		visual: { anyOf: [
			{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: { const: "table" },
					caption: { type: "string" },
					columns: {
						type: "array",
						items: { type: "string" }
					},
					rows: {
						type: "array",
						items: {
							type: "array",
							items: { type: "string" }
						}
					}
				},
				required: [
					"kind",
					"columns",
					"rows"
				]
			},
			{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: { const: "chart" },
					chartType: { enum: [
						"bar",
						"line",
						"scatter"
					] },
					caption: { type: "string" },
					xLabel: { type: "string" },
					yLabel: { type: "string" },
					series: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								name: { type: "string" },
								points: {
									type: "array",
									items: {
										type: "object",
										additionalProperties: false,
										properties: {
											x: { type: "number" },
											y: { type: "number" }
										},
										required: ["x", "y"]
									}
								}
							},
							required: ["name", "points"]
						}
					}
				},
				required: [
					"kind",
					"chartType",
					"series"
				]
			},
			{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: { const: "concept-map" },
					caption: { type: "string" },
					nodes: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								id: { type: "string" },
								label: { type: "string" }
							},
							required: ["id", "label"]
						}
					},
					links: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								from: { type: "string" },
								to: { type: "string" },
								label: { type: "string" }
							},
							required: ["from", "to"]
						}
					}
				},
				required: [
					"kind",
					"nodes",
					"links"
				]
			},
			{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: { const: "labelled" },
					caption: { type: "string" },
					subject: { type: "string" },
					parts: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								label: { type: "string" },
								describes: { type: "string" }
							},
							required: ["label", "describes"]
						}
					}
				},
				required: [
					"kind",
					"subject",
					"parts"
				]
			},
			{ type: "null" }
		] },
		workedExample: { anyOf: [{
			type: "object",
			additionalProperties: false,
			properties: {
				prompt: { type: "string" },
				walkthrough: { type: "string" }
			},
			required: ["prompt", "walkthrough"]
		}, { type: "null" }] },
		finalAnswer: { anyOf: [{ type: "string" }, { type: "null" }] },
		checkYourself: { type: "string" },
		followUps: {
			type: "array",
			items: { type: "string" }
		}
	},
	required: [
		"understanding",
		"steps",
		"concepts",
		"checkYourself",
		"followUps"
	]
};
var NOTES_SCHEMA = {
	type: "object",
	additionalProperties: false,
	properties: {
		title: { type: "string" },
		overview: { type: "string" },
		sections: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					heading: { type: "string" },
					keyPoints: {
						type: "array",
						items: { type: "string" }
					},
					definitions: {
						type: "array",
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								term: { type: "string" },
								meaning: { type: "string" }
							},
							required: ["term", "meaning"]
						}
					},
					formulas: {
						type: "array",
						items: { type: "string" }
					},
					example: { type: "string" }
				},
				required: ["heading", "keyPoints"]
			}
		},
		importantQuestions: {
			type: "array",
			items: { type: "string" }
		},
		quickRevision: {
			type: "array",
			items: { type: "string" }
		}
	},
	required: [
		"title",
		"overview",
		"sections",
		"importantQuestions",
		"quickRevision"
	]
};
var PRACTICE_SCHEMA = {
	type: "object",
	additionalProperties: false,
	properties: {
		topic: { type: "string" },
		flashcards: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					front: { type: "string" },
					back: { type: "string" }
				},
				required: ["front", "back"]
			}
		},
		quiz: {
			type: "array",
			items: {
				type: "object",
				additionalProperties: false,
				properties: {
					question: { type: "string" },
					options: {
						type: "array",
						items: { type: "string" }
					},
					answerIndex: { type: "integer" },
					explanation: { type: "string" }
				},
				required: [
					"question",
					"options",
					"answerIndex",
					"explanation"
				]
			}
		}
	},
	required: [
		"topic",
		"flashcards",
		"quiz"
	]
};
//#endregion
export { makeClient as C, isDepth as D, MODEL as E, isModeId as O, json as S, DEFAULT_MODE as T, buildUserContent as _, buildNotesChatPrompt as a, generateStructured as b, buildSolvePrompt as c, parseAttachments as d, parseHistory as f, StudentFacingError as g, MISSING_KEY_MESSAGE as h, buildFollowUpPrompt as i, ValidationError as l, requireText as m, NOTES_SCHEMA as n, buildNotesPrompt as o, readJson as p, PRACTICE_SCHEMA as r, buildPracticePrompt as s, ANSWER_SCHEMA as t, optionalText as u, fail as v, stopReasonMessage as w, hasKey as x, friendlyError as y };
