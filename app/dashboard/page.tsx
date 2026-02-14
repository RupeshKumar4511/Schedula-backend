import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import syncCurrentUser from "../lib/sync-user";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const authUser = await currentUser();

  if (!authUser) {
    redirect("/sign-in");
  }

  try {
    await syncCurrentUser();
  } catch (error) {
    console.error("DETAILED SYNC ERROR:", error);
    
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <h1>Welcome to Schedula</h1>
      <p>Hello, {authUser.firstName}!</p>
      <UserButton />
    </div>
  );
}
