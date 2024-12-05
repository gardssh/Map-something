import NextAuth from 'next-auth';
import StravaProvider from 'next-auth/providers/strava';
import { JWT } from 'next-auth/jwt';
import { Session } from 'next-auth';

// Extend NextAuth types
declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
    }
    interface User {
        accessToken: string;
        refreshToken: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string;
        refreshToken?: string;
    }
}

const handler = NextAuth({
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
});

export { handler as GET, handler as POST };
