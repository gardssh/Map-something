import { DefaultSession, DefaultUser, User } from "next-auth"
import { JWT } from "next-auth/jwt"
import StravaProvider from 'next-auth/providers/strava';

// Extend NextAuth types
declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            stravaAthleteId?: number;
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        id: string;
        stravaAthleteId?: number;
        accessToken: string;
        refreshToken: string;
        // ... other user properties
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
        stravaAthleteId?: number;
    }
}

export const authOptions = {
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
            profile(profile: any, tokens: any) {
                return {
                    id: profile.id.toString(),
                    name: `${profile.firstname} ${profile.lastname}`,
                    image: profile.profile,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token,
                    stravaAthleteId: profile.id,
                    email: null,
                };
            },
        }),
    ],
    callbacks: {
        jwt: async ({ token, user }: { token: JWT; user: User | undefined }) => {
            if (user) {
                token.id = user.id;
                token.accessToken = user.accessToken;
                token.refreshToken = user.refreshToken;
                token.stravaAthleteId = user.stravaAthleteId;
            }
            return token;
        },
        session: async ({ session, token }: { session: any; token: JWT }) => {
            if (token) {
                session.user.id = token.id;
                session.accessToken = token.accessToken;
                session.refreshToken = token.refreshToken;
                session.user.stravaAthleteId = token.stravaAthleteId;
            }
            return session;
        },
    },
}; 