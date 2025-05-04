import Chat from "./components/Chat";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const session = await auth();

  return (
    <main>
      <h1 className="text-4xl font-bold">Welcome to OpenRouter Chat</h1>
      {!session?.user?.email && <div>You need to log in to use this chat.</div>}
      {session?.user?.email && (
        <>
          <Separator className="my-5" />
          <Chat userEmail={session.user.email} />
        </>
      )}
    </main>
  );
}
