import Chat from "@/app/components/chat/Chat";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/");
  }

  const chatId = parseInt((await params).chatId, 10);

  return (
    <>
      <h1 className="text-4xl font-bold mb-5">OpenRouter Chat</h1>
      <Chat userEmail={session.user.email} initialChatId={chatId} />
    </>
  );
}
