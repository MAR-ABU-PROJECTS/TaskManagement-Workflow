import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userKeys } from "./keys";
import { userService } from "./service";
import { User } from "./types";

export const useGetUsers = (options?: { disableSuccess?: boolean }) => {
	return useQuery<{ count: number; users: User[] }>({
		queryKey: userKeys.all,
		queryFn: () => userService.getUsers(),
		meta: {
			disableGlobalSuccess: options?.disableSuccess,
		},
	});
};

export const useGetUserById = (id: string) => {
	const qc = useQueryClient();
	return useQuery({
		queryKey: userKeys.details(id),
		queryFn: () => userService.getUserById(id),
		initialData: () => {
			const listData = qc.getQueryData<{ count: number; users: User[] }>(userKeys.all);

			const user = listData?.users.find((item) => item.id === id);

			if (!user) return undefined;

			return {
				data: user,
			};
		},
	});
};
