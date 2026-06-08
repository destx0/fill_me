export interface UserDetails {
	personalInfo: string;
}

export interface Settings {
	provider: "cerebras" | "groq";
	apiKey: string;
	model: string;
	customModel: string;
}

export interface FillProgressEvent {
	type: "info" | "success" | "warning" | "error";
	message: string;
	details?: string[];
}

export interface ActivityStep extends FillProgressEvent {
	id: number;
}
