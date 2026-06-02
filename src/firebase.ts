// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// Removed provider SDK due to bundling issues with browser extensions

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Cerebras API key
const CEREBRAS_API_KEY = import.meta.env.VITE_CEREBRAS_API_KEY;

// AI Text Generation function using Cerebras REST API directly
export async function generateAIText(prompt: string): Promise<string> {
	console.log("[CEREBRAS] Starting API call...");
	console.log("[CEREBRAS] Prompt length:", prompt.length);

	try {
		const response = await fetch("https://api.cerebras.ai/v1/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${CEREBRAS_API_KEY}`,
			},
			body: JSON.stringify({
				model: "zai-glm-4.7",
				stream: false,
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
			console.error("[CEREBRAS] API error response:", errorData);
			throw new Error(`Cerebras API error: ${response.status} - ${errorData}`);
		}

		const data = await response.json();
		const text = data.choices?.[0]?.message?.content || "";

		console.log("[CEREBRAS] API call successful!");
		console.log("[CEREBRAS] Response text length:", text.length);
		console.log("[CEREBRAS] Response text preview:", text.substring(0, 500));
		console.log("[CEREBRAS] Full response:", text);

		return text;
	} catch (error) {
		console.error("[CEREBRAS] API call failed!");
		console.error("[CEREBRAS] Error:", error);
		throw error;
	}
}

export { app, analytics };
