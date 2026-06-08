/**
 * AI Prompt Template for Form Auto-Fill
 *
 * This template generates prompts for AI to create JavaScript code
 * that automatically fills out HTML forms with user portfolio information.
 */

export interface PromptVariables {
	userPortfolioInfo: string;
	formHtml: string;
}

export interface ValidationPromptVariables extends PromptVariables {
	missedFields: string;
}

/**
 * Generates a prompt for AI to create form-filling JavaScript code
 * @param variables - Object containing user portfolio info and form HTML
 * @returns Formatted prompt string
 */
export function generateFormFillPrompt(variables: PromptVariables): string {
	const { userPortfolioInfo, formHtml } = variables;

	return `Generate browser JavaScript to fill this form. Output ONLY raw JavaScript. No Markdown. No comments.

Rules:
- Fill every visible enabled input, textarea, select, required checkbox group, and required radio group.
- Never submit the form. Never click submit buttons.
- Skip disabled, readonly, hidden, file, image, submit, reset, and button inputs.
- Prefer stable selectors: id, then name, then aria-label, then placeholder.
- Use var only. Avoid let and const.
- Keep code simple for a small model. Do not create large abstractions.
- For each text-like field: focus it, set value, dispatch input, dispatch change, blur it.
- For select fields: choose an existing non-empty option that best matches the profile, set value, dispatch input and change.
- For checkbox/radio: set checked=true on the best option, dispatch click and change.
- For email, phone, URL, number, date: use a valid value for that type.
- If exact data is missing, infer a realistic professional value consistent with the profile.
- Include a small helper function setValue(field, value) and reuse it.
- At the end, run checkValidity on the form if available, but do not submit.

USER PORTFOLIO INFORMATION:
${userPortfolioInfo}

FORM HTML:
${formHtml}

Generate the JavaScript code now.`;
}

export function generateValidationFillPrompt(variables: ValidationPromptVariables): string {
	const { userPortfolioInfo, formHtml, missedFields } = variables;

	return `Generate a SMALL repair JavaScript script for missed form fields. Output ONLY raw JavaScript. No Markdown. No comments.

Context:
- The first fill pass already ran.
- Only fix the missed fields listed below.
- Never submit the form. Never click submit buttons.
- Skip disabled, readonly, hidden, file, image, submit, reset, and button inputs.
- Use var only. Avoid let and const.
- Prefer id selectors, then name selectors, then aria-label or placeholder selectors.
- For each text-like field: focus it, set value, dispatch input, dispatch change, blur it.
- For select fields: choose an existing non-empty option that best matches the profile, set value, dispatch input and change.
- For checkbox/radio groups: choose the most relevant visible enabled option and dispatch click/change.
- Keep the script short and direct. Do not rewrite the full first-pass script.

USER PORTFOLIO INFORMATION:
${userPortfolioInfo}

MISSED FIELDS TO FIX:
${missedFields}

FORM HTML:
${formHtml}

Generate the repair JavaScript now.`;
}
