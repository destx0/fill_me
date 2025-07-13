import { useEffect, useState } from "react";
import "./Popup.css";
import browser from "webextension-polyfill";

interface UserDetails {
	personalInfo: string;
}

const defaultUserDetails: UserDetails = {
	personalInfo: `Full Name: Alex Johnson
Email: alex.johnson.dev@gmail.com
Phone: +1 (555) 123-4567
Address: 123 Tech Street, San Francisco, CA 94102, USA
Date of Birth: March 15, 1995
LinkedIn: https://linkedin.com/in/alexjohnsondev
GitHub: https://github.com/alexjohnsondev
Portfolio Website: https://alexjohnson.dev
Current Position: Senior Full Stack Developer
Company: TechCorp Solutions
Years of Experience: 6 years
Education: Bachelor's in Computer Science, Stanford University (2017)
Skills: JavaScript, TypeScript, React, Node.js, Python, AWS, Docker, MongoDB, PostgreSQL, Git, Agile, Machine Learning
Certifications: AWS Certified Developer, Google Cloud Professional
Languages: English (Native), Spanish (Conversational)
Salary Expectation: $120,000 - $150,000
Availability: Immediate (2 weeks notice)
Work Authorization: US Citizen
Preferred Work Type: Hybrid/Remote`,
};

export default function () {
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string>("");
	const [userDetails, setUserDetails] =
		useState<UserDetails>(defaultUserDetails);

	useEffect(() => {
		loadUserDetails();
	}, []);

	const loadUserDetails = async () => {
		try {
			const stored = await browser.storage.local.get("userDetails");
			if (stored.userDetails) {
				setUserDetails(stored.userDetails);
			}
		} catch (error) {
			console.error("Failed to load user details:", error);
		}
	};

	const saveUserDetails = async () => {
		try {
			await browser.storage.local.set({ userDetails });
		} catch (error) {
			console.error("Failed to save user details:", error);
		}
	};

	const fillFormWithAI = async () => {
		setIsProcessing(true);
		setError(null);
		setStatus("");

		// Auto-save user details when filling form
		await saveUserDetails();

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

			console.log("✅ [POPUP] Form analyzed:", analyzeResponse);

			// Step 2: Send user details to content script and fill form
			setStatus("🤖 Generating and applying form data...");
			const fillResponse = await browser.tabs.sendMessage(tab.id, {
				action: "fillForm",
				userDetails: userDetails,
			});

			if (fillResponse && fillResponse.success) {
				setStatus("✅ Form filled successfully!");
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

	const handleInputChange = (value: string) => {
		setUserDetails({ personalInfo: value });
	};

	return (
		<div className="popup-container">
			<h1 className="popup-title">🤖 Form Bot</h1>

			<textarea
				className="user-details-input"
				value={userDetails.personalInfo}
				onChange={(e) => handleInputChange(e.target.value)}
				placeholder="Enter your personal and professional information here..."
				rows={12}
			/>

			<button
				onClick={fillFormWithAI}
				disabled={isProcessing}
				className="fill-form-button"
			>
				{isProcessing ? "Processing..." : "🚀 AUTO FILL FORM"}
			</button>

			{status && <div className="status-message">{status}</div>}
			{error && <div className="error-message">{error}</div>}
		</div>
	);
}
