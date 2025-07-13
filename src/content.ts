import browser from "webextension-polyfill";
import { cleanFormHtml, selectBestForm } from "./htmlCleaner";

// Global variable to store the analyzed form HTML
let analyzedFormHtml: string | null = null;
let analyzedFormElement: Element | null = null;

// Listen for messages from the popup
browser.runtime.onMessage.addListener(
	(message: any, sender: any, sendResponse: any) => {
		console.log("📨 [MESSAGE] Received message:", message.action);

		if (message.action === "analyzeForm") {
			console.log("🔍 [ANALYZE] Starting form analysis...");

			const formElement = selectBestForm();

			if (!formElement) {
				sendResponse(null);
				return true;
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

			const result = {
				tagName: formElement.tagName.toLowerCase(),
				id: formElement.id || undefined,
				className: formElement.className || undefined,
				inputCount: totalInputs,
				cleanHtml: cleanHtml,
				url: window.location.href,
			};

			sendResponse(result);
			return true;
		} else if (message.action === "testGeminiAPI") {
			console.log("🧪 [TEST] Testing Groq API...");
			askGroqAPI()
				.then((result) => sendResponse(result))
				.catch((error) =>
					sendResponse({
						success: false,
						error: error.message,
					})
				);
			return true;
		} else if (message.action === "fillForm") {
			console.log("🤖 [FILL] Filling form with AI-generated data...");
			fillFormWithAI(message.userDetails)
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

async function askGroqAPI(userDetails?: any): Promise<{
	success: boolean;
	reply?: string;
	error?: string;
}> {
	try {
		console.log("🧪 Testing Groq API...");

		// Check if we have analyzed form HTML
		if (!analyzedFormHtml) {
			console.warn("⚠️ No analyzed form HTML available");
			return {
				success: false,
				error: "No form has been analyzed yet. Please analyze a form first.",
			};
		}

		const { generateAIText } = await import("./firebase");

		// Use provided user details or fallback to default
		const portfolioInfo =
			userDetails && userDetails.personalInfo
				? userDetails.personalInfo
				: `hii`;

		// Create a prompt that asks Gemini to generate JavaScript code to fill the form
		const prompt = `You are an expert assistant that generates JavaScript code to fill out HTML forms using provided user portfolio information.
Given an HTML form structure, generate a JavaScript code block that, when executed in a browser, will:
- Fill ALL input fields (text, email, number, password, date, tel, url), textareas, and select (dropdown) elements with plausible, diverse, and professional data derived from the user's portfolio.
- For radio buttons: Select the most relevant option based on the portfolio, or choose a plausible default if no match.
- For checkboxes: Select all that are relevant to the portfolio, or a reasonable subset if no direct match.
- For dropdowns (select): Choose the option that best matches the portfolio, or a plausible default.
- For all fields: If portfolio info is missing, fill with realistic, professional data that increases the chance of selection.
- Target fields using document.querySelector() or document.querySelectorAll() with id or name attributes. Prefer id, then name, then fallback to tag and index.
- Do NOT include any comments, HTML, Markdown, or extra text. Output ONLY the raw JavaScript code, ready to execute.

USER PORTFOLIO INFORMATION:
${portfolioInfo}

FORM HTML:
${analyzedFormHtml}

Generate the JavaScript code now.`;

		console.log("📤 Sending form HTML to Groq for analysis...");
		const text = await generateAIText(prompt);

		console.log("🤖 Groq Response:", text);

		return {
			success: true,
			reply: text,
		};
	} catch (error) {
		console.error("❌ Groq API test failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

async function fillFormWithAI(userDetails?: any): Promise<{
	success: boolean;
	message?: string;
	error?: string;
	generatedCode?: string;
}> {
	try {
		console.log("🤖 [AI FILL] Starting AI form filling process...");

		// Check if we have analyzed form HTML
		if (!analyzedFormHtml || !analyzedFormElement) {
			console.warn("⚠️ No analyzed form HTML or element available");
			return {
				success: false,
				error: "No form has been analyzed yet. Please analyze a form first.",
			};
		}

		// Get the JavaScript code from Groq
		const groqResult = await askGroqAPI(userDetails);

		if (!groqResult.success || !groqResult.reply) {
			return {
				success: false,
				error:
					"Failed to generate form filling code from Groq: " +
					(groqResult.error || "Unknown error"),
			};
		}

		const generatedCode = groqResult.reply;
		console.log("📝 [GENERATED CODE] Received JavaScript code from Groq:");
		console.log(generatedCode);

		// Execute the generated JavaScript code
		try {
			// Clean the code by removing markdown code blocks if present
			const cleanCode = generatedCode
				.replace(/```javascript\s*/g, "")
				.replace(/```\s*/g, "")
				.trim();

			console.log(
				"⚡ [EXECUTE] Sending code to background script for execution..."
			);

			// Send the code to background script for execution using scripting API
			const executeResult = await browser.runtime.sendMessage({
				action: "executeCode",
				code: cleanCode,
			});

			if (executeResult && executeResult.success) {
				console.log(
					"✅ [SUCCESS] Form filled successfully with AI-generated data!"
				);
			} else {
				throw new Error(
					executeResult?.error ||
						"Failed to execute code via background script"
				);
			}

			return {
				success: true,
				message: "Form filled successfully with AI-generated data!",
				generatedCode: cleanCode,
			};
		} catch (executeError) {
			console.error(
				"❌ [EXECUTE ERROR] Failed to execute generated code:",
				executeError
			);
			return {
				success: false,
				error: `Failed to execute generated code: ${
					executeError instanceof Error
						? executeError.message
						: "Unknown execution error"
				}`,
				generatedCode: generatedCode,
			};
		}
	} catch (error) {
		console.error("❌ [AI FILL ERROR] AI form filling failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
