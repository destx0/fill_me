import { useEffect, useState } from "react";
import browser from "webextension-polyfill";
import { ActivityPanel } from "../components/ActivityPanel";
import { ProfilePanel } from "../components/ProfilePanel";
import { getProviderName, SidebarHeader } from "../components/SidebarHeader";
import { SettingsPanel } from "../components/SettingsPanel";
import { ActivityStep, FillProgressEvent, Settings, UserDetails } from "./popupTypes";

interface PopupProps {
	analyzeForm?: () => Promise<any>;
	fillForm?: (
		userDetails: UserDetails,
		settings: Settings,
		onProgress?: (event: FillProgressEvent) => void
	) => Promise<any>;
}

const PROVIDERS = [
	{ id: "cerebras", name: "Cerebras" },
	{ id: "groq", name: "Groq" },
] as const;

const MODELS = {
	cerebras: [
		{ id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
		{ id: "gpt-oss-120b", name: "GPT OSS 120B" },
		{ id: "custom", name: "Custom" },
	],
	groq: [
		{ id: "openai/gpt-oss-120b", name: "GPT OSS 120B" },
		{ id: "meta-llama/llama-4-maverick-17b-128e-instruct", name: "Llama 4 Maverick" },
		{ id: "custom", name: "Custom" },
	],
};

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
	provider: "cerebras",
	apiKey: "",
	model: "zai-glm-4.7",
	customModel: "",
};

export default function Popup({ analyzeForm, fillForm }: PopupProps = {}) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string>("");
	const [userDetails, setUserDetails] = useState<UserDetails>(defaultUserDetails);
	const [settings, setSettings] = useState<Settings>(defaultSettings);
	const [showSettings, setShowSettings] = useState(false);
	const [activitySteps, setActivitySteps] = useState<ActivityStep[]>([]);

	useEffect(() => {
		loadData();
	}, []);

	// Auto-save when userDetails or settings change
	useEffect(() => {
		const timeoutId = setTimeout(() => {
			saveData();
		}, 500); // Debounce saves by 500ms

		return () => clearTimeout(timeoutId);
	}, [userDetails, settings]);

	const loadData = async () => {
		try {
			const stored = await browser.storage.local.get(["userDetails", "settings"]);
			if (stored.userDetails) {
				setUserDetails(stored.userDetails);
			}
			if (stored.settings) {
				const storedSettings = stored.settings as Partial<Settings>;
				const providerHasModel = (
					provider: Settings["provider"],
					model?: string
				) => Boolean(model && MODELS[provider].some((m) => m.id === model));
				const provider = storedSettings.provider || (
					storedSettings.model === "openai/gpt-oss-120b" ||
					storedSettings.model === "meta-llama/llama-4-maverick-17b-128e-instruct"
						? "groq"
						: defaultSettings.provider
				);
				const model = providerHasModel(provider, storedSettings.model)
					? storedSettings.model ?? defaultSettings.model
					: defaultSettings.model;

				setSettings({ ...defaultSettings, ...storedSettings, provider, model });
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

	const sendAnalyzeFormMessage = async () => {
		if (analyzeForm) {
			return analyzeForm();
		}

		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});

		if (!tab.id) {
			throw new Error("No active tab found");
		}

		return browser.tabs.sendMessage(tab.id, {
			action: "analyzeForm",
		});
	};

	const sendFillFormMessage = async () => {
		if (fillForm) {
			return fillForm(
				userDetails,
				{ ...settings, model: getActiveModel() },
				(event) => {
					setActivitySteps((steps) => [
						...steps,
						{
							id: Date.now() + steps.length,
							...event,
						},
					]);
					setStatus(event.message);
				}
			);
		}

		const [tab] = await browser.tabs.query({
			active: true,
			currentWindow: true,
		});

		if (!tab.id) {
			throw new Error("No active tab found");
		}

		return browser.tabs.sendMessage(tab.id, {
			action: "fillForm",
			userDetails: userDetails,
			settings: { ...settings, model: getActiveModel() },
		});
	};

	const fillFormWithAI = async () => {
		if (!settings.apiKey) {
			setError(`Please add your ${getProviderName(settings.provider)} API key in settings`);
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
		setActivitySteps([
			{
				id: Date.now(),
				type: "info",
				message: "Starting form fill...",
			},
		]);

		await saveData();

		try {
			setStatus("Analyzing form...");
			setActivitySteps((steps) => [
				...steps,
				{
					id: Date.now() + steps.length,
					type: "info",
					message: "Analyzing visible form fields...",
				},
			]);
			const analyzeResponse = await sendAnalyzeFormMessage();

			if (!analyzeResponse) {
				throw new Error("No form elements found on this page");
			}

			setStatus("Generating and applying form data...");
			const fillResponse = await sendFillFormMessage();

			if (fillResponse && fillResponse.success) {
				setStatus(fillResponse.message || "Form filled successfully!");
				setActivitySteps((steps) => [
					...steps,
					{
						id: Date.now() + steps.length,
						type: "success",
						message: fillResponse.message || "Form filled successfully!",
					},
				]);
			} else {
				throw new Error(fillResponse?.error || "Failed to fill form with AI.");
			}
		} catch (err) {
			console.error("Form filling failed:", err);
			const errorMessage = err instanceof Error ? err.message : "Failed to fill form.";
			setError(errorMessage);
			setActivitySteps((steps) => [
				...steps,
				{
					id: Date.now() + steps.length,
					type: "error",
					message: errorMessage,
				},
			]);
			setStatus("");
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="popup-container">
			<SidebarHeader
				activeView={showSettings ? "settings" : "profile"}
				onSelectView={(view) => setShowSettings(view === "settings")}
			/>

			<main className="workspace-panel">
				<header className="workspace-header">
					<h2>{showSettings ? "Model settings" : "Your form details"}</h2>
				</header>

				{showSettings ? (
					<SettingsPanel
						providers={PROVIDERS}
						models={MODELS}
						settings={settings}
						onChange={setSettings}
						onSave={saveData}
						getProviderName={getProviderName}
					/>
				) : (
					<ProfilePanel
						userDetails={userDetails}
						onChange={setUserDetails}
					/>
				)}

				{error && <div className="error-message">{error}</div>}

				{(isProcessing || activitySteps.length > 0 || status || error) && (
					<ActivityPanel
						currentState={status || error || "Ready for next run"}
						isActive={isProcessing}
					/>
				)}

				<button
					onClick={fillFormWithAI}
					disabled={isProcessing}
					className="fill-form-button"
				>
					{isProcessing ? "Filling..." : "Fill form"}
				</button>
			</main>
		</div>
	);
}
