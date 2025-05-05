import Chat from "./components/chat/Chat";
import { auth } from "@/auth";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const session = await auth();

  return (
    <>
      <h1 className="text-4xl font-bold mb-5">Welcome to OpenRouter Chat</h1>
      {!session?.user?.email && (
        <>
          <Separator className="mb-5" />
          <div>You need to log in to use this chat.</div>
        </>
      )}
      {session?.user?.email && <Chat userEmail={session.user.email} />}
    </>
  );
}
