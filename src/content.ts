import browser from "webextension-polyfill";
import React from "react";
import ReactDOM from "react-dom/client";
import { cleanFormHtml, selectBestForm } from "./htmlCleaner";
import { generateFormFillPrompt, generateValidationFillPrompt } from "./aiPromptTemplate";
import Popup from "./pages/Popup";
import type { FillProgressEvent } from "./pages/popupTypes";
import popupStyles from "./pages/Popup.css?inline";

// Global variable to store the analyzed form HTML
let analyzedFormHtml: string | null = null;
let analyzedFormElement: Element | null = null;
let sidebarHost: HTMLDivElement | null = null;
let sidebarRoot: ReactDOM.Root | null = null;

const SIDEBAR_ID = "form-bot-sidebar-host";
const SIDEBAR_WIDTH = 360;
const VALIDATION_WAIT_MS = 900;

// Listen for messages from the popup
browser.runtime.onMessage.addListener(
	(message: any, sender: any, sendResponse: any) => {
		console.log("📨 [MESSAGE] Received message:", message.action);

		if (message.action === "toggleFormBotSidebar") {
			toggleSidebar();
			sendResponse({ success: true, open: Boolean(sidebarHost) });
			return true;
		} else if (message.action === "analyzeForm") {
			sendResponse(analyzeCurrentForm());
			return true;
		} else if (message.action === "testGeminiAPI") {
			console.log("[TEST] Testing AI provider...");
			askProviderAPI()
				.then((result) => sendResponse(result))
				.catch((error) =>
					sendResponse({
						success: false,
						error: error.message,
					})
				);
			return true;
		} else if (message.action === "fillForm") {
			console.log("[FILL] Filling form with AI-generated data...");
			fillFormWithAI(message.userDetails, message.settings)
				.then((result) => sendResponse(result))
				.catch((error) =>
					sendResponse({
						success: false,
						error: error.message,
					})
				);
			return true;
		} else if (message.action === "clearStoredForm") {
			console.log("🗑️ [CLEAR] Clearing stored form data...");
			analyzedFormHtml = null;
			analyzedFormElement = null;
			sendResponse({
				success: true,
				message: "Stored form data cleared",
			});
			return true;
		}
	}
);

console.log("🚀 Form Bot content script loaded");

function toggleSidebar() {
	if (sidebarHost) {
		removeSidebar();
		return;
	}

	showSidebar();
}

function showSidebar() {
	const existingHost = document.getElementById(SIDEBAR_ID);
	if (existingHost) {
		sidebarHost = existingHost as HTMLDivElement;
		return;
	}

	const host = document.createElement("div");
	host.id = SIDEBAR_ID;
	host.style.cssText = [
		"position: fixed",
		"top: 0",
		"right: 0",
		`width: ${SIDEBAR_WIDTH}px`,
		"max-width: 100vw",
		"height: 100vh",
		"z-index: 2147483647",
		"background: #000000",
		"box-shadow: -18px 0 42px rgba(0, 0, 0, 0.34)",
		"border-left: 1px solid #121212",
		"transform: translateX(0)",
		"transition: transform 180ms ease",
		"contain: layout style paint",
	].join(";");

	const shadow = host.attachShadow({ mode: "open" });
	const style = document.createElement("style");
	style.textContent = `
		:host {
			all: initial;
			display: block;
			width: 100%;
			height: 100%;
			color-scheme: dark;
		}

		.form-bot-shell {
			width: 100%;
			height: 100%;
			background: #000000;
		}

		.form-bot-close {
			position: absolute;
			top: 12px;
			right: 12px;
			z-index: 2;
			width: 32px;
			height: 32px;
			border: 1px solid #454545;
			border-radius: 10px;
			background: #1c1c1c;
			color: #e8e3da;
			font: 700 20px/1 system-ui, sans-serif;
			cursor: pointer;
		}

		.form-bot-close:hover {
			background: rgba(30, 41, 59, 0.96);
		}

		${popupStyles}
	`;

	const closeButton = document.createElement("button");
	closeButton.type = "button";
	closeButton.setAttribute("aria-label", "Close Form Bot sidebar");
	closeButton.textContent = "×";
	closeButton.className = "form-bot-close";
	closeButton.addEventListener("click", removeSidebar);

	const appRoot = document.createElement("div");
	appRoot.className = "form-bot-shell";

	shadow.append(style, closeButton, appRoot);
	document.documentElement.appendChild(host);
	sidebarHost = host;
	sidebarRoot = ReactDOM.createRoot(appRoot);
	sidebarRoot.render(
		React.createElement(
			React.StrictMode,
			null,
				React.createElement(Popup as React.ComponentType<any>, {
					analyzeForm: async () => analyzeCurrentForm(),
					fillForm: (
						userDetails: any,
						settings: any,
						onProgress?: (event: FillProgressEvent) => void
					) => fillFormWithAI(userDetails, settings, onProgress),
				})
		)
	);
}

