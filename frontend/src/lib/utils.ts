import { clsx, type ClassValue } from "clsx";
import { differenceInHours, format, formatDistanceToNowStrict } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatFileSize(bytes: number) {
	if (bytes === 0) return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

// utils/downloadFile.ts
export const downloadFile = (blob: Blob, filename: string) => {
	const url = window.URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;

	document.body.appendChild(link);
	link.click();

	link.remove();
	window.URL.revokeObjectURL(url);
};

export const getInitials = (name: string) => {
	const initials = name.split(" ");
	const first = initials?.[0]?.[0];
	const last = initials?.[1]?.[0];

	return { first, last };
};

export const formatTimeStamp = (date: string) => {
	const createdAt = new Date(date);
	const hoursDiff = differenceInHours(new Date(), createdAt);

	if (hoursDiff < 24) {
		return formatDistanceToNowStrict(createdAt, {
			addSuffix: true,
		});
	}

	return format(createdAt, "MMM d, yyyy · h:mm a");
};

export const toDateInputValue = (iso?: string) => (iso ? iso.split("T")[0] : "");
