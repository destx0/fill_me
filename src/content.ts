import browser from "webextension-polyfill";
import { cleanFormHtml, selectBestForm } from "./htmlCleaner";
import { generateFormFillPrompt, PromptVariables } from "./aiPromptTemplate";

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

		// Generate prompt using the template
		const prompt = generateFormFillPrompt({
			userPortfolioInfo: portfolioInfo,
			formHtml: analyzedFormHtml,
		});

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
