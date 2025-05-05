import { Separator } from "@/components/ui/separator";

export default function About() {
  return (
    <main>
      <h1 className="text-4xl font-bold">About OpenRouter Chat</h1>
      <Separator className="my-5" />
      <p className="mt-4">
        OpenRouter Chat is a chat application that allows you to interact with
        various AI models. It is built using Next.js and TypeScript, and it
        leverages the OpenRouter API to provide a seamless chat experience.
      </p>
    </main>
  );
}
