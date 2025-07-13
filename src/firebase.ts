// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { createGroq } from "@ai-sdk/groq";
import { generateText } from "ai";
// import { GoogleGenerativeAI } from "@google/generative-ai"; // Disabled

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

// Initialize Groq AI with Vercel AI SDK
export const groq = createGroq({
	apiKey: import.meta.env.VITE_GROQ_API_KEY,
});

// Gemini setup (disabled)
// const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || "");
// export const geminiModel = genAI.getGenerativeModel({
// 	model: "gemini-2.5-flash-lite-preview-06-17",
// });

// AI Text Generation function using Groq
export async function generateAIText(prompt: string): Promise<string> {
	const { text } = await generateText({
		model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
		prompt: prompt,
		temperature: 0.7,
		maxTokens: 4096,
	});

	return text;
}

export { app, analytics };
