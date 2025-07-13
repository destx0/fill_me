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
			console.log("🧪 [TEST] Testing Gemini API...");
			askGeminiAPI()
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

async function askGeminiAPI(userDetails?: any): Promise<{
	success: boolean;
	reply?: string;
	error?: string;
}> {
	try {
		console.log("🧪 Testing Gemini API...");

		// Check if we have analyzed form HTML
		if (!analyzedFormHtml) {
			console.warn("⚠️ No analyzed form HTML available");
			return {
				success: false,
				error: "No form has been analyzed yet. Please analyze a form first.",
			};
		}

		const { geminiModel } = await import("./firebase");

		// Use provided user details or fallback to default
		const portfolioInfo =
			userDetails && userDetails.personalInfo
				? userDetails.personalInfo
				: `Full Name: Alex Johnson
Email: alex.johnson.dev@gmail.com
Phone: +1 (555) 123-4567
Address: 123 Tech Street, San Francisco, CA 94102, USA
Date of Birth: March 15, 1995
LinkedIn: https://linkedin.com/in/alexjohnsondev
GitHub: https://github.com/alexjohnsondev
Portfolio Website: https://alexjohnson.dev
Current Position: Senior Full Stack Developer
Company: TechCorp Solutions
Years of Experience: 6 years
Education: Bachelor's in Computer Science, Stanford University (2017)
Skills: JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, MongoDB, PostgreSQL, Git, Agile, Machine Learning
Certifications: AWS Certified Developer, Google Cloud Professional
Languages: English (Native), Spanish (Conversational)
Salary Expectation: $120,000 - $150,000
Availability: Immediate (2 weeks notice)
Work Authorization: US Citizen
Preferred Work Type: Hybrid/Remote`;

		// Create a prompt that asks Gemini to generate JavaScript code to fill the form
		const prompt = `You are an intelligent assistant that generates JavaScript code to fill HTML forms based on provided user portfolio information.
Given an HTML form structure, your task is to generate a JavaScript code block that, when executed in a browser,
will intelligently fill in all input fields (text, email, number, password, date, tel, url), textareas, and select elements
with plausible and diverse data derived from the user's portfolio.
For queries where you lack information - answer in a way which increase my changes of getting selected.

USER PORTFOLIO INFORMATION:
${portfolioInfo}

Instructions for Form Filling:
- General Fields: Fill fields like name, email, phone, address, experience, skills, etc., using information from the provided portfolio.
- Select Elements: Pick a valid option from the available choices in the <select> element that best matches the portfolio information.
- Checkboxes/Radio Buttons: Select one or more (for checkboxes) or one (for radio buttons) based on relevance to the portfolio, or if no direct match, make a plausible selection.
- Targeting Fields: IMPORTANT: Ensure the generated JavaScript directly targets form fields using document.querySelector() with their name or id attributes. For example, instead of form.name.value, use document.querySelector('input[name="name"]').value or document.querySelector('#email-field-id').value. If an element has both id and name, prefer id. If neither is present, use their tag name and index (e.g., document.querySelectorAll('input')[0]).

Output Format:
- The JavaScript should be a self-contained block, ready to be executed.
- Do NOT include any HTML, Markdown formatting (like \`\`\`javascript), or extra text outside the JavaScript code itself.
- Just provide the raw JavaScript code.

Here is the form HTML:

${analyzedFormHtml}

Generate JavaScript code to fill this form with professional and compelling data that will increase the chances of getting selected.`;

		console.log("📤 Sending form HTML to Gemini for analysis...");
		const result = await geminiModel.generateContent(prompt);
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

		// Get the JavaScript code from Gemini
		const geminiResult = await askGeminiAPI(userDetails);

		if (!geminiResult.success || !geminiResult.reply) {
			return {
				success: false,
				error:
					"Failed to generate form filling code from Gemini: " +
					(geminiResult.error || "Unknown error"),
			};
		}

		const generatedCode = geminiResult.reply;
		console.log(
			"📝 [GENERATED CODE] Received JavaScript code from Gemini:"
		);
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
