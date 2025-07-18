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

/**
 * Generates a prompt for AI to create form-filling JavaScript code
 * @param variables - Object containing user portfolio info and form HTML
 * @returns Formatted prompt string
 */
export function generateFormFillPrompt(variables: PromptVariables): string {
	const { userPortfolioInfo, formHtml } = variables;

	return `You are an expert assistant that generates JavaScript code to fill out HTML forms using provided user portfolio information.
Given an HTML form structure, generate a JavaScript code block that, when executed in a browser, will:
- Fill ALL input fields (text, email, number, password, date, tel, url), textareas, and select (dropdown) elements with plausible, diverse, and professional data derived from the user's portfolio.
- SMART DATA FILLING: Use contextual intelligence to fill all fields even when exact data isn't in the portfolio:
  1. Infer related information from available data (e.g., if location is provided, infer timezone, area code, etc.)
  2. Generate realistic, professional data that's contextually appropriate
  3. Make intelligent assumptions based on industry, role, education, or other provided context
  4. Fill missing personal details with plausible alternatives that maintain consistency
- NEVER SUBMIT THE FORM: Do not click submit buttons, form submission buttons, or trigger form submission events. Only fill the form fields.
- CRITICAL: For each field, you must simulate real user interaction by:
  1. First calling .focus() on the field to focus it
  2. Then setting the value using .value = "your_value"
  3. Then trigger these events IN ORDER: 'focus', 'input', 'change', 'blur'
  4. Use dispatchEvent(new Event('eventName', { bubbles: true })) for proper event simulation
  5. Example: field.focus(); field.value = "value"; field.dispatchEvent(new Event('input', {bubbles: true})); field.dispatchEvent(new Event('change', {bubbles: true})); field.dispatchEvent(new Event('blur', {bubbles: true}));
- For radio buttons: Select the most relevant option, then trigger 'change' and 'click' events.
- For checkboxes: Check relevant options using .checked = true, then trigger 'change' and 'click' events.
- For dropdowns (select): Choose the option, set .value, then trigger 'change' event.
- For COUNTRY selection dropdowns: Always select the main country name (e.g., "India" not territories, "United States" not territories, "United Kingdom" not dependencies). Look for the exact country name without territories, dependencies, or regions.
- For DEPENDENT/CASCADING fields (state/province after country, city after state, etc.): 
  1. Fill fields in the correct order and ensure selections are geographically consistent
  2. After selecting a country, wait 500ms before selecting state: setTimeout(() => { /* state selection */ }, 500);
  3. After selecting state, wait 500ms before selecting city: setTimeout(() => { /* city selection */ }, 500);
  4. Always trigger 'change' event after each selection to load dependent options
- For PHONE NUMBER inputs: Handle various phone input types including international phone inputs:
  1. For standard phone inputs, focus the field, enter the full number with country code (e.g., +91 9876543210), then trigger events
  2. For international phone libraries, look for country selector elements and phone number inputs
  3. If there's a country dropdown, select the appropriate country first, trigger events, wait 300ms
  4. Then focus the phone input field, clear it, enter the local phone number without country code, trigger events
  5. For India: country code +91, local number 9876543210
  6. For US: country code +1, local number 5551234567
- VALIDATION HANDLING: 
  1. Ensure all required fields (marked with required attribute or aria-required) are filled
  2. For email fields, use proper email format: firstname.lastname@domain.com
  3. For number fields, use valid numeric values within any specified min/max ranges
  4. For date fields, use proper date format (YYYY-MM-DD or MM/DD/YYYY based on input type)
- READONLY AND DISABLED FIELDS: Do NOT modify fields that are:
  1. Marked with readonly attribute (readonly="true" or readonly)
  2. Marked with disabled attribute (disabled="true" or disabled)
  3. Have readOnly property set to true
  4. Skip these fields entirely - do not focus, set values, or trigger events on them
- Add appropriate delays between actions: setTimeout(() => { /* action */ }, 100-200);
- SMART CONTEXTUAL FILLING: For all fields, use intelligent inference to fill data even when not explicitly provided:
  1. Use contextual clues from existing portfolio information to generate related data
  2. Maintain consistency across all fields (e.g., location-based phone numbers, appropriate time zones)
  3. Generate professional, realistic data that increases chances of positive evaluation
  4. Fill missing information with industry-appropriate defaults based on available context
- Target fields using document.querySelector() or document.querySelectorAll() with id, name, or type attributes. Prefer id, then name, then type selectors.
- After filling all fields, add a final delay and trigger a form validation check if possible.
- IMPORTANT: Do NOT submit the form, click submit buttons, or trigger form submission events.
- Do NOT include any comments, HTML, Markdown, or extra text. Output ONLY the raw JavaScript code, ready to execute.

USER PORTFOLIO INFORMATION:
${userPortfolioInfo}

FORM HTML:
${formHtml}

Generate the JavaScript code now.`;
}
