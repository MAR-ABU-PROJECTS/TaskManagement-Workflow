// utils/renderComment.tsx
export function renderComment(text: string) {
	const parts = text.split(/(@\[[^\]]+\]\([^)]+\))/);

	return parts.map((part, i) => {
		const match = part.match(/@\[(.+?)\]\((.+?)\)/);

		if (match) {
			const [, name, ,] = match;

			return (
				<span
					key={i}
					// onClick={() => {
					// 	console.log("user id:", id);
					// }}
					style={{
						color: "#F59219", // sky-500
						fontWeight: 500,
						cursor: "pointer",
					}}
				>
					@{name}
				</span>
			);
		}

		return <span key={i}>{part}</span>;
	});
}
