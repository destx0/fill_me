import browser from "webextension-polyfill";

console.log("Hello from the background!");

browser.runtime.onInstalled.addListener((details) => {
	console.log("Extension installed:", details);
});

browser.browserAction.onClicked.addListener(async (tab) => {
	if (!tab.id) {
		return;
	}

	try {
		await browser.tabs.sendMessage(tab.id, {
			action: "toggleFormBotSidebar",
		});
	} catch (error) {
		console.error("Failed to toggle Form Bot sidebar:", error);
	}
});

// Listen for messages from content script
browser.runtime.onMessage.addListener(
	async (message: any, sender: any, sendResponse: any) => {
		console.log("📨 [BACKGROUND] Received message:", message.action);

		if (message.action === "executeCode") {
			try {
				console.log(
					"⚡ [BACKGROUND] Executing code via tabs.executeScript API..."
				);

				// Get the current active tab
				const [tab] = await browser.tabs.query({
					active: true,
					currentWindow: true,
				});

				if (!tab.id) {
					throw new Error("No active tab found");
				}

				// Execute the code in the page context using tabs.executeScript (Manifest V2)
				// Wrap in async IIFE to support any async operations in generated code
				await browser.tabs.executeScript(tab.id, {
					code: `
						(async function() {
							console.log("🚀 [PAGE CONTEXT] Executing form filling code...");
							try {
								// Wrap generated code in its own scope to avoid variable conflicts
								await (async function executeGeneratedCode() {
									${message.code}
								})();
								console.log("✅ [PAGE CONTEXT] Code executed successfully!");
							} catch (error) {
								console.error("❌ [PAGE CONTEXT] Code execution failed:", error.message);
								console.error("❌ [PAGE CONTEXT] Error stack:", error.stack);
								throw error;
							}
						})();
					`,
				});

				console.log(
					"✅ [BACKGROUND] Code execution completed successfully!"
				);
				return { success: true };
			} catch (error) {
				console.error("❌ [BACKGROUND] Code execution failed:", error);
				return {
					success: false,
					error:
						error instanceof Error
							? error.message
							: "Unknown error",
				};
			}
		}

		return true; // Required for async message handling in Manifest V2
	}
);
