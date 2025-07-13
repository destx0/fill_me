export function selectBestForm(): Element | null {
	// Find all forms on the page
	const allForms = Array.from(document.querySelectorAll("form"));
	const allInputs = document.querySelectorAll("input, select, textarea");
	const totalInputs = allInputs.length;

	if (totalInputs === 0) {
		console.log("❌ No form elements found on the page");
		return null;
	}

	console.log(`Total forms found: ${allForms.length}`);
	console.log(`Total form elements found: ${totalInputs}`);

	// Filter out hidden and irrelevant forms
	const relevantForms = allForms.filter((form) => {
		const isHidden =
			form.style.display === "none" ||
			form.getAttribute("style")?.includes("display: none") ||
			form.hidden;

		const visibleInputs = form.querySelectorAll(
			"input, select, textarea"
		).length;

		// Form must have at least 50% of page's total inputs
		const hasSignificantInputs = visibleInputs >= totalInputs * 0.5;

		console.log(
			`📋 [FORM CHECK] Form ${
				form.id || "unnamed"
			}: hidden=${isHidden}, visibleInputs=${visibleInputs}, significant=${hasSignificantInputs}`
		);

		return !isHidden && hasSignificantInputs;
	});

	console.log(`Relevant forms found: ${relevantForms.length}`);

	// Select the best form: prioritize forms with more visible inputs
	if (relevantForms.length > 0) {
		const bestForm = relevantForms.reduce((best, current) => {
			const bestInputs = best.querySelectorAll(
				"input, select, textarea"
			).length;
			const currentInputs = current.querySelectorAll(
				"input, select, textarea"
			).length;
			return currentInputs > bestInputs ? current : best;
		});

		console.log(
			`✅ [SELECTED] Using form: ${bestForm.id || "unnamed"} with ${
				bestForm.querySelectorAll("input, select, textarea").length
			} visible inputs`
		);

		return bestForm;
	} else {
		// Fallback to body if no good forms found
		console.log(
			"⚠️ [FALLBACK] No relevant forms found, using document body"
		);
		return document.body;
	}
}

export function cleanFormHtml(formElement: Element): string {
	const clonedForm = formElement.cloneNode(true) as Element;
	const formTagsToKeep = new Set([
		"FORM",
		"INPUT",
		"SELECT",
		"TEXTAREA",
		"LABEL",
		"BUTTON",
		"OPTION",
		"OPTGROUP",
		"FIELDSET",
		"LEGEND",
		"DATALIST",
	]);
	const attributesToKeep = new Set([
		"name",
		"id",
		"type",
		"value",
		"checked",
		"selected",
		"for",
		"placeholder",
		"rows",
		"cols",
		"min",
		"max",
		"step",
		"pattern",
		"title",
		"disabled",
		"readonly",
		"required",
		"multiple",
		"autofocus",
		"list",
		"maxlength",
		"minlength",
		"size",
		"alt",
		"label",
		"aria-label",
		"role",
		"data-qa",
		"data-test",
		"data-label",
		"data-name",
	]);

	const allDescendants = clonedForm.querySelectorAll("*");
	for (let i = allDescendants.length - 1; i >= 0; i--) {
		const el = allDescendants[i];

		// Remove script, style, and hidden forms
		if (el.tagName === "SCRIPT" || el.tagName === "STYLE") {
			el.remove();
			continue;
		}

		// Remove hidden forms (like logout forms)
		if (el.tagName === "FORM") {
			const formEl = el as HTMLFormElement;
			if (
				(formEl.style && formEl.style.display === "none") ||
				formEl.getAttribute("style")?.includes("display: none")
			) {
				console.log(
					`🔧 [CLEANUP] Removing hidden form: ${
						formEl.id || "unnamed"
					}`
				);
				el.remove();
				continue;
			}
		}

		for (let j = el.childNodes.length - 1; j >= 0; j--) {
			if (el.childNodes[j].nodeType === Node.COMMENT_NODE) {
				el.childNodes[j].remove();
			}
		}

		const attributesToRemove = [];
		for (let j = 0; j < el.attributes.length; j++) {
			const attr = el.attributes[j];
			const attrName = attr.name.toLowerCase();

			// Skip invalid regex patterns
			if (attrName === "pattern") {
				try {
					new RegExp(attr.value);
				} catch (e) {
					console.warn(
						`🔧 [CLEANUP] Removing invalid pattern: ${attr.value}`
					);
					attributesToRemove.push(attr.name);
					continue;
				}
			}

			if (!attributesToKeep.has(attrName)) {
				attributesToRemove.push(attr.name);
			}
		}
		attributesToRemove.forEach((attrName) => el.removeAttribute(attrName));

		if (!formTagsToKeep.has(el.tagName)) {
			while (el.firstChild) {
				el.parentNode!.insertBefore(el.firstChild, el);
			}
			el.remove();
		}
	}

	const finalElements = clonedForm.querySelectorAll("*");
	for (let i = finalElements.length - 1; i >= 0; i--) {
		const el = finalElements[i];
		if (
			!formTagsToKeep.has(el.tagName) &&
			el.textContent!.trim() === "" &&
			el.children.length === 0
		) {
			el.remove();
		}
	}

	return clonedForm.outerHTML
		.replace(/></g, ">\n<") // Add line breaks between tags
		.replace(/\s+/g, " ") // Normalize whitespace within content
		.trim();
}
