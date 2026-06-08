import { Settings } from "../pages/popupTypes";

interface SidebarHeaderProps {
	activeView: "profile" | "settings";
	onSelectView: (view: "profile" | "settings") => void;
}

export function SidebarHeader({
	activeView,
	onSelectView,
}: SidebarHeaderProps) {
	return (
		<header className="sidebar-rail">
			<div className="brand-block">
				<div className="brand-mark">FB</div>
				<div>
					<p className="eyebrow">Form Bot</p>
					<h1>Autofill console</h1>
				</div>
			</div>

			<nav className="sidebar-nav" aria-label="Panel sections">
				<button
					className={`nav-button ${activeView === "profile" ? "active" : ""}`}
					onClick={() => onSelectView("profile")}
				>
					Profile
				</button>
				<button
					className={`nav-button ${activeView === "settings" ? "active" : ""}`}
					onClick={() => onSelectView("settings")}
				>
					Settings
				</button>
			</nav>

		</header>
	);
}

export function getProviderName(provider: Settings["provider"]) {
	return provider === "cerebras" ? "Cerebras" : "Groq";
}
