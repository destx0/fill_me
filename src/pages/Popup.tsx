import { useEffect, useState } from "react";
import "./Popup.css";
import browser from "webextension-polyfill";

interface CleanResult {
	cleanHtml: string;
	inputCount: number;
	url: string;
}

export default function () {
	const [isProcessing, setIsProcessing] = useState(false);
	const [result, setResult] = useState<CleanResult | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string>("");

	useEffect(() => {
		console.log("Hello from the popup!");
	}, []);

	const fillFormWithAI = async () => {
		setIsProcessing(true);
		setError(null);
		setResult(null);
		setStatus("");

		try {
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) {
				throw new Error("No active tab found");
			}

			// Step 1: Analyze Form
			setStatus("🔍 Analyzing form...");
			const analyzeResponse = await browser.tabs.sendMessage(tab.id, {
				action: "analyzeForm",
			});

			if (!analyzeResponse) {
				throw new Error("No form elements found on this page");
			}

			setResult(analyzeResponse);
			console.log("✅ [POPUP] Form analyzed:", analyzeResponse);

			// Step 2: Fill Form with AI
			setStatus("🤖 Generating and applying form data...");
			const fillResponse = await browser.tabs.sendMessage(tab.id, {
				action: "fillForm",
			});

			if (fillResponse && fillResponse.success) {
				setStatus(
					"✅ Form filled successfully with AI-generated data!"
				);
				console.log("Form filling successful:", fillResponse);
			} else {
				throw new Error(
					fillResponse?.error ||
						"Failed to fill form with AI. Check your API key."
				);
			}
		} catch (err) {
			console.error("Form filling failed:", err);
			setError(
				err instanceof Error
					? err.message
					: "Failed to fill form. Make sure you're on a page with form elements and have a valid API key."
			);
			setStatus("");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div>
			<button
				onClick={fillFormWithAI}
				disabled={isProcessing}
				className="fill-form-button"
			>
				{isProcessing ? "Processing..." : "🤖 Auto Fill Form with AI"}
			</button>

			{status && <div className="status-message">{status}</div>}

			{error && <div className="error-message">{error}</div>}

			{result && (
				<div className="result">
					<h3>Form Analysis:</h3>
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
		</div>
	);
}
