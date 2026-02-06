import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { users } from '../../../../../db/schema';
import { hashPassword } from '../../../../../lib/password';
import { signToken } from '../../../../../lib/auth';
import { eq } from 'drizzle-orm';
import { sendOtp, verifyOtp } from '../../../../../lib/otp';

import type { User } from '../../../../../db/schema';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, name, otp } = body;
        if (!email || !name) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        // Basic email validation
        const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRe.test(String(email))) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // If otp provided, verify and create account
        if (otp) {
            const ok = await verifyOtp(String(email), String(otp));
            if (!ok) {
                return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });
            }

            if (!password) {
                return NextResponse.json({ error: 'Password required to complete registration' }, { status: 400 });
            }

            // Check existing user
            const existing = await db.select().from(users).where(eq(users.email, email));
            if (existing.length > 0) {
                return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
            }

            const hashed = await hashPassword(String(password));
            const insertResult = await db.insert(users).values({
                email,
                name,
                image: null,
                password: hashed,
                provider: 'credentials',
                provider_id: email,
            }).returning();

            const userRecord = insertResult[0] as User;
            const token = signToken({ sub: String(userRecord.id), email: userRecord.email });
            return NextResponse.json({ token, user: { id: userRecord.id, email: userRecord.email, name: userRecord.name, image: userRecord.image } });
        }

        // No OTP yet: send one to the email
        await sendOtp(String(email));
        return NextResponse.json({ ok: true, message: 'OTP sent to email' });
    } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
