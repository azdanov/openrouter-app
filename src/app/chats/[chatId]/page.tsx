import Chat from "@/app/components/chat/Chat";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ChatPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-5 text-4xl font-bold">OpenRouter Chat</h1>
      <Chat />
    </div>
  );
}
