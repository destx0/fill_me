import { Settings } from "../pages/popupTypes";

interface Option {
	id: string;
	name: string;
}

interface SettingsPanelProps {
	providers: ReadonlyArray<{ id: Settings["provider"]; name: string }>;
	models: Record<Settings["provider"], Option[]>;
	settings: Settings;
	onChange: (settings: Settings) => void;
	onSave: () => void;
	getProviderName: (provider: Settings["provider"]) => string;
}

export function SettingsPanel({
	providers,
	models,
	settings,
	onChange,
	onSave,
	getProviderName,
}: SettingsPanelProps) {
	return (
		<div className="settings-panel">
			<div className="settings-section">
				<label className="input-label">Provider</label>
				<div className="model-buttons">
					{providers.map((provider) => (
						<button
							key={provider.id}
							className={`model-btn ${settings.provider === provider.id ? "active" : ""}`}
							onClick={() => onChange({
								...settings,
								provider: provider.id,
								model: models[provider.id][0].id,
								customModel: "",
							})}
						>
							{provider.name}
						</button>
					))}
				</div>
			</div>

			<div className="settings-section">
				<label className="input-label">{getProviderName(settings.provider)} API Key</label>
				<input
					type="password"
					className="text-input"
					value={settings.apiKey}
					onChange={(event) => onChange({ ...settings, apiKey: event.target.value })}
					placeholder={settings.provider === "cerebras" ? "csk_..." : "gsk_..."}
				/>
			</div>

			<div className="settings-section">
				<label className="input-label">Model</label>
				<div className="model-buttons">
					{models[settings.provider].map((model) => (
						<button
							key={model.id}
							className={`model-btn ${settings.model === model.id ? "active" : ""}`}
							onClick={() => onChange({ ...settings, model: model.id })}
						>
							{model.name}
						</button>
					))}
				</div>
				{settings.model === "custom" && (
					<input
						type="text"
						className="text-input"
						value={settings.customModel}
						onChange={(event) => onChange({ ...settings, customModel: event.target.value })}
						placeholder="Enter model name..."
					/>
				)}
			</div>

			<button className="save-button" onClick={onSave}>
				Save settings
			</button>
		</div>
	);
}
