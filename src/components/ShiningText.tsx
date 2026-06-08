interface ShiningTextProps {
	text: string;
}

export function ShiningText({ text }: ShiningTextProps) {
	return (
		<p className="shining-text">
			{text}
		</p>
	);
}
