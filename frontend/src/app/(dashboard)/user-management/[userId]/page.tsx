import React from "react";
import UserDetails from "./component/UserDetails";

type Props = {
	params: {
		userId: string;
	};
};
const page = ({ params }: Props) => {
  const userId = params.userId
	return <UserDetails userId={userId} />;
};

export default page;
