import sgMail from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';
import { db } from './db';
import { otps } from '../db/schema';
import { desc, eq } from 'drizzle-orm';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
if (!SENDGRID_KEY || !FROM_EMAIL) {
    // don't throw so that tests or non-email flows can still run; functions will check
}

sgMail.setApiKey(SENDGRID_KEY || '');

function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOtp(email: string) {
    if (!SENDGRID_KEY || !FROM_EMAIL) {
        throw new Error('SendGrid not configured (SENDGRID_API_KEY & SENDGRID_FROM_EMAIL required)');
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await db.insert(otps).values({ email, code, expires_at: expiresAt });

    const msg: MailDataRequired = {
        to: email,
        from: FROM_EMAIL,
        subject: 'Your verification code',
        text: `Your verification code is ${code}. It will expire in 10 minutes.`,
        html: `<p>Your verification code is <strong>${code}</strong>. It will expire in 10 minutes.</p>`,
    };

    await sgMail.send(msg);
    return { ok: true };
}

export async function verifyOtp(email: string, code: string) {
    const rows = await db.select().from(otps).where(eq(otps.email, email)).orderBy(desc(otps.id)).limit(1);
    if (!rows || rows.length === 0) return false;
    const row = rows[0];
    if (row.used) return false;
    if (row.code !== code) return false;
    if (new Date(row.expires_at) < new Date()) return false;

    await db.update(otps).set({ used: true }).where(eq(otps.id, row.id));
    return true;
}
