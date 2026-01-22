import { useEffect, useState } from "react";
import { differenceInSeconds } from "date-fns";

export function useDeadlineCountdown(dueDate?: Date | string) {
	const [timeLeft, setTimeLeft] = useState("");

	useEffect(() => {
		if (!dueDate) return;

		const date = new Date(dueDate);

		// Deadline = end of due date (11:59:59 PM local time)
		const deadline = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
			23,
			59,
			59
		);

		const update = () => {
			const seconds = differenceInSeconds(deadline, new Date());

			if (seconds <= 0) {
				setTimeLeft("Overdue");
				return;
			}

			const days = Math.floor(seconds / 86400);
			const hours = Math.floor((seconds % 86400) / 3600);
			const minutes = Math.floor((seconds % 3600) / 60);

			// Simple countdown string
			setTimeLeft(
				`${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m`
			);
		};

		update();
		const interval = setInterval(update, 60_000); // every minute

		return () => clearInterval(interval);
	}, [dueDate]);

	return timeLeft;
}


// import { useEffect, useState } from "react";
// import { differenceInSeconds } from "date-fns";

// export function useDeadlineCountdown(dueDate?: Date | string) {
// 	const [timeLeft, setTimeLeft] = useState("");

// 	useEffect(() => {
// 		if (!dueDate) return;

// 		const date = new Date(dueDate);

// 		// Deadline = end of due date (11:59:59 PM local time)
// 		const deadline = new Date(
// 			date.getFullYear(),
// 			date.getMonth(),
// 			date.getDate(),
// 			23,
// 			59,
// 			59
// 		);

// 		const update = () => {
// 			const seconds = differenceInSeconds(deadline, new Date());

// 			if (seconds <= 0) {
// 				setTimeLeft("Overdue");
// 				return;
// 			}

// 			const days = Math.floor(seconds / 86400);
// 			const hours = Math.floor((seconds % 86400) / 3600);
// 			const minutes = Math.floor((seconds % 3600) / 60);
// 			const secs = seconds % 60;

// 			setTimeLeft(
// 				`${days > 0 ? `${days}d ` : ""}${hours}h ${minutes}m ${secs}s`
// 			);
// 		};

// 		update();
// 		const interval = setInterval(update, 1000); // update every second

// 		return () => clearInterval(interval);
// 	}, [dueDate]);

// 	return timeLeft;
// }
