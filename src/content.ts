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

			// Find the best form using the htmlCleaner logic
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
			console.log("🧪 [TEST] Testing Gemini API...");
			testGeminiAPI()
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

async function testGeminiAPI(): Promise<{
	success: boolean;
	reply?: string;
	error?: string;
}> {
	try {
		console.log("🧪 Testing Gemini API...");

		const { geminiModel } = await import("./firebase");
		const result = await geminiModel.generateContent("hi");
		const response = await result.response;
		const text = response.text();

		console.log("🤖 Gemini Response:", text);

		return {
			success: true,
			reply: text,
		};
	} catch (error) {
		console.error("❌ Gemini API test failed:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
