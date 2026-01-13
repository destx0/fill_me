// Groq API key
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// AI Text Generation function using Groq REST API directly
export async function generateAIText(prompt: string): Promise<string> {
	console.log("🔄 [GROQ] Starting API call...");
	console.log("📝 [GROQ] Prompt length:", prompt.length);

	try {
		const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${GROQ_API_KEY}`,
			},
			body: JSON.stringify({
				model: "llama-3.3-70b-versatile",
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
			console.error("❌ [GROQ] API error response:", errorData);
			throw new Error(`Groq API error: ${response.status} - ${errorData}`);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";

		console.log("✅ [GROQ] API call successful!");
		console.log("📊 [GROQ] Response text length:", text.length);
		console.log("📄 [GROQ] Response text preview:", text.substring(0, 500));
		console.log("📄 [GROQ] Full response:", text);

		return text;
	} catch (error) {
		console.error("❌ [GROQ] API call failed!");
		console.error("❌ [GROQ] Error:", error);
		throw error;
	}
}
