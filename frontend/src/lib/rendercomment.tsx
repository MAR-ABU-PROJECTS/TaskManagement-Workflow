export function renderComment(text: string) {
	const regex =
		/(@\[[^\]]+\]\([^)]+\))|(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-z0-9.-]+\.[a-z]{2,}(\/[^\s]*)?)/gi;

	const elements: React.ReactNode[] = [];
	let lastIndex = 0;
	let match;

	while ((match = regex.exec(text)) !== null) {
		// Text before match
		if (match.index > lastIndex) {
			elements.push(
				<span key={lastIndex}>
					{text.slice(lastIndex, match.index)}
				</span>,
			);
		}

		const [fullMatch] = match;

		// Mention
		const mentionMatch = fullMatch.match(/@\[(.+?)\]\((.+?)\)/);
		if (mentionMatch) {
			const [, name] = mentionMatch;
			elements.push(
				<span
					key={match.index}
					style={{
						color: "#F59219",
						fontWeight: 500,
						cursor: "pointer",
					}}
				>
					@{name}
				</span>,
			);
		}
		// URL starting with http/https
		else if (/^https?:\/\//.test(fullMatch)) {
			elements.push(
				<a
					key={match.index}
					href={fullMatch}
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "#3b82f6", textDecoration: "underline" }}
				>
					{fullMatch}
				</a>,
			);
		}
		// URL starting with www.
		else if (/^www\./.test(fullMatch)) {
			const href = "https://" + fullMatch;
			elements.push(
				<a
					key={match.index}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "#3b82f6", textDecoration: "underline" }}
				>
					{fullMatch}
				</a>,
			);
		}
		// Bare domain like example.com
		else {
			const href = fullMatch.startsWith("http")
				? fullMatch
				: "https://" + fullMatch;
			elements.push(
				<a
					key={match.index}
					href={href}
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "#3b82f6", textDecoration: "underline" }}
				>
					{fullMatch}
				</a>,
			);
		}

		lastIndex = regex.lastIndex;
	}

	// Text after last match
	if (lastIndex < text.length) {
		elements.push(<span key={lastIndex}>{text.slice(lastIndex)}</span>);
	}

	return elements;
}
