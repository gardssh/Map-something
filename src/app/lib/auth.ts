import { NextAuthOptions } from 'next-auth';
import StravaProvider from 'next-auth/providers/strava';

// Extend NextAuth types
declare module 'next-auth' {
    interface Session {
        accessToken?: string;
        refreshToken?: string;
        user: {
            id: string;
            stravaAthleteId?: number;
        } & DefaultSession['user'];
    }
    interface User {
        id: string;
        accessToken: string;
        refreshToken: string;
        stravaAthleteId?: number;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        accessToken?: string;
        refreshToken?: string;
        stravaAthleteId?: number;
    }
}

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        StravaProvider({
            clientId: process.env.NEXT_PUBLIC_STRAVA_ID || '',
            clientSecret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET || '',
            authorization: {
                url: 'https://www.strava.com/api/v3/oauth/authorize',
                params: {
                    scope: 'read,activity:read_all,profile:read_all',
                    approval_prompt: 'auto',
                    response_type: 'code',
                },
            },
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            // Initial sign in
            if (account && profile) {
                return {
                    ...token,
                    accessToken: account.access_token,
                    refreshToken: account.refresh_token,
                    stravaAthleteId: profile.id,
                    accessTokenExpires: account.expires_at,
                };
            }

            // Return previous token if the access token has not expired yet
            if (Date.now() < (token.accessTokenExpires as number) * 1000) {
                return token;
            }

            // Access token has expired, try to update it
            try {
                const response = await fetch('https://www.strava.com/oauth/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        client_id: process.env.NEXT_PUBLIC_STRAVA_ID,
                        client_secret: process.env.NEXT_PUBLIC_STRAVA_CLIENT_SECRET,
                        grant_type: 'refresh_token',
                        refresh_token: token.refreshToken,
                    }),
                });

                const refreshedTokens = await response.json();

                if (!response.ok) {
                    throw refreshedTokens;
                }

                return {
                    ...token,
                    accessToken: refreshedTokens.access_token,
                    refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
                    accessTokenExpires: refreshedTokens.expires_at,
                };
            } catch (error) {
                console.error('Error refreshing access token', error);
                return { ...token, error: 'RefreshAccessTokenError' };
            }
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.refreshToken = token.refreshToken;
            session.error = token.error;
            if (session.user) {
                session.user.id = token.sub || '';
                session.user.stravaAthleteId = token.stravaAthleteId;
            }
            return session;
        },
    },
    pages: {
        signIn: '/',
        signOut: '/',
        error: '/',
    },
}; 