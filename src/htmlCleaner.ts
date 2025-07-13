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

	// ↑ ADDED "class" and "tabindex" here ↓
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
		// newly added:
		"class",
		"tabindex",
	]);

	const allDescendants = clonedForm.querySelectorAll("*");
	for (let i = allDescendants.length - 1; i >= 0; i--) {
		const el = allDescendants[i];

		// strip out scripts/styles
		if (el.tagName === "SCRIPT" || el.tagName === "STYLE") {
			el.remove();
			continue;
		}

		// optional: remove entirely hidden forms
		if (el.tagName === "FORM") {
			const f = el as HTMLFormElement;
			if (
				f.style.display === "none" ||
				f.getAttribute("style")?.includes("display: none") ||
				f.hidden
			) {
				f.remove();
				continue;
			}
		}

		// remove comment nodes
		for (let j = el.childNodes.length - 1; j >= 0; j--) {
			if (el.childNodes[j].nodeType === Node.COMMENT_NODE) {
				el.childNodes[j].remove();
			}
		}

		// prune attributes
		const toRemove: string[] = [];
		for (let j = 0; j < el.attributes.length; j++) {
			const a = el.attributes[j];
			const name = a.name.toLowerCase();

			// if it’s the pattern attr, ensure it’s a valid regex
			if (name === "pattern") {
				try {
					new RegExp(a.value);
				} catch {
					toRemove.push(a.name);
					continue;
				}
			}

			// ONLY keep if it’s in our whitelist OR data-* OR aria-*
			if (
				!attributesToKeep.has(name) &&
				!name.startsWith("data-") &&
				!name.startsWith("aria-")
			) {
				toRemove.push(a.name);
			}
		}
		toRemove.forEach((n) => el.removeAttribute(n));

		// if this tag itself is not one of our FORM tags, unwrap it
		if (!formTagsToKeep.has(el.tagName)) {
			while (el.firstChild) {
				el.parentNode!.insertBefore(el.firstChild, el);
			}
			el.remove();
		}
	}

	// remove any empty non-form elements
	const finalEls = clonedForm.querySelectorAll("*");
	for (let i = finalEls.length - 1; i >= 0; i--) {
		const el = finalEls[i];
		if (
			!formTagsToKeep.has(el.tagName) &&
			el.textContent!.trim() === "" &&
			el.children.length === 0
		) {
			el.remove();
		}
	}

	return clonedForm.outerHTML
		.replace(/></g, ">\n<")
		.replace(/\s+/g, " ")
		.trim();
}
