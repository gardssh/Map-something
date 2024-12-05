import NextAuth from 'next-auth';
import StravaProvider from 'next-auth/providers/strava';
import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
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
		jwt: async ({ token, user }: { token: any; user: any }) => {
			if (user) {
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		session: async ({ session, token }: { session: any; token: any }) => {
			session.accessToken = token.accessToken;
			session.refreshToken = token.refreshToken;
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export const GET = handler.GET;
export const POST = handler.POST;
