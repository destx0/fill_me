import browser from "webextension-polyfill";

interface ElementInfo {
	element: Element;
	inputCount: number;
	depth: number;
	tagName: string;
	id?: string;
	className?: string;
}

function findDeepestFormContainer(): ElementInfo | null {
	// Get all input elements in the document
	const allInputs = document.querySelectorAll("input");
	const totalInputs = allInputs.length;

	if (totalInputs === 0) {
		console.log("No input elements found on the page");
		return null;
	}

	console.log(`Total inputs found: ${totalInputs}`);
	const threshold = Math.ceil(totalInputs * 0.8); 
	console.log(
		`Looking for element containing at least ${threshold} inputs (90% of ${totalInputs})`
	);

	let bestCandidate: ElementInfo | null = null;
	let maxDepth = -1;

	// Function to count inputs in an element's subtree
	function countInputsInSubtree(element: Element): number {
		return element.querySelectorAll("input").length;
	}

	// Function to calculate depth of an element
	function getDepth(element: Element): number {
		let depth = 0;
		let current = element.parentElement;
		while (current) {
			depth++;
			current = current.parentElement;
		}
		return depth;
	}

	// Walk through all elements in the document
	const allElements = document.querySelectorAll("*");

	for (const element of allElements) {
		const inputCount = countInputsInSubtree(element);

		// Check if this element contains at least 90% of inputs
		if (inputCount >= threshold) {
			const depth = getDepth(element);

			const elementInfo: ElementInfo = {
				element,
				inputCount,
				depth,
				tagName: element.tagName.toLowerCase(),
				id: element.id || undefined,
				className: element.className || undefined,
			};

			// We want the deepest element that still contains ≥90% of inputs
			if (depth > maxDepth) {
				maxDepth = depth;
				bestCandidate = elementInfo;
			}
		}
	}

	return bestCandidate;
}

function analyzeFormStructure() {
	console.log("🔍 Starting form structure analysis...");

	const result = findDeepestFormContainer();

	if (result) {
		console.log("✅ Found deepest form container:");
		console.log(`   Element: <${result.tagName}>`);
		console.log(`   ID: ${result.id || "none"}`);
		console.log(`   Class: ${result.className || "none"}`);
		console.log(`   Depth: ${result.depth}`);
		console.log(`   Contains: ${result.inputCount} inputs`);
		console.log(`   Element:`, result.element);

		// Highlight the element temporarily
		if (result.element instanceof HTMLElement) {
			const originalBorder = result.element.style.border;
			const originalBackgroundColor =
				result.element.style.backgroundColor;

			result.element.style.border = "3px solid red";
			result.element.style.backgroundColor = "rgba(255, 0, 0, 0.1)";

			// Remove highlight after 3 seconds
			setTimeout(() => {
				if (result.element instanceof HTMLElement) {
					result.element.style.border = originalBorder;
					result.element.style.backgroundColor =
						originalBackgroundColor;
				}
			}, 3000);
		}

		return {
			tagName: result.tagName,
			id: result.id,
			className: result.className,
			depth: result.depth,
			inputCount: result.inputCount,
			totalInputs: document.querySelectorAll("input").length,
		};
	} else {
		console.log("❌ No suitable form container found");
		return null;
	}
}

// Listen for messages from the popup
browser.runtime.onMessage.addListener(
	(message: any, sender: any, sendResponse: any) => {
		if (message.action === "analyzeForm") {
			const result = analyzeFormStructure();
			sendResponse(result);
			return true; // Keep the message channel open for async response
		}
	}
);

console.log("🚀 Form Bot content script loaded");
