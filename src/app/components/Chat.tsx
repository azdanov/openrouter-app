"use client";

import { getCompletion, Message } from "@/app/server-actions/getCompletion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");

  const onClick = async () => {
    const completions = await getCompletion([
      ...messages,
      {
        role: "user",
        content: message,
      },
    ]);
    setMessage("");
    setMessages(completions.messages);
  };

  return (
    <div className="flex flex-col">
      {messages.map((message, i) => (
        <div
          key={i}
          className={cn("mb-5 flex flex-col", {
            "items-end": message.role === "user",
            "items-start": message.role === "assistant",
          })}
        >
          <div
            className={cn("rounded-lg py-2 px-4", {
              "bg-indigo-600 text-white": message.role === "user",
              "bg-neutral-200 text-neutral-900": message.role === "assistant",
            })}
          >
            {message.content}
          </div>
        </div>
      ))}
      <Separator className="my-5" />
      <div className="flex">
        <Input
          className="flex-grow text-xl"
          placeholder="Question"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyUp={(e) => {
            if (e.key === "Enter") {
              onClick();
            }
          }}
        />
        <Button onClick={onClick} className="ml-3 text-lg">
          Send
        </Button>
      </div>
    </div>
  );
}
