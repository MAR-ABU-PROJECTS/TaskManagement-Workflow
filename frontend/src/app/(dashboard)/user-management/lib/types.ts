import { Role } from "@/lib/rolespermissions";

export type User = {
	id: string;
	name: string;
	role: Role;
};
