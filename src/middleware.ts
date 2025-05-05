import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/chats/:chatId*"],
};

export default auth((req) => {
  if (!req.auth) {
    return NextResponse.redirect(
      new URL(
        `/api/auth/signin?callbackUrl=${encodeURIComponent(req.nextUrl.pathname)}`,
        req.url,
      ),
    );
  }
});
