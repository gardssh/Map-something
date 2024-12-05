import NextAuth, { DefaultSession, User as DefaultUser } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import StravaProvider from 'next-auth/providers/strava';

// Extend the built-in types
declare module 'next-auth' {
	interface Session extends DefaultSession {
			accessToken?: string;
			refreshToken?: string;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		accessToken?: string;
		refreshToken?: string;
	}
}

interface StravaProfile {
	id: string;
	firstname: string;
	lastname: string;
	profile: string;
}

const authOptions = {
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
			profile(profile: StravaProfile, tokens: { access_token?: string; refresh_token?: string }) {
				if (!tokens.access_token || !tokens.refresh_token) {
					throw new Error('Missing access token or refresh token');
				}
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
		jwt: async ({ token, user }: { token: JWT; user: any }) => {
			if (user) {
				token.accessToken = user.accessToken;
				token.refreshToken = user.refreshToken;
			}
			return token;
		},
		session: async ({ session, token }: { session: any; token: JWT }) => {
			session.accessToken = token.accessToken;
			session.refreshToken = token.refreshToken;
			return session;
		},
	},
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
