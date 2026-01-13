// AI Text Generation function using Groq REST API directly
export async function generateAIText(
	prompt: string,
	apiKey: string,
	model: string = "openai/gpt-oss-120b"
): Promise<string> {
	console.log("[GROQ] Starting API call...");
	console.log("[GROQ] Model:", model);

	try {
		const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: model,
				messages: [
					{
						role: "user",
						content: prompt,
					},
				],
				temperature: 0.7,
				max_tokens: 4096,
			}),
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error("[GROQ] API error:", errorData);
			throw new Error(`Groq API error: ${response.status} - ${errorData}`);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";

		console.log("[GROQ] Success, response length:", text.length);
		return text;
	} catch (error) {
		console.error("[GROQ] API call failed:", error);
		throw error;
	}
}
