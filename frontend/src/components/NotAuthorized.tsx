const NotAuthorized = () => {
	return (
		<div className="flex items-center justify-center pt-14">
			<div className="text-center">
				<h1 className="mb-3 text-2xl font-[500]">Not Authorized</h1>
				<p className="text-gray-500">
					you&apos;re not allowed to view this page contact admin.
				</p>
			</div>
		</div>
	);
};
export default NotAuthorized;
