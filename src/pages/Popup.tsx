import { useEffect, useState } from "react";
import "./Popup.css";
import browser from "webextension-polyfill";

interface CleanResult {
	cleanHtml: string;
	inputCount: number;
	url: string;
}

export default function () {
	const [isCleaning, setIsCleaning] = useState(false);
	const [isTestingAI, setIsTestingAI] = useState(false);
	const [result, setResult] = useState<CleanResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [testResult, setTestResult] = useState<string | null>(null);

	useEffect(() => {
		console.log("Hello from the popup!");
	}, []);

	const cleanFormHtml = async () => {
		setIsCleaning(true);
		setError(null);
		setResult(null);

		try {
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) {
				throw new Error("No active tab found");
			}

			const response = await browser.tabs.sendMessage(tab.id, {
				action: "analyzeForm",
			});

			if (response) {
				setResult(response);
				console.log("✅ [POPUP] Clean form HTML result:", response);
				console.log("🧹 [POPUP] Cleaned HTML:", response.cleanHtml);
			} else {
				setError("No form elements found on this page");
			}
		} catch (err) {
			console.error("Form cleaning failed:", err);
			setError(
				"Failed to clean form HTML. Make sure you're on a page with form elements."
			);
		} finally {
			setIsCleaning(false);
		}
	};

	const testGeminiAPI = async () => {
		setIsTestingAI(true);
		setError(null);
		setTestResult(null);

		try {
			// Get the current active tab
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) {
				throw new Error("No active tab found");
			}

			// Send message to content script to test Gemini API
			const response = await browser.tabs.sendMessage(tab.id, {
				action: "testGeminiAPI",
				message: "hi",
			});

			if (response && response.success) {
				setTestResult(response.reply);
				console.log("Gemini API test successful:", response.reply);
			} else {
				setError(
					response?.error ||
						"Failed to test Gemini API. Check your API key."
				);
			}
		} catch (err) {
			console.error("Gemini API test failed:", err);
			setError(
				"Failed to test Gemini API. Make sure you have a valid API key."
			);
		} finally {
			setIsTestingAI(false);
		}
	};

	return (
		<div>
			<button
				onClick={cleanFormHtml}
				disabled={isCleaning}
				className="analyze-button"
			>
				{isCleaning ? "Cleaning..." : "Clean Form HTML"}
			</button>

			<button
				onClick={testGeminiAPI}
				disabled={isTestingAI}
				className="test-button"
			>
				{isTestingAI ? "Testing..." : "Test Gemini API"}
			</button>

			{error && <div className="error-message">{error}</div>}

			{result && (
				<div className="result">
					<h3>Cleaned Form HTML:</h3>
					<p>
						<strong>Form elements found:</strong>{" "}
						{result.inputCount}
					</p>
					<p>
						<strong>Page URL:</strong> {result.url}
					</p>
					<div className="html-output">
						<pre>{result.cleanHtml}</pre>
					</div>
				</div>
			)}

			{testResult && (
				<div className="test-result">
					<h3>Gemini API Test Result:</h3>
					<p>{testResult}</p>
				</div>
			)}
		</div>
	);
}
