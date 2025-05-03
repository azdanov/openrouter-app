"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Session } from "next-auth";
import { useTransition } from "react";

export default function AuthButton({
  session,
  loginAction,
  logoutAction,
}: {
  session: Session | null;
  loginAction: () => Promise<void>;
  logoutAction: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <>
      {!session ? (
        <Button
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(loginAction)}
        >
          Sign in
        </Button>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar>
              {session?.user?.image ? (
                <AvatarImage src={session.user.image} />
              ) : (
                <AvatarFallback>
                  {getAcronym(session?.user?.name)}
                </AvatarFallback>
              )}
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              disabled={isPending}
              onClick={() => startTransition(logoutAction)}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

function getAcronym(str?: string | null): string {
  if (!str) return "OC";
  const match = str.match(/\b[A-Z]/g);
  return match && match.length > 0 ? match.slice(0, 2).join("") : "OC";
}
