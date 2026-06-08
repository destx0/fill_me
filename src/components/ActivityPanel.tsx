import { GooeyLoader } from "./GooeyLoader";
import { ShiningText } from "./ShiningText";

interface ActivityPanelProps {
	currentState: string;
}

export function ActivityPanel({ currentState }: ActivityPanelProps) {
	return (
		<section className="activity-panel" aria-live="polite">
			<div className="activity-stage">
				<GooeyLoader />
				<ShiningText text={currentState || "Ready"} />
			</div>
		</section>
	);
}
