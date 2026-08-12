"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import env from "@/config/env";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GoogleOAuthProvider clientId={env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string}>
            {children}
        </GoogleOAuthProvider>
    );
}