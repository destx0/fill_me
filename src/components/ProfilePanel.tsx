import { UserDetails } from "../pages/popupTypes";

interface ProfilePanelProps {
	userDetails: UserDetails;
	onChange: (userDetails: UserDetails) => void;
}

export function ProfilePanel({ userDetails, onChange }: ProfilePanelProps) {
	return (
		<textarea
			className="user-details-input"
			value={userDetails.personalInfo}
			onChange={(event) => onChange({ personalInfo: event.target.value })}
			placeholder="Enter your personal and professional information here..."
		/>
	);
}