function removeSidebar() {
	sidebarRoot?.unmount();
	sidebarRoot = null;
	sidebarHost?.remove();
	sidebarHost = null;
}

function analyzeCurrentForm() {
	console.log("🔍 [ANALYZE] Starting form analysis...");

	const formElement = selectBestForm();

	if (!formElement) {
		return null;
	}

	const allInputs = document.querySelectorAll(
		"input, select, textarea"
	);
	const totalInputs = allInputs.length;

	// Clean the form HTML
	const cleanHtml = cleanFormHtml(formElement);
	console.log("🧹 [CLEANED HTML] Cleaned form HTML:");
	console.log(cleanHtml);

	// Store the analyzed form data globally for AI form filling
	analyzedFormHtml = cleanHtml;
	analyzedFormElement = formElement;
	console.log(
		"📦 [STORAGE] Stored analyzed form HTML for AI processing"
	);

	return {
		tagName: formElement.tagName.toLowerCase(),
		id: formElement.id || undefined,
		className: formElement.className || undefined,
		inputCount: totalInputs,
		cleanHtml: cleanHtml,
		url: window.location.href,
	};
}

async function askProviderAPI(userDetails?: any, settings?: any, missedFields?: string): Promise<{
	success: boolean;
	reply?: string;
	error?: string;
}> {
	try {
		if (!analyzedFormHtml) {
			return {
				success: false,
				error: "No form has been analyzed yet. Please analyze a form first.",
			};
		}

		if (!settings?.apiKey) {
			const providerName = getProviderName(settings?.provider);

			return {
				success: false,
				error: `No API key provided. Please add your ${providerName} API key in settings.`,
			};
		}

		const portfolioInfo =
			userDetails && userDetails.personalInfo
				? userDetails.personalInfo
				: "";

		const prompt = missedFields
			? generateValidationFillPrompt({
				userPortfolioInfo: portfolioInfo,
				formHtml: analyzedFormHtml,
				missedFields,
			})
			: generateFormFillPrompt({
				userPortfolioInfo: portfolioInfo,
				formHtml: analyzedFormHtml,
			});

		const provider = settings.provider === "groq" ? "groq" : "cerebras";
		const { generateAIText } = provider === "groq"
			? await import("./groq")
			: await import("./cerebras");

		console.log(`[${getProviderName(provider).toUpperCase()}] Sending request...`);
		const text = await generateAIText(prompt, settings.apiKey, settings.model);

		return {
			success: true,
			reply: text,
		};
	} catch (error) {
		console.error("[AI PROVIDER] API failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

async function fillFormWithAI(
	userDetails?: any,
	settings?: any,
	onProgress?: (event: FillProgressEvent) => void
): Promise<{
	success: boolean;
	message?: string;
	error?: string;
	generatedCode?: string;
}> {
	try {
		console.log("[AI FILL] Starting AI form filling...");
		reportProgress(onProgress, {
			type: "info",
			message: "Preparing AI fill pass...",
		});

		if (!analyzedFormHtml || !analyzedFormElement) {
			reportProgress(onProgress, {
				type: "error",
				message: "No analyzed form found.",
			});
			return {
				success: false,
				error: "No form has been analyzed yet. Please analyze a form first.",
			};
		}

		reportProgress(onProgress, {
			type: "info",
			message: "Generating fill script...",
		});
		const aiResult = await askProviderAPI(userDetails, settings);

		if (!aiResult.success || !aiResult.reply) {
			reportProgress(onProgress, {
				type: "error",
				message: "AI could not generate the fill script.",
			});
			return {
				success: false,
				error: "Failed to generate form filling code: " + (aiResult.error || "Unknown error"),
			};
		}

		const generatedCode = aiResult.reply;
		console.log("[GENERATED CODE]", generatedCode);

		try {
			const cleanCode = cleanGeneratedCode(generatedCode);

			reportProgress(onProgress, {
				type: "info",
				message: "Applying generated values to the page...",
			});
			const executeResult = await browser.runtime.sendMessage({
				action: "executeCode",
				code: cleanCode,
			});

			if (!executeResult || !executeResult.success) {
				throw new Error(executeResult?.error || "Failed to execute code");
			}

			reportProgress(onProgress, {
				type: "success",
				message: "Initial fill pass completed.",
			});
			reportProgress(onProgress, {
				type: "info",
				message: "Validating filled fields...",
			});
			await wait(VALIDATION_WAIT_MS);

			const missedFields = getMissedFields();
			if (missedFields.length > 0) {
				console.log("[VALIDATION] Missed fields after first pass:", missedFields);
				reportProgress(onProgress, {
					type: "warning",
					message: `Found ${missedFields.length} field${missedFields.length === 1 ? "" : "s"} that need repair.`,
					details: missedFields.map((field) => `${field.label}: ${field.reason}`),
				});
				reportProgress(onProgress, {
					type: "info",
					message: "Generating repair script for missed fields...",
				});

				const repairResult = await askProviderAPI(
					userDetails,
					settings,
					formatMissedFieldsForPrompt(missedFields)
				);

				if (!repairResult.success || !repairResult.reply) {
					reportProgress(onProgress, {
						type: "error",
						message: "Validation repair script could not be generated.",
					});
					return {
						success: false,
						error: "Form filled, but validation repair failed: " + (repairResult.error || "Unknown error"),
						generatedCode: cleanCode,
					};
				}

				const cleanRepairCode = cleanGeneratedCode(repairResult.reply);
				reportProgress(onProgress, {
					type: "info",
					message: "Applying repair values...",
				});
				const repairExecuteResult = await browser.runtime.sendMessage({
					action: "executeCode",
					code: cleanRepairCode,
				});

				if (!repairExecuteResult || !repairExecuteResult.success) {
					throw new Error(repairExecuteResult?.error || "Failed to execute validation repair code");
				}

				reportProgress(onProgress, {
					type: "info",
					message: "Validating repaired fields...",
				});
				await wait(VALIDATION_WAIT_MS);

				const remainingMissedFields = getMissedFields();
				if (remainingMissedFields.length > 0) {
					reportProgress(onProgress, {
						type: "error",
						message: `${remainingMissedFields.length} field${remainingMissedFields.length === 1 ? "" : "s"} still need attention.`,
						details: remainingMissedFields.map((field) => `${field.label}: ${field.reason}`),
					});
					return {
						success: false,
						error: `Some fields still need attention: ${remainingMissedFields.map((field) => field.label).join(", ")}`,
						generatedCode: `${cleanCode}\n\n${cleanRepairCode}`,
					};
				}
				reportProgress(onProgress, {
					type: "success",
					message: "Repair pass fixed the missed fields.",
				});
			} else {
				reportProgress(onProgress, {
					type: "success",
					message: "Validation found no missed fields.",
				});
			}

			console.log("[SUCCESS] Form filled and validated!");
			reportProgress(onProgress, {
				type: "success",
				message: "Form filled and validated successfully.",
			});

			return {
				success: true,
				message: "Form filled and validated successfully!",
				generatedCode: cleanCode,
			};
		} catch (executeError) {
			console.error("[EXECUTE ERROR]", executeError);
			reportProgress(onProgress, {
				type: "error",
				message: executeError instanceof Error ? executeError.message : "Failed to execute generated code.",
			});
			return {
				success: false,
				error: `Failed to execute code: ${executeError instanceof Error ? executeError.message : "Unknown error"}`,
				generatedCode: generatedCode,
			};
		}
	} catch (error) {
		console.error("[AI FILL ERROR]", error);
		reportProgress(onProgress, {
			type: "error",
			message: error instanceof Error ? error.message : "Unknown form fill error.",
		});
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

function getProviderName(provider?: string) {
	return provider === "groq" ? "Groq" : "Cerebras";
}

function cleanGeneratedCode(code: string) {
	return code
		.replace(/```javascript\s*/gi, "")
		.replace(/```js\s*/gi, "")
		.replace(/```\s*/g, "")
		.trim();
}

function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function reportProgress(
	onProgress: ((event: FillProgressEvent) => void) | undefined,
	event: FillProgressEvent
) {
	onProgress?.(event);
}

interface MissedField {
	label: string;
	selector: string;
	tagName: string;
	type: string;
	required: boolean;
	reason: string;
	options?: string[];
}

function getMissedFields(): MissedField[] {
	if (!analyzedFormElement) {
		return [];
	}

	const fields = Array.from(
		analyzedFormElement.querySelectorAll("input, select, textarea")
	) as Array<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>;
	const missedFields: MissedField[] = [];
	const handledRadioGroups = new Set<string>();
	const handledCheckboxGroups = new Set<string>();

	for (const field of fields) {
		if (!shouldValidateField(field)) {
			continue;
		}

		const inputField = field as HTMLInputElement;
		const type = getFieldType(field);
		const required = isRequiredField(field);

		if (type === "radio") {
			const groupName = inputField.name || getFieldLabel(inputField);
			if (handledRadioGroups.has(groupName)) {
				continue;
			}
			handledRadioGroups.add(groupName);

			if (required && !isAnyGroupOptionChecked("radio", groupName)) {
				missedFields.push(createMissedField(field, "Required radio group is not selected"));
			}
			continue;
		}

		if (type === "checkbox") {
			const groupName = inputField.name || getFieldLabel(inputField);
			if (handledCheckboxGroups.has(groupName)) {
				continue;
			}
			handledCheckboxGroups.add(groupName);

			if (required && !isAnyGroupOptionChecked("checkbox", groupName)) {
				missedFields.push(createMissedField(field, "Required checkbox is not selected"));
			}
			continue;
		}

		if (field instanceof HTMLSelectElement) {
			if (isEmptyValue(field.value) || field.selectedIndex < 0) {
				missedFields.push(createMissedField(field, "Select field is empty"));
			}
			continue;
		}

		if (isEmptyValue(field.value)) {
			missedFields.push(createMissedField(field, required ? "Required field is empty" : "Visible field is empty"));
			continue;
		}

		if (!field.checkValidity()) {
			missedFields.push(createMissedField(field, field.validationMessage || "Field value is invalid"));
		}
	}

	return missedFields.slice(0, 20);
}

function shouldValidateField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
	const type = getFieldType(field);
	const skippedTypes = new Set(["hidden", "file", "image", "submit", "reset", "button"]);

	return !field.disabled &&
		!(field instanceof HTMLInputElement && field.readOnly) &&
		!(field instanceof HTMLTextAreaElement && field.readOnly) &&
		!skippedTypes.has(type) &&
		isVisibleElement(field);
}

function getFieldType(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
	return field instanceof HTMLInputElement ? field.type.toLowerCase() : field.tagName.toLowerCase();
}

function isRequiredField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
	return field.required || field.getAttribute("aria-required") === "true";
}

function isEmptyValue(value: string | null | undefined) {
	return !value || value.trim() === "";
}

function isVisibleElement(element: Element) {
	const htmlElement = element as HTMLElement;
	const style = window.getComputedStyle(htmlElement);
	const rect = htmlElement.getBoundingClientRect();

	return style.display !== "none" &&
		style.visibility !== "hidden" &&
		style.opacity !== "0" &&
		rect.width > 0 &&
		rect.height > 0;
}

function isAnyGroupOptionChecked(type: "radio" | "checkbox", groupName: string) {
	if (!analyzedFormElement) {
		return false;
	}

	const escapedName = cssEscape(groupName);
	const selector = groupName
		? `input[type="${type}"][name="${escapedName}"]`
		: `input[type="${type}"]`;
	const options = Array.from(analyzedFormElement.querySelectorAll(selector)) as HTMLInputElement[];

	return options.some((option) => option.checked);
}

function createMissedField(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement, reason: string): MissedField {
	return {
		label: getFieldLabel(field),
		selector: getBestSelector(field),
		tagName: field.tagName.toLowerCase(),
		type: getFieldType(field),
		required: isRequiredField(field),
		reason,
		options: field instanceof HTMLSelectElement
			? Array.from(field.options).map((option) => option.text.trim()).filter(Boolean).slice(0, 15)
			: undefined,
	};
}

function getFieldLabel(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
	const explicitLabel = field.id
		? document.querySelector(`label[for="${cssEscape(field.id)}"]`)?.textContent?.trim()
		: "";
	const wrappingLabel = field.closest("label")?.textContent?.trim();
	const nearbyText = field.parentElement?.textContent?.trim();

	return explicitLabel ||
		wrappingLabel ||
		field.getAttribute("aria-label") ||
		field.getAttribute("placeholder") ||
		field.name ||
		field.id ||
		nearbyText?.slice(0, 80) ||
		"Unlabeled field";
}

function getBestSelector(field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement) {
	if (field.id) {
		return `#${cssEscape(field.id)}`;
	}
	if (field.name) {
		return `${field.tagName.toLowerCase()}[name="${cssEscape(field.name)}"]`;
	}
	const ariaLabel = field.getAttribute("aria-label");
	if (ariaLabel) {
		return `${field.tagName.toLowerCase()}[aria-label="${cssEscape(ariaLabel)}"]`;
	}
	const placeholder = field.getAttribute("placeholder");
	if (placeholder) {
		return `${field.tagName.toLowerCase()}[placeholder="${cssEscape(placeholder)}"]`;
	}

	return field.tagName.toLowerCase();
}

function cssEscape(value: string) {
	if (typeof CSS !== "undefined" && CSS.escape) {
		return CSS.escape(value);
	}

	return value.replace(/["\\]/g, "\\$&");
}

function formatMissedFieldsForPrompt(fields: MissedField[]) {
	return fields.map((field, index) => {
		const options = field.options?.length ? `\nOptions: ${field.options.join(" | ")}` : "";
		return `${index + 1}. Label: ${field.label}
Selector: ${field.selector}
Tag: ${field.tagName}
Type: ${field.type}
Required: ${field.required ? "yes" : "no"}
Reason: ${field.reason}${options}`;
	}).join("\n\n");
}
