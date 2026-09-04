import { $ as AggregateError, A as MissingImageDimension, C as InvalidImageService, U as RemoteImageNotAllowed, X as UnsupportedImageFormat, Y as UnsupportedImageConversion, Z as errors_data_exports, at as isAstroError, b as InvalidComponentArgs, c as ExpectedImage, ct as __exportAll, et as AstroError, f as FontFamilyNotFound, it as MarkdownError, k as MissingGetFontFileRequestUrl, l as ExpectedImageOptions, nt as CSSError, ot as createSafeError, p as FontFileUrlNotFound, rt as CompilerError, st as positionAt, tt as AstroUserError, u as ExpectedNotESMImage, v as ImageMissingAlt, w as LocalImageUsedWrongly, y as IncompatibleDescriptorOptions } from "./errors-data_BxAJjqls.mjs";
import { _ as inferRemoteSize$1, b as isRemoteAllowed, c as isRemotePath, f as removeQueryString, l as joinPaths, v as fetchWithRedirects } from "./path_DpVx2572.mjs";
import { _ as unescapeHTML, d as maybeRenderHead, f as addAttribute, n as spreadAttributes, t as createMetadata, u as renderTemplate, y as createAstro } from "./server_ozdokX4S.mjs";
import * as mime from "mrmime";
//#region node_modules/astro/dist/core/errors/zod-error-map.js
var errorMap = (issue) => {
	const baseErrorPath = flattenErrorPath(issue.path ?? []);
	if (issue.code === "invalid_union") {
		let typeOrLiteralErrByPath = /* @__PURE__ */ new Map();
		for (const unionError of issue.errors.flat()) if (unionError.code === "invalid_type") {
			const flattenedErrorPath = flattenErrorPath(unionError.path);
			if (typeOrLiteralErrByPath.has(flattenedErrorPath)) typeOrLiteralErrByPath.get(flattenedErrorPath).expected.push(unionError.expected);
			else typeOrLiteralErrByPath.set(flattenedErrorPath, {
				code: unionError.code,
				received: unionError.received,
				expected: [unionError.expected],
				message: unionError.message
			});
		}
		const messages = [prefix(baseErrorPath, "Did not match union.")];
		const details = [...typeOrLiteralErrByPath.entries()].filter(([, error]) => error.expected.length === issue.errors.flat().length).map(([key, error]) => key === baseErrorPath ? `> ${getTypeOrLiteralMsg(error)}` : `> ${prefix(key, getTypeOrLiteralMsg(error))}`);
		if (details.length === 0) {
			if ("discriminator" in issue && issue.discriminator && "options" in issue) {
				const options = issue.options;
				if (Array.isArray(options)) {
					details.push(`> Expected \`${issue.discriminator}\` to be ${options.map((o) => `\`${stringify(o)}\``).join(" | ")}`);
					details.push("> Received `" + stringify(issue.input) + "`");
				}
			}
		}
		if (details.length === 0) {
			const expectedShapes = [];
			for (const unionErrors of issue.errors) {
				const expectedShape = [];
				for (const _issue of unionErrors) {
					if (_issue.code === "invalid_union") return errorMap(_issue);
					const relativePath = flattenErrorPath(_issue.path).replace(baseErrorPath, "").replace(leadingPeriod, "");
					if (_issue.code === "custom" && _issue.message && _issue.message.includes("security.csp")) expectedShape.push(_issue.message);
					else if ("expected" in _issue && typeof _issue.expected === "string") expectedShape.push(relativePath ? `${relativePath}: ${_issue.expected}` : _issue.expected);
					else if ("values" in _issue) expectedShape.push(..._issue.values.filter((v) => typeof v === "string").map((v) => `"${v}"`));
					else if (relativePath) expectedShape.push(relativePath);
				}
				if (expectedShape.length === 1 && !expectedShape[0]?.includes(":")) expectedShapes.push(expectedShape.join(""));
				else if (expectedShape.length > 0) expectedShapes.push(`{ ${expectedShape.join("; ")} }`);
			}
			if (expectedShapes.length) {
				details.push("> Expected type `" + expectedShapes.join(" | ") + "`");
				details.push("> Received `" + stringify(issue.input) + "`");
			}
		}
		return { message: messages.concat(details).join("\n") };
	} else if (issue.code === "invalid_key") {
		const keyIssues = issue.issues;
		if (Array.isArray(keyIssues) && keyIssues.length > 0) return { message: prefix(baseErrorPath, keyIssues[0].message || "Invalid key in record") };
		return { message: prefix(baseErrorPath, "Invalid key in record") };
	} else if (issue.code === "invalid_element") {
		const elementIssues = issue.issues;
		if (Array.isArray(elementIssues) && elementIssues.length > 0) return { message: prefix(baseErrorPath, elementIssues[0].message || "Invalid element") };
		return { message: prefix(baseErrorPath, "Invalid element") };
	} else if (issue.code === "invalid_type") return { message: prefix(baseErrorPath, getTypeOrLiteralMsg({
		code: issue.code,
		received: typeof issue.input,
		expected: [issue.expected],
		message: issue.message
	})) };
	else if (issue.message) return { message: prefix(baseErrorPath, issue.message) };
};
var getTypeOrLiteralMsg = (error) => {
	if (typeof error.received === "undefined" || error.received === "undefined") return error.message ?? "Required";
	const expectedDeduped = new Set(error.expected);
	switch (error.code) {
		case "invalid_type": return `Expected type \`${unionExpectedVals(expectedDeduped)}\`, received \`${stringify(error.received)}\``;
		case "invalid_literal": return `Expected \`${unionExpectedVals(expectedDeduped)}\`, received \`${stringify(error.received)}\``;
	}
};
var prefix = (key, msg) => key.length ? `**${key}**: ${msg}` : msg;
var unionExpectedVals = (expectedVals) => [...expectedVals].map((expectedVal) => stringify(expectedVal)).join(" | ");
var flattenErrorPath = (errorPath) => errorPath.join(".");
var stringify = (val) => {
	const json = JSON.stringify(val, null, 1);
	if (json === void 0) return String(val);
	return json.split(newlinePlusWhitespace).join(" ");
};
var newlinePlusWhitespace = /\n\s*/;
var leadingPeriod = /^\./;
//#endregion
//#region node_modules/astro/dist/core/errors/index.js
var errors_exports = /* @__PURE__ */ __exportAll({
	AggregateError: () => AggregateError,
	AstroError: () => AstroError,
	AstroErrorData: () => errors_data_exports,
	AstroUserError: () => AstroUserError,
	CSSError: () => CSSError,
	CompilerError: () => CompilerError,
	MarkdownError: () => MarkdownError,
	createSafeError: () => createSafeError,
	errorMap: () => errorMap,
	isAstroError: () => isAstroError,
	positionAt: () => positionAt
});
//#endregion
//#region node_modules/astro/dist/assets/utils/imageKind.js
var imageKind_exports = /* @__PURE__ */ __exportAll({
	isESMImportedImage: () => isESMImportedImage,
	isRemoteImage: () => isRemoteImage,
	resolveSrc: () => resolveSrc
});
function isESMImportedImage(src) {
	return typeof src === "object" || typeof src === "function" && "src" in src;
}
function isRemoteImage(src) {
	return typeof src === "string";
}
async function resolveSrc(src) {
	if (typeof src === "object" && "then" in src) {
		const resource = await src;
		return resource.default ?? resource;
	}
	return src;
}
//#endregion
//#region node_modules/astro/dist/runtime/server/astro-component.js
function validateArgs(args) {
	if (args.length !== 3) return false;
	if (!args[0] || typeof args[0] !== "object") return false;
	return true;
}
function baseCreateComponent(cb, moduleId, propagation) {
	const name = moduleId?.split("/").pop()?.replace(".astro", "") ?? "";
	const fn = (...args) => {
		if (!validateArgs(args)) throw new AstroError({
			...InvalidComponentArgs,
			message: InvalidComponentArgs.message(name)
		});
		return cb(...args);
	};
	Object.defineProperty(fn, "name", {
		value: name,
		writable: false
	});
	fn.isAstroComponentFactory = true;
	fn.moduleId = moduleId;
	fn.propagation = propagation;
	return fn;
}
function createComponentWithOptions(opts) {
	return baseCreateComponent(opts.factory, opts.moduleId, opts.propagation);
}
function createComponent(arg1, moduleId, propagation) {
	if (typeof arg1 === "function") return baseCreateComponent(arg1, moduleId, propagation);
	else return createComponentWithOptions(arg1);
}
var VALID_SUPPORTED_FORMATS = [
	"jpeg",
	"jpg",
	"png",
	"tiff",
	"webp",
	"gif",
	"svg",
	"avif"
];
var DEFAULT_OUTPUT_FORMAT = "webp";
var DEFAULT_HASH_PROPS = [
	"src",
	"width",
	"height",
	"format",
	"quality",
	"fit",
	"position",
	"background"
];
//#endregion
//#region node_modules/astro/dist/assets/layout.js
var DEFAULT_RESOLUTIONS = [
	640,
	750,
	828,
	960,
	1080,
	1280,
	1668,
	1920,
	2048,
	2560,
	3200,
	3840,
	4480,
	5120,
	6016
];
var LIMITED_RESOLUTIONS = [
	640,
	750,
	828,
	1080,
	1280,
	1668,
	2048,
	2560
];
var getWidths = ({ width, layout, breakpoints = DEFAULT_RESOLUTIONS, originalWidth }) => {
	const smallerThanOriginal = (w) => !originalWidth || w <= originalWidth;
	if (layout === "full-width") return breakpoints.filter(smallerThanOriginal);
	if (!width) return [];
	const doubleWidth = width * 2;
	const maxSize = originalWidth ? Math.min(doubleWidth, originalWidth) : doubleWidth;
	if (layout === "fixed") return originalWidth && width > originalWidth ? [originalWidth] : [width, maxSize];
	if (layout === "constrained") return [
		width,
		doubleWidth,
		...breakpoints
	].filter((w) => w <= maxSize).sort((a, b) => a - b);
	return [];
};
var getSizesAttribute = ({ width, layout }) => {
	if (!width || !layout) return;
	switch (layout) {
		case "constrained": return `(min-width: ${width}px) ${width}px, 100vw`;
		case "fixed": return `${width}px`;
		case "full-width": return `100vw`;
		default: return;
	}
};
//#endregion
//#region node_modules/astro/dist/assets/utils/inferSourceFormat.js
var DATA_PREFIX = "data:";
function inferSourceFormat(src) {
	if (src.startsWith(DATA_PREFIX)) {
		const sepIndex = src.indexOf(";");
		const commaIndex = src.indexOf(",");
		const mimeEnd = sepIndex === -1 ? commaIndex : commaIndex === -1 ? sepIndex : Math.min(sepIndex, commaIndex);
		if (mimeEnd === -1) return void 0;
		const mime = src.slice(5, mimeEnd);
		if (mime === "image/svg+xml") return "svg";
		return mime.split("/")[1] || void 0;
	}
	try {
		const cleanSrc = removeQueryString(src).split("#")[0];
		const lastSlash = cleanSrc.lastIndexOf("/");
		const basename = lastSlash === -1 ? cleanSrc : cleanSrc.slice(lastSlash + 1);
		const lastDot = basename.lastIndexOf(".");
		if (lastDot === -1) return void 0;
		return basename.slice(lastDot + 1).toLowerCase();
	} catch {
		return;
	}
}
function resolveDefaultOutputFormat(sourceFormat) {
	return sourceFormat === "svg" ? "svg" : DEFAULT_OUTPUT_FORMAT;
}
//#endregion
//#region node_modules/astro/dist/assets/services/service.js
function isLocalService(service) {
	if (!service) return false;
	return "transform" in service;
}
function parseQuality(quality) {
	let result = Number.parseInt(quality);
	if (Number.isNaN(result)) return quality;
	return result;
}
var sortNumeric = (a, b) => a - b;
function verifyOptions(options) {
	if (!options.src || !isRemoteImage(options.src) && !isESMImportedImage(options.src)) throw new AstroError({
		...ExpectedImage,
		message: ExpectedImage.message(JSON.stringify(options.src), typeof options.src, JSON.stringify(options, (_, v) => v === void 0 ? null : v))
	});
	if (!isESMImportedImage(options.src)) {
		if (options.src.startsWith("/@fs/") || !isRemotePath(options.src) && !options.src.startsWith("/")) throw new AstroError({
			...LocalImageUsedWrongly,
			message: LocalImageUsedWrongly.message(options.src)
		});
		let missingDimension;
		if (!options.width && !options.height) missingDimension = "both";
		else if (!options.width && options.height) missingDimension = "width";
		else if (options.width && !options.height) missingDimension = "height";
		if (missingDimension) throw new AstroError({
			...MissingImageDimension,
			message: MissingImageDimension.message(missingDimension, options.src)
		});
	} else {
		if (!VALID_SUPPORTED_FORMATS.includes(options.src.format)) throw new AstroError({
			...UnsupportedImageFormat,
			message: UnsupportedImageFormat.message(options.src.format, options.src.src, VALID_SUPPORTED_FORMATS)
		});
		if (options.widths && options.densities) throw new AstroError(IncompatibleDescriptorOptions);
		if (options.src.format !== "svg" && options.format === "svg") throw new AstroError(UnsupportedImageConversion);
	}
}
var baseService = {
	propertiesToHash: DEFAULT_HASH_PROPS,
	validateOptions(options) {
		verifyOptions(options);
		if (!options.format) {
			if (isESMImportedImage(options.src)) options.format = resolveDefaultOutputFormat(options.src.format);
			else {
				const inferred = inferSourceFormat(options.src);
				if (inferred) options.format = resolveDefaultOutputFormat(inferred);
			}
		}
		if (options.width) options.width = Math.round(options.width);
		if (options.height) options.height = Math.round(options.height);
		if (options.layout) delete options.layout;
		if (options.fit === "none") delete options.fit;
		return options;
	},
	getHTMLAttributes(options) {
		const { targetWidth, targetHeight } = getTargetDimensions(options);
		const { src, width, height, format, quality, densities, widths, formats, layout, priority, fit, position, background, ...attributes } = options;
		return {
			...attributes,
			width: targetWidth,
			height: targetHeight,
			loading: attributes.loading ?? "lazy",
			decoding: attributes.decoding ?? "async"
		};
	},
	getSrcSet(options) {
		const { targetWidth, targetHeight } = getTargetDimensions(options);
		const aspectRatio = targetWidth / targetHeight;
		const { widths, densities } = options;
		const targetFormat = options.format;
		let transformedWidths = (widths ?? []).sort(sortNumeric);
		let imageWidth = options.width;
		let maxWidth = Number.POSITIVE_INFINITY;
		if (isESMImportedImage(options.src)) {
			imageWidth = options.src.width;
			maxWidth = imageWidth;
			if (transformedWidths.length > 0 && transformedWidths.at(-1) > maxWidth) {
				transformedWidths = transformedWidths.filter((width) => width <= maxWidth);
				transformedWidths.push(maxWidth);
			}
		}
		transformedWidths = Array.from(new Set(transformedWidths));
		const { width: transformWidth, height: transformHeight, ...transformWithoutDimensions } = options;
		let allWidths = [];
		if (densities) {
			const densityValues = densities.map((density) => {
				if (typeof density === "number") return density;
				else return Number.parseFloat(density);
			});
			allWidths = densityValues.sort(sortNumeric).map((density) => Math.round(targetWidth * density)).map((width, index) => ({
				width,
				descriptor: `${densityValues[index]}x`
			}));
		} else if (transformedWidths.length > 0) allWidths = transformedWidths.map((width) => ({
			width,
			descriptor: `${width}w`
		}));
		return allWidths.map(({ width, descriptor }) => {
			const height = Math.round(width / aspectRatio);
			return {
				transform: {
					...transformWithoutDimensions,
					width,
					height
				},
				descriptor,
				attributes: targetFormat ? { type: `image/${targetFormat}` } : {}
			};
		});
	},
	getURL(options, imageConfig) {
		const searchParams = new URLSearchParams();
		if (isESMImportedImage(options.src)) searchParams.append("href", options.src.src);
		else if (isRemoteAllowed(options.src, imageConfig)) searchParams.append("href", options.src);
		else return options.src;
		Object.entries({
			w: "width",
			h: "height",
			q: "quality",
			f: "format",
			fit: "fit",
			position: "position",
			background: "background"
		}).forEach(([param, key]) => {
			options[key] && searchParams.append(param, options[key].toString());
		});
		let url = `${joinPaths("/", imageConfig.endpoint.route)}?${searchParams}`;
		if (imageConfig.assetQueryParams) {
			const assetQueryString = imageConfig.assetQueryParams.toString();
			if (assetQueryString) url += "&" + assetQueryString;
		}
		return url;
	},
	parseURL(url) {
		const params = url.searchParams;
		if (!params.has("href")) return;
		return {
			src: params.get("href"),
			width: params.has("w") ? Number.parseInt(params.get("w")) : void 0,
			height: params.has("h") ? Number.parseInt(params.get("h")) : void 0,
			format: params.has("f") ? params.get("f") : void 0,
			quality: params.get("q"),
			fit: params.get("fit"),
			position: params.get("position") ?? void 0,
			background: params.get("background") ?? void 0
		};
	},
	getRemoteSize(url, imageConfig) {
		return inferRemoteSize$1(url, imageConfig);
	}
};
function getTargetDimensions(options) {
	let targetWidth = options.width;
	let targetHeight = options.height;
	if (isESMImportedImage(options.src)) {
		const aspectRatio = options.src.width / options.src.height;
		if (targetHeight && !targetWidth) targetWidth = Math.round(targetHeight * aspectRatio);
		else if (targetWidth && !targetHeight) targetHeight = Math.round(targetWidth / aspectRatio);
		else if (!targetWidth && !targetHeight) {
			targetWidth = options.src.width;
			targetHeight = options.src.height;
		}
	}
	return {
		targetWidth,
		targetHeight
	};
}
//#endregion
//#region node_modules/astro/dist/assets/types.js
function isImageMetadata(src) {
	return src.fsPath && !("fsPath" in src);
}
//#endregion
//#region node_modules/astro/dist/assets/utils/url.js
var PLACEHOLDER_BASE = "astro://placeholder";
function createPlaceholderURL(pathOrUrl) {
	return new URL(pathOrUrl, PLACEHOLDER_BASE);
}
function stringifyPlaceholderURL(url) {
	return url.href.replace(PLACEHOLDER_BASE, "");
}
//#endregion
//#region node_modules/astro/dist/assets/internal.js
var cssFitValues = [
	"fill",
	"contain",
	"cover",
	"scale-down"
];
async function getConfiguredImageService$1() {
	if (!globalThis?.astroAsset?.imageService) {
		const { default: service } = await import("./sharp_B__omU8u.mjs").catch((e) => {
			const error = new AstroError(InvalidImageService);
			error.cause = e;
			throw error;
		});
		if (!globalThis.astroAsset) globalThis.astroAsset = {};
		globalThis.astroAsset.imageService = service;
		return service;
	}
	return globalThis.astroAsset.imageService;
}
async function getImage$1(options, imageConfig) {
	if (!options || typeof options !== "object") throw new AstroError({
		...ExpectedImageOptions,
		message: ExpectedImageOptions.message(JSON.stringify(options))
	});
	if (typeof options.src === "undefined") throw new AstroError({
		...ExpectedImage,
		message: ExpectedImage.message(options.src, "undefined", JSON.stringify(options))
	});
	if (isImageMetadata(options)) throw new AstroError(ExpectedNotESMImage);
	const service = await getConfiguredImageService$1();
	const resolvedOptions = {
		...options,
		src: await resolveSrc(options.src)
	};
	let originalWidth;
	let originalHeight;
	if (resolvedOptions.inferSize) {
		delete resolvedOptions.inferSize;
		if (isRemoteImage(resolvedOptions.src) && isRemotePath(resolvedOptions.src)) {
			if (!isRemoteAllowed(resolvedOptions.src, imageConfig)) throw new AstroError({
				...RemoteImageNotAllowed,
				message: RemoteImageNotAllowed.message(resolvedOptions.src)
			});
			const getRemoteSize = (url) => service.getRemoteSize?.(url, imageConfig) ?? inferRemoteSize$1(url, imageConfig);
			const result = await getRemoteSize(resolvedOptions.src);
			resolvedOptions.width ??= result.width;
			resolvedOptions.height ??= result.height;
			if (result.format) resolvedOptions.format ??= resolveDefaultOutputFormat(result.format);
			originalWidth = result.width;
			originalHeight = result.height;
		}
	}
	const originalFilePath = isESMImportedImage(resolvedOptions.src) ? resolvedOptions.src.fsPath : void 0;
	const clonedSrc = isESMImportedImage(resolvedOptions.src) ? resolvedOptions.src.clone ?? resolvedOptions.src : resolvedOptions.src;
	if (isESMImportedImage(clonedSrc)) {
		originalWidth = clonedSrc.width;
		originalHeight = clonedSrc.height;
	}
	if (originalWidth && originalHeight) {
		const aspectRatio = originalWidth / originalHeight;
		if (resolvedOptions.height && !resolvedOptions.width) resolvedOptions.width = Math.round(resolvedOptions.height * aspectRatio);
		else if (resolvedOptions.width && !resolvedOptions.height) resolvedOptions.height = Math.round(resolvedOptions.width / aspectRatio);
		else if (!resolvedOptions.width && !resolvedOptions.height) {
			resolvedOptions.width = originalWidth;
			resolvedOptions.height = originalHeight;
		}
	}
	resolvedOptions.src = clonedSrc;
	const layout = options.layout ?? imageConfig.layout ?? "none";
	if (resolvedOptions.priority) {
		resolvedOptions.loading ??= "eager";
		resolvedOptions.decoding ??= "sync";
		resolvedOptions.fetchpriority ??= "high";
		delete resolvedOptions.priority;
	} else {
		resolvedOptions.loading ??= "lazy";
		resolvedOptions.decoding ??= "async";
		resolvedOptions.fetchpriority ??= void 0;
	}
	if (layout !== "none") {
		resolvedOptions.widths ||= getWidths({
			width: resolvedOptions.width,
			layout,
			originalWidth,
			breakpoints: imageConfig.breakpoints?.length ? imageConfig.breakpoints : isLocalService(service) ? LIMITED_RESOLUTIONS : DEFAULT_RESOLUTIONS
		});
		resolvedOptions.sizes ||= getSizesAttribute({
			width: resolvedOptions.width,
			layout
		});
		delete resolvedOptions.densities;
		resolvedOptions["data-astro-image"] = layout;
		if (resolvedOptions.fit && cssFitValues.includes(resolvedOptions.fit)) resolvedOptions["data-astro-image-fit"] = resolvedOptions.fit;
		resolvedOptions["data-astro-image-pos"] = (resolvedOptions.position || "center").replace(/\s+/g, "-");
	}
	const validatedOptions = service.validateOptions ? await service.validateOptions(resolvedOptions, imageConfig) : resolvedOptions;
	validatedOptions.format ??= await peekRemoteFormatForStaticEmit(validatedOptions, imageConfig, service);
	const srcSetTransforms = service.getSrcSet ? await service.getSrcSet(validatedOptions, imageConfig) : [];
	const lazyImageURLFactory = (getValue) => {
		let cached = null;
		return () => cached ??= getValue();
	};
	const initialImageURL = await service.getURL(validatedOptions, imageConfig);
	let lazyImageURL = lazyImageURLFactory(() => initialImageURL);
	const matchesValidatedTransform = (transform) => transform.width === validatedOptions.width && transform.height === validatedOptions.height && transform.format === validatedOptions.format;
	let srcSets = await Promise.all(srcSetTransforms.map(async (srcSet) => {
		return {
			transform: srcSet.transform,
			url: matchesValidatedTransform(srcSet.transform) ? initialImageURL : await service.getURL(srcSet.transform, imageConfig),
			descriptor: srcSet.descriptor,
			attributes: srcSet.attributes
		};
	}));
	if (isLocalService(service) && globalThis.astroAsset.addStaticImage && !(isRemoteImage(validatedOptions.src) && initialImageURL === validatedOptions.src)) {
		const propsToHash = service.propertiesToHash ?? DEFAULT_HASH_PROPS;
		lazyImageURL = lazyImageURLFactory(() => globalThis.astroAsset.addStaticImage(validatedOptions, propsToHash, originalFilePath));
		srcSets = srcSetTransforms.map((srcSet) => {
			return {
				transform: srcSet.transform,
				url: matchesValidatedTransform(srcSet.transform) ? lazyImageURL() : globalThis.astroAsset.addStaticImage(srcSet.transform, propsToHash, originalFilePath),
				descriptor: srcSet.descriptor,
				attributes: srcSet.attributes
			};
		});
	} else if (imageConfig.assetQueryParams) {
		const imageURLObj = createPlaceholderURL(initialImageURL);
		imageConfig.assetQueryParams.forEach((value, key) => {
			imageURLObj.searchParams.set(key, value);
		});
		lazyImageURL = lazyImageURLFactory(() => stringifyPlaceholderURL(imageURLObj));
		srcSets = srcSets.map((srcSet) => {
			const urlObj = createPlaceholderURL(srcSet.url);
			imageConfig.assetQueryParams.forEach((value, key) => {
				urlObj.searchParams.set(key, value);
			});
			return {
				...srcSet,
				url: stringifyPlaceholderURL(urlObj)
			};
		});
	}
	return {
		rawOptions: resolvedOptions,
		options: validatedOptions,
		get src() {
			return lazyImageURL();
		},
		srcSet: {
			values: srcSets,
			attribute: srcSets.map((srcSet) => `${srcSet.url} ${srcSet.descriptor}`).join(", ")
		},
		attributes: service.getHTMLAttributes !== void 0 ? await service.getHTMLAttributes(validatedOptions, imageConfig) : {}
	};
}
async function peekRemoteFormatForStaticEmit(options, imageConfig, service) {
	if (!isRemoteImage(options.src) || !isRemoteAllowed(options.src, imageConfig) || !globalThis.astroAsset?.addStaticImage || !isLocalService(service) || !service.getRemoteSize) return;
	try {
		return resolveDefaultOutputFormat((await service.getRemoteSize(options.src, imageConfig)).format);
	} catch {
		return;
	}
}
Function.prototype.toString.call(Object);
createMetadata("/data/data/com.termux/files/home/ai-homework-helper/node_modules/astro/components/Image.astro", {
	modules: [{
		module: _astro_assets_exports,
		specifier: "astro:assets",
		assert: {}
	}, {
		module: errors_exports,
		specifier: "../dist/core/errors/index.js",
		assert: {}
	}],
	hydratedComponents: [],
	clientOnlyComponents: [],
	hydrationDirectives: /* @__PURE__ */ new Set([]),
	hoisted: []
});
var $$Astro$2 = createAstro();
var $$Image = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$2, $$props, $$slots);
	Astro2.self = $$Image;
	const props = Astro2.props;
	if (props.alt === void 0 || props.alt === null) throw new AstroError(ImageMissingAlt);
	if (typeof props.width === "string") props.width = Number.parseInt(props.width);
	if (typeof props.height === "string") props.height = Number.parseInt(props.height);
	if ((props.layout ?? imageConfig.layout ?? "none") !== "none") {
		props.layout ??= imageConfig.layout;
		props.fit ??= imageConfig.objectFit ?? "cover";
		props.position ??= imageConfig.objectPosition ?? "center";
	} else if (imageConfig.objectFit || imageConfig.objectPosition) {
		props.fit ??= imageConfig.objectFit;
		props.position ??= imageConfig.objectPosition;
	}
	const image = await getImage(props);
	const additionalAttributes = {};
	if (image.srcSet.values.length > 0) additionalAttributes.srcset = image.srcSet.attribute;
	const { class: className, ...attributes } = {
		...additionalAttributes,
		...image.attributes
	};
	return renderTemplate`
${maybeRenderHead($$result)}<img${addAttribute(image.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}>`;
}, "/data/data/com.termux/files/home/ai-homework-helper/node_modules/astro/components/Image.astro", void 0);
createMetadata("/data/data/com.termux/files/home/ai-homework-helper/node_modules/astro/components/Picture.astro", {
	modules: [
		{
			module: _astro_assets_exports,
			specifier: "astro:assets",
			assert: {}
		},
		{
			module: mime,
			specifier: "mrmime",
			assert: {}
		},
		{
			module: imageKind_exports,
			specifier: "../dist/assets/utils/imageKind.js",
			assert: {}
		},
		{
			module: errors_exports,
			specifier: "../dist/core/errors/index.js",
			assert: {}
		}
	],
	hydratedComponents: [],
	clientOnlyComponents: [],
	hydrationDirectives: /* @__PURE__ */ new Set([]),
	hoisted: []
});
var $$Astro$1 = createAstro();
var $$Picture = createComponent(async ($$result, $$props, $$slots) => {
	const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
	Astro2.self = $$Picture;
	const defaultFormats = ["webp"];
	const defaultFallbackFormat = "png";
	const specialFormatsFallback = [
		"gif",
		"svg",
		"jpg",
		"jpeg"
	];
	const { formats = defaultFormats, pictureAttributes = {}, fallbackFormat, ...props } = Astro2.props;
	if (props.alt === void 0 || props.alt === null) throw new AstroError(ImageMissingAlt);
	const scopedStyleClass = props.class?.match(/\bastro-\w{8}\b/)?.[0];
	if (scopedStyleClass) {
		if (pictureAttributes.class) pictureAttributes.class = `${pictureAttributes.class} ${scopedStyleClass}`;
		else pictureAttributes.class = scopedStyleClass;
	}
	const useResponsive = (props.layout ?? imageConfig.layout ?? "none") !== "none";
	if (useResponsive) {
		props.layout ??= imageConfig.layout;
		props.fit ??= imageConfig.objectFit ?? "cover";
		props.position ??= imageConfig.objectPosition ?? "center";
	} else if (imageConfig.objectFit || imageConfig.objectPosition) {
		props.fit ??= imageConfig.objectFit;
		props.position ??= imageConfig.objectPosition;
	}
	for (const key in props) if (key.startsWith("data-astro-cid")) pictureAttributes[key] = props[key];
	const originalSrc = await resolveSrc(props.src);
	if (props.inferSize && isRemoteImage(originalSrc)) {
		const remoteSize = await inferRemoteSize(originalSrc);
		delete props.inferSize;
		props.width ??= remoteSize.width;
		props.height ??= remoteSize.height;
	}
	const optimizedImages = await Promise.all(formats.map(async (format) => await getImage({
		...props,
		src: originalSrc,
		format,
		widths: props.widths,
		densities: props.densities
	})));
	const clonedSrc = isESMImportedImage(originalSrc) ? originalSrc.clone ?? originalSrc : originalSrc;
	let resultFallbackFormat = fallbackFormat ?? defaultFallbackFormat;
	if (!fallbackFormat && isESMImportedImage(clonedSrc) && specialFormatsFallback.includes(clonedSrc.format)) resultFallbackFormat = clonedSrc.format;
	const fallbackImage = await getImage({
		...props,
		format: resultFallbackFormat,
		widths: props.widths,
		densities: props.densities
	});
	const imgAdditionalAttributes = {};
	const sourceAdditionalAttributes = {};
	if (props.sizes) sourceAdditionalAttributes.sizes = props.sizes;
	if (fallbackImage.srcSet.values.length > 0) imgAdditionalAttributes.srcset = fallbackImage.srcSet.attribute;
	const { class: className, ...attributes } = {
		...imgAdditionalAttributes,
		...fallbackImage.attributes
	};
	return renderTemplate`${maybeRenderHead($$result)}<picture${spreadAttributes(pictureAttributes)}>
	${Object.entries(optimizedImages).map(([_, image]) => {
		const srcsetAttribute = props.densities || !props.densities && !props.widths && !useResponsive ? `${image.src}${image.srcSet.values.length > 0 ? ", " + image.srcSet.attribute : ""}` : image.srcSet.attribute;
		return renderTemplate`<source${addAttribute(srcsetAttribute, "srcset")}${addAttribute(mime.lookup(image.options.format ?? image.src) ?? `image/${image.options.format}`, "type")}${spreadAttributes(sourceAdditionalAttributes)}>`;
	})}
	
	<img${addAttribute(fallbackImage.src, "src")}${spreadAttributes(attributes)}${addAttribute(className, "class")}>
</picture>`;
}, "/data/data/com.termux/files/home/ai-homework-helper/node_modules/astro/components/Picture.astro", void 0);
//#endregion
//#region \0virtual:astro:assets/fonts/internal
var internal_exports = /* @__PURE__ */ __exportAll({
	componentDataByCssVariable: () => componentDataByCssVariable,
	fontDataByCssVariable: () => fontDataByCssVariable
});
var componentDataByCssVariable = /* @__PURE__ */ new Map([]);
var fontDataByCssVariable = {};
//#endregion
//#region node_modules/astro/dist/assets/fonts/core/filter-preloads.js
var filter_preloads_exports = /* @__PURE__ */ __exportAll({ filterPreloads: () => filterPreloads });
function filterPreloads(data, preload) {
	if (!preload) return null;
	if (preload === true) return data;
	return data.filter(({ weight, style, subset }) => preload.some((p) => {
		if (p.weight !== void 0 && weight !== void 0 && !checkWeight(p.weight.toString(), weight)) return false;
		if (p.style !== void 0 && p.style !== style) return false;
		if (p.subset !== void 0 && p.subset !== subset) return false;
		return true;
	}));
}
function checkWeight(input, target) {
	const trimmedInput = input.trim();
	if (trimmedInput.includes(" ")) return trimmedInput === target;
	if (target.includes(" ")) {
		const [a, b] = target.split(" ");
		const parsedInput = Number.parseInt(input);
		return parsedInput >= Number.parseInt(a) && parsedInput <= Number.parseInt(b);
	}
	return input === target;
}
createMetadata("/data/data/com.termux/files/home/ai-homework-helper/node_modules/astro/components/Font.astro", {
	modules: [
		{
			module: internal_exports,
			specifier: "virtual:astro:assets/fonts/internal",
			assert: {}
		},
		{
			module: filter_preloads_exports,
			specifier: "../dist/assets/fonts/core/filter-preloads.js",
			assert: {}
		},
		{
			module: errors_exports,
			specifier: "../dist/core/errors/index.js",
			assert: {}
		}
	],
	hydratedComponents: [],
	clientOnlyComponents: [],
	hydrationDirectives: /* @__PURE__ */ new Set([]),
	hoisted: []
});
var $$Astro = createAstro();
var $$Font = createComponent(($$result, $$props, $$slots) => {
	const Astro = $$result.createAstro($$Astro, $$props, $$slots);
	Astro.self = $$Font;
	const { cssVariable, preload = false } = Astro.props;
	const data = componentDataByCssVariable.get(cssVariable);
	if (!data) throw new AstroError({
		...FontFamilyNotFound,
		message: FontFamilyNotFound.message(cssVariable)
	});
	const filteredPreloadData = filterPreloads(data.preloads, preload);
	return renderTemplate`<style>${unescapeHTML(data.css)}</style>
${filteredPreloadData?.map(({ url, type }) => renderTemplate`<link rel="preload"${addAttribute(url, "href")} as="font"${addAttribute(`font/${type}`, "type")} crossorigin>`)}`;
}, "/data/data/com.termux/files/home/ai-homework-helper/node_modules/astro/components/Font.astro", void 0);
//#endregion
//#region node_modules/astro/dist/assets/fonts/infra/ssr-runtime-font-file-url-resolver.js
var SsrRuntimeFontFileUrlResolver = class {
	#urls;
	constructor({ urls }) {
		this.#urls = urls;
	}
	resolve(url, requestUrl) {
		if (!this.#urls.has(url)) return null;
		if (!url.startsWith("/")) return url;
		if (!requestUrl) throw new AstroError(MissingGetFontFileRequestUrl);
		return `${requestUrl.origin}${url}`;
	}
};
//#endregion
//#region \0virtual:astro:assets/fonts/runtime/font-file-url-resolver
var runtimeFontFileUrlResolver = new SsrRuntimeFontFileUrlResolver({ urls: /* @__PURE__ */ new Set([]) });
//#endregion
//#region node_modules/astro/dist/assets/fonts/core/create-get-font-file-url.js
function createGetFontFileURL(runtimeFontFileUrlResolver) {
	return function getFontFileURL(url, requestUrl) {
		try {
			const result = runtimeFontFileUrlResolver.resolve(url, requestUrl);
			if (result === null) throw new Error("Not found");
			return result;
		} catch (cause) {
			throw new AstroError({
				...FontFileUrlNotFound,
				message: FontFileUrlNotFound.message(url)
			}, { cause });
		}
	};
}
//#endregion
//#region node_modules/astro/dist/assets/fonts/runtime.js
var fontData = fontDataByCssVariable;
var experimental_getFontFileURL = createGetFontFileURL(runtimeFontFileUrlResolver);
//#endregion
//#region \0astro:assets
var _astro_assets_exports = /* @__PURE__ */ __exportAll({
	Font: () => $$Font,
	Image: () => $$Image,
	Picture: () => $$Picture,
	experimental_getFontFileURL: () => experimental_getFontFileURL,
	fontData: () => fontData,
	fsDenyGlob: () => fsDenyGlob,
	getConfiguredImageService: () => getConfiguredImageService,
	getImage: () => getImage,
	imageConfig: () => imageConfig,
	inferRemoteSize: () => inferRemoteSize,
	isLocalService: () => isLocalService,
	outDir: () => outDir,
	safeModulePaths: () => safeModulePaths,
	serverDir: () => serverDir,
	viteFSConfig: () => viteFSConfig
});
var getConfiguredImageService = getConfiguredImageService$1;
var viteFSConfig = {
	"strict": true,
	"deny": [
		".env",
		".env.*",
		"*.{crt,pem,key,p12,pfx,cer,der}",
		".npmrc",
		".yarnrc.yml",
		"**/.git/**"
	],
	"allow": ["/data/data/com.termux/files/home/ai-homework-helper"]
};
var safeModulePaths = /* @__PURE__ */ new Set([]);
var fsDenyGlob = (function() {
	const regexes = [
		/^(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)\/)\.env)$/i,
		/^(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)\/)\.env\.[^/]*?\/?)$/i,
		/^(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)\/)(?!\.{1,2}(?:\/|$))(?=.)[^/]*?\.(crt|pem|key|p12|pfx|cer|der))$/i,
		/^(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)\/)\.npmrc)$/i,
		/^(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)\/)\.yarnrc\.yml)$/i,
		/^(?:(?:^|\/|(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)\/)\.git(?:\/(?!\.{1,2}(?:\/|$))(?:(?:(?!(?:^|\/)\.{1,2}(?:\/|$)).)*?)|$))$/i
	];
	return function fsDenyGlob(testPath) {
		return regexes.some((re) => re.test(testPath));
	};
})();
var assetQueryParams = void 0;
var imageConfig = {
	"endpoint": { "route": "/_image" },
	"service": {
		"entrypoint": "astro/assets/services/sharp",
		"config": {}
	},
	"dangerouslyProcessSVG": false,
	"domains": [],
	"remotePatterns": [],
	"responsiveStyles": false
};
Object.defineProperty(imageConfig, "assetQueryParams", {
	value: assetQueryParams,
	enumerable: false,
	configurable: true
});
var inferRemoteSize = async (url) => {
	return (await getConfiguredImageService$1()).getRemoteSize?.(url, imageConfig) ?? inferRemoteSize$1(url, imageConfig);
};
var outDir = /* #__PURE__ */ new URL("file:///data/data/com.termux/files/home/ai-homework-helper/dist/client/");
var serverDir = /* #__PURE__ */ new URL("file:///data/data/com.termux/files/home/ai-homework-helper/.vercel/output/server/");
var getImage = async (options) => await getImage$1(options, imageConfig);
//#endregion
//#region node_modules/astro/dist/assets/utils/etag.js
var fnv1a52 = (str) => {
	const len = str.length;
	let i = 0, t0 = 0, v0 = 8997, t1 = 0, v1 = 33826, t2 = 0, v2 = 40164, t3 = 0, v3 = 52210;
	while (i < len) {
		v0 ^= str.charCodeAt(i++);
		t0 = v0 * 435;
		t1 = v1 * 435;
		t2 = v2 * 435;
		t3 = v3 * 435;
		t2 += v0 << 8;
		t3 += v1 << 8;
		t1 += t0 >>> 16;
		v0 = t0 & 65535;
		t2 += t1 >>> 16;
		v1 = t1 & 65535;
		v3 = t3 + (t2 >>> 16) & 65535;
		v2 = t2 & 65535;
	}
	return (v3 & 15) * 281474976710656 + v2 * 4294967296 + v1 * 65536 + (v0 ^ v3 >> 4);
};
var etag = (payload, weak = false) => {
	return (weak ? "W/\"" : "\"") + fnv1a52(payload).toString(36) + payload.length.toString(36) + "\"";
};
//#endregion
//#region node_modules/astro/dist/assets/endpoint/loadImage.js
async function loadImage(src, headers, imageConfig, isRemote, fetchFn) {
	try {
		const res = await fetchWithRedirects({
			url: src,
			headers,
			imageConfig,
			fetchFn
		});
		if (isRemote && !isRemoteAllowed(res.url, imageConfig)) return;
		if (!res.ok) return;
		return await res.arrayBuffer();
	} catch {
		return;
	}
}
//#endregion
//#region node_modules/astro/dist/assets/endpoint/generic.js
var generic_exports = /* @__PURE__ */ __exportAll({ GET: () => GET });
var GET = async ({ request }) => {
	try {
		const imageService = await getConfiguredImageService$1();
		if (!("transform" in imageService)) throw new Error("Configured image service is not a local service");
		const url = new URL(request.url);
		const transform = await imageService.parseURL(url, imageConfig);
		if (!transform?.src) throw new Error("Incorrect transform returned by `parseURL`");
		let inputBuffer = void 0;
		const isRemoteImage = isRemotePath(transform.src);
		if (isRemoteImage && isRemoteAllowed(transform.src, imageConfig) === false) return new Response("Forbidden", { status: 403 });
		const sourceUrl = new URL(transform.src, url.origin);
		if (!isRemoteImage && sourceUrl.origin !== url.origin) return new Response("Forbidden", { status: 403 });
		inputBuffer = await loadImage(sourceUrl, isRemoteImage ? new Headers() : request.headers, imageConfig, isRemoteImage);
		if (!inputBuffer) return new Response("Not Found", { status: 404 });
		const { data, format } = await imageService.transform(new Uint8Array(inputBuffer), transform, imageConfig);
		return new Response(data, {
			status: 200,
			headers: {
				"Content-Type": mime.lookup(format) ?? `image/${format}`,
				"Cache-Control": "public, max-age=31536000",
				ETag: etag(data.toString()),
				Date: (/* @__PURE__ */ new Date()).toUTCString()
			}
		});
	} catch (err) {
		console.error("Could not process image request:", err);
		return new Response("Internal Server Error", { status: 500 });
	}
};
//#endregion
//#region \0virtual:astro:page:node_modules/astro/dist/assets/endpoint/generic@_@js
var generic___js_exports = /* @__PURE__ */ __exportAll({ page: () => page });
var page = () => generic_exports;
//#endregion
export { resolveDefaultOutputFormat as i, baseService as n, page, parseQuality as r, generic___js_exports as t };
