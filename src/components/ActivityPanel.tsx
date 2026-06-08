import { GooeyLoader } from "./GooeyLoader";
import { ShiningText } from "./ShiningText";

interface ActivityPanelProps {
	currentState: string;
	isActive: boolean;
}

export function ActivityPanel({ currentState, isActive }: ActivityPanelProps) {
	return (
		<section className={`activity-panel ${isActive ? "is-active" : "is-complete"}`} aria-live="polite">
			<div className="activity-stage">
				{isActive && <GooeyLoader />}
				<ShiningText text={currentState || "Ready"} isActive={isActive} />
			</div>
		</section>
	);
}
