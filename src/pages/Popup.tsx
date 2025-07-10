import { useEffect, useState } from "react";
import "./Popup.css";
import browser from "webextension-polyfill";

interface AnalysisResult {
	tagName: string;
	id?: string;
	className?: string;
	depth: number;
	inputCount: number;
	totalInputs: number;
}

export default function () {
	const [isAnalyzing, setIsAnalyzing] = useState(false);
	const [result, setResult] = useState<AnalysisResult | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		console.log("Hello from the popup!");
	}, []);

	const analyzeCurrentPage = async () => {
		setIsAnalyzing(true);
		setError(null);
		setResult(null);

		try {
			// Get the current active tab
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) {
				throw new Error("No active tab found");
			}

			// Send message to content script
			const response = await browser.tabs.sendMessage(tab.id, {
				action: "analyzeForm",
			});

			if (response) {
				setResult(response);
				console.log("Analysis result:", response);
			} else {
				setError("No suitable form container found on this page");
			}
		} catch (err) {
			console.error("Analysis failed:", err);
			setError(
				"Failed to analyze page. Make sure you're on a page with form inputs."
			);
		} finally {
			setIsAnalyzing(false);
		}
	};

	return (
		<div>
			<img src="/icon-with-shadow.svg" alt="Form Bot Extension Icon" />
			<h1>Form Bot</h1>
			<p>Find the deepest element containing ≥90% of form inputs</p>

			<button
				onClick={analyzeCurrentPage}
				disabled={isAnalyzing}
				className="analyze-button"
			>
				{isAnalyzing ? "Analyzing..." : "Analyze Current Page"}
			</button>

			{error && <div className="error-message">{error}</div>}

			{result && (
				<div className="result-container">
					<h3>Analysis Result:</h3>
					<p>
						<strong>Element:</strong> &lt;{result.tagName}&gt;
					</p>
					{result.id && (
						<p>
							<strong>ID:</strong> {result.id}
						</p>
					)}
					{result.className && (
						<p>
							<strong>Class:</strong> {result.className}
						</p>
					)}
					<p>
						<strong>Depth:</strong> {result.depth}
					</p>
					<p>
						<strong>Contains:</strong> {result.inputCount} of{" "}
						{result.totalInputs} inputs (
						{Math.round(
							(result.inputCount / result.totalInputs) * 100
						)}
						%)
					</p>
					<p className="result-note">
						The element has been highlighted on the page for 3
						seconds.
					</p>
				</div>
			)}
		</div>
	);
}
