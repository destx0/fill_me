import { useEffect, useState } from "react";
import "./Popup.css";
import browser from "webextension-polyfill";

interface UserDetails {
	personalInfo: string;
}

interface Settings {
	apiKey: string;
	model: string;
	customModel: string;
}

const MODELS = [
	{ id: "openai/gpt-oss-120b", name: "GPT OSS 120B" },
	{ id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick" },
	{ id: "custom", name: "Custom" },
];

const defaultUserDetails: UserDetails = {
	personalInfo: `Full Name: Rahul Sharma
Email: rahul.sharma.dev@gmail.com
Phone: +91 98765 43210
Address: 42, Koramangala 4th Block, Bangalore, Karnataka 560034, India
Date of Birth: 15/03/1995
Gender: Male
LinkedIn: https://linkedin.com/in/rahulsharmadev
GitHub: https://github.com/rahulsharmadev
Portfolio: https://rahulsharma.dev

Current Position: Senior Software Engineer
Current Company: Infosys
Current CTC: 18 LPA
Expected CTC: 25-30 LPA
Notice Period: 60 days (Negotiable)
Years of Experience: 5 years
`,
};

const defaultSettings: Settings = {
	apiKey: "",
	model: "openai/gpt-oss-120b",
	customModel: "",
};

export default function () {
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string>("");
	const [userDetails, setUserDetails] = useState<UserDetails>(defaultUserDetails);
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		loadData();
	}, []);

	const loadData = async () => {
		try {
			const stored = await browser.storage.local.get(["userDetails", "settings"]);
			if (stored.userDetails) {
				setUserDetails(stored.userDetails);
			}
			if (stored.settings) {
				setSettings({ ...defaultSettings, ...stored.settings });
			}
		} catch (error) {
			console.error("Failed to load data:", error);
		}
	};

	const saveData = async () => {
		try {
			await browser.storage.local.set({ userDetails, settings });
		} catch (error) {
			console.error("Failed to save data:", error);
		}
	};

	const getActiveModel = () => {
		return settings.model === "custom" ? settings.customModel : settings.model;
	};

	const fillFormWithAI = async () => {
		if (!settings.apiKey) {
			setError("Please add your Groq API key in settings");
			setShowSettings(true);
			return;
		}

		if (settings.model === "custom" && !settings.customModel) {
			setError("Please enter a custom model name");
			setShowSettings(true);
			return;
		}

		setIsProcessing(true);
		setError(null);
		setStatus("");

		await saveData();

		try {
			const [tab] = await browser.tabs.query({
				active: true,
				currentWindow: true,
			});

			if (!tab.id) {
				throw new Error("No active tab found");
			}

			setStatus("Analyzing form...");
			const analyzeResponse = await browser.tabs.sendMessage(tab.id, {
				action: "analyzeForm",
			});

			if (!analyzeResponse) {
				throw new Error("No form elements found on this page");
			}

			setStatus("Generating and applying form data...");
			const fillResponse = await browser.tabs.sendMessage(tab.id, {
				action: "fillForm",
				userDetails: userDetails,
				settings: { ...settings, model: getActiveModel() },
			});

			if (fillResponse && fillResponse.success) {
				setStatus("Form filled successfully!");
			} else {
				throw new Error(fillResponse?.error || "Failed to fill form with AI.");
			}
		} catch (err) {
			console.error("Form filling failed:", err);
			setError(err instanceof Error ? err.message : "Failed to fill form.");
			setStatus("");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="popup-container">
			<div className="header-row">
				<button
					className="settings-toggle"
					onClick={() => setShowSettings(!showSettings)}
				>
					{showSettings ? "Back" : "Settings"}
				</button>
			</div>

			{showSettings ? (
				<div className="settings-panel">
					<div className="settings-section">
						<label className="input-label">Groq API Key</label>
						<input
							type="password"
							className="text-input"
							value={settings.apiKey}
							onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
							placeholder="gsk_..."
						/>
					</div>

					<div className="settings-section">
						<label className="input-label">Model</label>
						<div className="model-buttons">
							{MODELS.map((m) => (
								<button
									key={m.id}
									className={`model-btn ${settings.model === m.id ? "active" : ""}`}
									onClick={() => setSettings({ ...settings, model: m.id })}
								>
									{m.name}
								</button>
							))}
						</div>
						{settings.model === "custom" && (
							<input
								type="text"
								className="text-input"
								value={settings.customModel}
								onChange={(e) => setSettings({ ...settings, customModel: e.target.value })}
								placeholder="Enter model name..."
							/>
						)}
					</div>

					<button className="save-button" onClick={saveData}>
						Save
					</button>
				</div>
			) : (
				<>
					<textarea
						className="user-details-input"
						value={userDetails.personalInfo}
						onChange={(e) => setUserDetails({ personalInfo: e.target.value })}
						placeholder="Enter your personal and professional information here..."
					/>

					<button
						onClick={fillFormWithAI}
						disabled={isProcessing}
						className="fill-form-button"
					>
						{isProcessing ? "Filling..." : "Fill"}
					</button>
				</>
			)}

			{status && <div className="status-message">{status}</div>}
			{error && <div className="error-message">{error}</div>}
		</div>
	);
}
