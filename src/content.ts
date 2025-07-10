import browser from "webextension-polyfill";

interface ElementInfo {
	element: Element;
	inputCount: number;
	depth: number;
	tagName: string;
	id?: string;
	className?: string;
	cleanHtml?: string;
}

function cleanFormHtml(html: string): string {
	// Parse the HTML
	const parser = new DOMParser();
	const doc = parser.parseFromString(html, 'text/html');
	const element = doc.body.firstChild as Element;
	
	if (!element) return html;

	// Essential attributes to keep for form functionality
	const essentialAttrs = new Set([
		'id', 'name', 'type', 'value', 'placeholder', 'required', 
		'checked', 'selected', 'disabled', 'readonly', 'multiple',
		'aria-label', 'aria-describedby', 'role'
	]);

	// Form-related and structural tags to keep
	const keepTags = new Set([
		'form', 'input', 'select', 'option', 'textarea', 'button',
		'label', 'fieldset', 'legend', 'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'
	]);

	function cleanElement(el: Element): Element | null {
		const tagName = el.tagName.toLowerCase();
		
		// Remove non-essential tags
		if (!keepTags.has(tagName)) {
			// If it has form element children, keep as div
			if (el.querySelector('input, select, textarea, button')) {
				const div = doc.createElement('div');
				// Move children to the div
				while (el.firstChild) {
					const child = el.firstChild;
					if (child.nodeType === Node.ELEMENT_NODE) {
						const cleaned = cleanElement(child as Element);
						if (cleaned) div.appendChild(cleaned);
					} else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
						div.appendChild(child.cloneNode(true));
					}
					el.removeChild(child);
				}
				return div.children.length > 0 ? div : null;
			}
			return null;
		}

		// Create new element with same tag
		const newEl = doc.createElement(tagName);
		
		// Copy essential attributes only
		for (const attr of el.attributes) {
			if (essentialAttrs.has(attr.name)) {
				// Clean class attribute - keep only if it looks form-related
				if (attr.name === 'class') {
					const classes = attr.value.split(' ').filter(cls => 
						/form|input|field|control|select|text|button|required|error|valid|invalid/.test(cls.toLowerCase())
					);
					if (classes.length > 0) {
						newEl.setAttribute('class', classes.join(' '));
					}
				} else {
					newEl.setAttribute(attr.name, attr.value);
				}
			}
		}
		
		// Process children
		for (const child of el.children) {
			const cleaned = cleanElement(child);
			if (cleaned) newEl.appendChild(cleaned);
		}
		
		// Handle text content
		for (const node of el.childNodes) {
			if (node.nodeType === Node.TEXT_NODE) {
				const text = node.textContent?.trim();
				if (text) {
					newEl.appendChild(doc.createTextNode(text));
				}
			}
		}
		
		// Only return if element has content or is a form control
		if (newEl.children.length > 0 || 
			['input', 'select', 'textarea', 'button'].includes(tagName) ||
			(newEl.textContent && newEl.textContent.trim())) {
			return newEl;
		}
		
		return null;
	}

	const cleaned = cleanElement(element);
	if (!cleaned) return '';
	
	// Return minimized HTML
	return cleaned.outerHTML
		.replace(/>\s+</g, '><')  // Remove whitespace between tags
		.replace(/\s+/g, ' ')     // Normalize whitespace
		.trim();
}

function saveAsHtmlFile(content: string, filename: string) {
	const blob = new Blob([content], { type: "text/html" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.style.display = "none";
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

function findDeepestFormContainer(): ElementInfo | null {
	// Get all input elements in the document (including all form controls)
	const allInputs = document.querySelectorAll("input, select, textarea");
	const totalInputs = allInputs.length;

	if (totalInputs === 0) {
		console.log("No form elements found on the page");
		return null;
	}

	console.log(`Total form elements found: ${totalInputs}`);
	const threshold = Math.ceil(totalInputs * 0.8);
	console.log(
		`Looking for element containing at least ${threshold} form elements (80% of ${totalInputs})`
	);

	let bestCandidate: ElementInfo | null = null;
	let maxDepth = -1;

	// Function to count form elements in an element's subtree
	function countInputsInSubtree(element: Element): number {
		return element.querySelectorAll("input, select, textarea").length;
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

	// More efficient approach: start from containers that are likely to have forms
	const potentialContainers = document.querySelectorAll(
		'form, div[class*="form"], div[id*="form"], div[class*="question"], div[id*="question"], main, section, article, .container, .content, [role="main"]'
	);

	// If no likely containers found, fall back to all elements
	const elementsToCheck =
		potentialContainers.length > 0
			? potentialContainers
			: document.querySelectorAll("*");

	for (const element of elementsToCheck) {
		const inputCount = countInputsInSubtree(element);

		// Check if this element contains at least 80% of inputs
		if (inputCount >= threshold) {
			const depth = getDepth(element);

			const elementInfo: ElementInfo = {
				element,
				inputCount,
				depth,
				tagName: element.tagName.toLowerCase(),
				id: element.id || undefined,
				className: element.className || undefined,
				cleanHtml: cleanFormHtml(element.outerHTML),
			};

			// We want the deepest element that still contains ≥80% of inputs
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
		console.log(`   Contains: ${result.inputCount} form elements`);
		console.log(`   Element:`, result.element);

		// Save cleaned HTML to file
		if (result.cleanHtml) {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const filename = `form-container-${timestamp}.html`;

			// Create a complete HTML document
			const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extracted Form Container</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .extraction-info { background: #f0f0f0; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
        .form-container { border: 2px solid #007acc; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="extraction-info">
        <h1>Form Container Extraction</h1>
        <p><strong>Extracted from:</strong> ${window.location.href}</p>
        <p><strong>Element:</strong> &lt;${result.tagName}&gt;</p>
        <p><strong>ID:</strong> ${result.id || "none"}</p>
        <p><strong>Class:</strong> ${result.className || "none"}</p>
        <p><strong>DOM Depth:</strong> ${result.depth}</p>
        <p><strong>Form Elements:</strong> ${result.inputCount} of ${
				document.querySelectorAll("input, select, textarea").length
			} total (${Math.round(
				(result.inputCount /
					document.querySelectorAll("input, select, textarea")
						.length) *
					100
			)}%)</p>
        <p><strong>Extraction Time:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <div class="form-container">
        <h2>Extracted Form Container:</h2>
        ${result.cleanHtml}
    </div>
</body>
</html>`;

			saveAsHtmlFile(fullHtml, filename);
			console.log(`📁 Saved cleaned HTML to: ${filename}`);
		}

		// Highlight the element temporarily
		if (result.element instanceof HTMLElement) {
			const originalBorder = result.element.style.border;
			const originalBackgroundColor =
				result.element.style.backgroundColor;

			result.element.style.border = "3px solid red";
			result.element.style.backgroundColor = "rgba(255, 0, 0, 0.1)";

			// Remove highlight after 5 seconds (longer to account for file save)
			setTimeout(() => {
				if (result.element instanceof HTMLElement) {
					result.element.style.border = originalBorder;
					result.element.style.backgroundColor =
						originalBackgroundColor;
				}
			}, 5000);
		}

		return {
			tagName: result.tagName,
			id: result.id,
			className: result.className,
			depth: result.depth,
			inputCount: result.inputCount,
			totalInputs: document.querySelectorAll("input, select, textarea")
				.length,
			htmlSaved: true,
			url: window.location.href,
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
