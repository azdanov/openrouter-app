import NextAuth, { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

const config: NextAuthConfig = {
  callbacks: {
    async signIn({ profile }) {
      return profile?.login === "azdanov";
    },
  },
  providers: [GitHub],
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
