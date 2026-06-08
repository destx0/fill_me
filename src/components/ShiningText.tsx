import { motion } from "motion/react";

interface ShiningTextProps {
	text: string;
	isActive?: boolean;
}

export function ShiningText({ text, isActive = true }: ShiningTextProps) {
	if (!isActive) {
		return (
			<p className="shining-text is-static">
				{text}
			</p>
		);
	}

	return (
		<motion.p
			className="shining-text is-active"
			initial={{ backgroundPosition: "200% 0" }}
			animate={{ backgroundPosition: "-200% 0" }}
			transition={{
				repeat: Infinity,
				duration: 2,
				ease: "linear",
			}}
		>
			{text}
		</motion.p>
	);
}
