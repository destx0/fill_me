export function GooeyLoader() {
	return (
		<div className="gooey-loader-wrap" role="status" aria-label="Loading">
			<svg className="gooey-loader-svg" aria-hidden="true">
				<defs>
					<filter id="form-bot-gooey-loader-filter">
						<feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
						<feColorMatrix
							in="blur"
							mode="matrix"
							values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 46 -7"
							result="goo"
						/>
						<feComposite in="SourceGraphic" in2="goo" operator="atop" />
					</filter>
				</defs>
			</svg>
			<div className="gooey-loader" />
		</div>
	);
}
