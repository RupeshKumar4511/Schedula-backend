import jwt from 'jsonwebtoken';

const JWT_SECRET: string = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || '';
if (!JWT_SECRET) {
    throw new Error('JWT_SECRET (or NEXTAUTH_SECRET) must be set in environment');
}

export function signToken(payload: Record<string, unknown>) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): unknown {
    return jwt.verify(token, JWT_SECRET);
}
