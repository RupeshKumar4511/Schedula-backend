import { NextResponse } from 'next/server';
import { db } from '../../../../../lib/db';
import { users } from '../../../../../db/schema';
import { verifyPassword } from '../../../../../lib/password';
import { signToken } from '../../../../../lib/auth';
import { eq } from 'drizzle-orm';
import type { User } from '../../../../../db/schema';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password } = body;
        if (!email || !password) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const found = await db.select().from(users).where(eq(users.email, email));
        if (found.length === 0) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const userRecord = found[0] as User;

        if (userRecord.provider !== 'credentials') {
            return NextResponse.json({ error: `Use ${userRecord.provider} to sign in` }, { status: 400 });
        }

        const ok = await verifyPassword(String(password), userRecord.password);
        if (!ok) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const token = signToken({ sub: String(userRecord.id), email: userRecord.email });

        return NextResponse.json({ token, user: { id: userRecord.id, email: userRecord.email, name: userRecord.name, image: userRecord.image } });
    } catch (err: unknown) {
        const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : String(err);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
