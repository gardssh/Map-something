import NextAuth from 'next-auth';
import StravaProvider from 'next-auth/providers/strava';

export const authOptions = {
	providers: [
		StravaProvider({
			clientId: process.env.NEXT_PUBLIC_STRAVA_ID || '',
			clientSecret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET || '',
			authorization: {
				url: 'https://www.strava.com/api/v3/oauth/authorize',
				params: {
					scope: 'activity:read_all',
					approval_prompt: 'auto',
					response_type: 'code',
				},
			},
			profile(profile: any, tokens: any) {
				return {
					id: profile.id,
					name: `${profile.firstname} ${profile.lastname}`,
					image: profile.profile,
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token,
					email: null,
				};
			},
		}),
	],
	callbacks: {
		jwt: async ({ token, user }) => {
			if (user) {
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		session: async ({ session, token }) => {
			session.accessToken = token.accessToken;
			session.refreshToken = token.refreshToken;
			return session;
		},
	},
};

export default NextAuth(authOptions);
