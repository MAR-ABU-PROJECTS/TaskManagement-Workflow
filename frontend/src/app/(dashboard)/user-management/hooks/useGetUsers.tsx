import { useQuery } from "@tanstack/react-query";
import { userService } from "../lib/service";
import { userKeys } from "../lib/keys";

export const useGetUsers = () => {
	return useQuery({
		queryKey: userKeys.all,
		queryFn: () => userService.getUsers(),
	});
};
