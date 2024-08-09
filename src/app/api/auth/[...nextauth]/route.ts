import NextAuth from 'next-auth';
import StravaProvider from 'next-auth/providers/strava';

export const authOptions = {
	providers: [
		StravaProvider({
			clientId: process.env.NEXT_PUBLIC_STRAVA_ID,
			clientSecret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
			token: {
				url: 'https://www.strava.com/oauth/token',
			},
		}),
	],
	callbacks: {
		jwt: async ({ session, token, user }) => {
			console.log(user);
			console.log(token);
			return token;
		},
		session: async ({ session, token, user }) => {
			return session;
		},
	},
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
