import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { db } from '../../../../../lib/db';
import { users } from '../../../../../db/schema';
import { eq } from 'drizzle-orm';
import { signToken } from '../../../../../lib/auth';
import type { User } from '../../../../../db/schema';

type GoogleTokenResponse = {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
};

type GoogleProfile = {
    sub: string;
    email: string;
    name?: string;
    given_name?: string;
    picture?: string;
};

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
        return new NextResponse(JSON.stringify({ error }), { status: 400 });
    }
    if (!code) {
        return new NextResponse(JSON.stringify({ error: 'Missing code' }), { status: 400 });
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID || '',
            client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
            redirect_uri: process.env.GOOGLE_REDIRECT_URI || '',
            grant_type: 'authorization_code',
        }),
    });

    if (!tokenRes.ok) {
        const text = await tokenRes.text();
        return new NextResponse(JSON.stringify({ error: 'Token exchange failed', details: text }), { status: 500 });
    }

    const tokenJson = (await tokenRes.json()) as GoogleTokenResponse;
    const accessToken = tokenJson.access_token;

    if (!accessToken) {
        return new NextResponse(JSON.stringify({ error: 'No access token received' }), { status: 500 });
    }

    const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userRes.ok) {
        const text = await userRes.text();
        return new NextResponse(JSON.stringify({ error: 'Failed fetching userinfo', details: text }), { status: 500 });
    }

    const profile = (await userRes.json()) as GoogleProfile;
    const email = profile.email;
    const name = profile.name || profile.given_name || '';
    const image = profile.picture || null;
    const providerId = profile.sub;

    if (!email || !providerId) {
        return new NextResponse(JSON.stringify({ error: 'Incomplete profile from provider' }), { status: 500 });
    }

    // Find or create user
    const found = await db.select().from(users).where(eq(users.email, email));
    let userRecord: User;
    if (found.length > 0) {
        userRecord = found[0] as User;
    } else {
        const insertResult = await db.insert(users).values({
            email,
            name,
            image,
            provider: 'google',
            provider_id: providerId,
        }).returning();
        userRecord = insertResult[0] as User;
    }

    const token = signToken({ sub: String(userRecord.id), email: userRecord.email });

    // Redirect back to client application with token in query (or you can set cookie)
    const frontend = process.env.OAUTH_SUCCESS_REDIRECT || '/';
    const redirectUrl = new URL(frontend, process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('token', token);

    return NextResponse.redirect(redirectUrl.toString());
}
