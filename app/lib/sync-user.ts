import { currentUser } from '@clerk/nextjs/server'
import prisma from './prisma';

export default async function syncCurrentUser() {
    try {
        const clerkUser = await currentUser();
        if (!clerkUser) {
            return null;
        }

        const email = clerkUser.emailAddresses[0]?.emailAddress;

        if (!email) {
            throw new Error("User email not found");
        }

        const fullname = clerkUser.firstName
            ? `${clerkUser.firstName} ${clerkUser.lastName ?? ""}`.trim()
            : (clerkUser.username || "Anonymous");

        const dbUser = await prisma.user.findUnique({
            where: { clerkUserId: clerkUser.id }
        });

        // If user exists in the database
        if (dbUser) {
            // email or username changes
            if (dbUser.email !== email || dbUser.username !== fullname) {
                return await prisma.user.update({
                    where: { clerkUserId: clerkUser.id },
                    data: { email, username: fullname }
                });
            }
            // If no changes, return the existing user 
            return dbUser;
        }

        // If user does not exist in database
        const userCount = await prisma.user.count();

        return await prisma.user.create({
            data: {
                clerkUserId: clerkUser.id,
                username: fullname,
                email,
                role: userCount === 0 ? 'admin' : 'patient'
            }
        });

    } catch (error) {
        console.error("Sync Error:", error);
        throw new Error("Failed to Sync User");
    }
}
