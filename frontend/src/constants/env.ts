const env = {
	BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
	environment: process.env.NODE_ENV,
	sessionSecretKey: process.env.SECRET_KEY,
};

export default env;
