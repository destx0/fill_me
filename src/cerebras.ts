// AI Text Generation function using Cerebras REST API directly
export async function generateAIText(
	prompt: string,
	apiKey: string,
	model: string = "zai-glm-4.7"
): Promise<string> {
	console.log("[CEREBRAS] Starting API call...");
	console.log("[CEREBRAS] Model:", model);

	try {
		const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model: model,
				stream: true,
				max_tokens: 65000,
				temperature: 1,
				top_p: 0.95,
				messages: [
					{
						role: "system",
						content: "",
					},
					{
						role: "user",
						content: prompt,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error("[CEREBRAS] API error:", errorData);
			throw new Error(`Cerebras API error: ${response.status} - ${errorData}`);
		}

		const text = response.body
			? await readStreamingChatCompletion(response)
			: ((await response.json()).choices?.[0]?.message?.content || "");

		console.log("[CEREBRAS] Success, response length:", text.length);
		return text;
	} catch (error) {
		console.error("[CEREBRAS] API call failed:", error);
		throw error;
	}
}

async function readStreamingChatCompletion(response: Response): Promise<string> {
	const reader = response.body?.getReader();

	if (!reader) {
		return "";
	}

	const decoder = new TextDecoder();
	let buffer = "";
	let text = "";

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() || "";

		for (const line of lines) {
			const trimmed = line.trim();

			if (!trimmed.startsWith("data:")) {
				continue;
			}

			const data = trimmed.slice("data:".length).trim();

			if (!data || data === "[DONE]") {
				continue;
			}

			try {
				const parsed = JSON.parse(data);
				text += parsed.choices?.[0]?.delta?.content || "";
			} catch (error) {
				console.warn("[CEREBRAS] Failed to parse stream chunk:", error);
			}
		}
	}

	return text;
}
