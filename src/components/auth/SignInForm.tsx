// src/components/auth/SignInForm.tsx
"use client";

import { signIn, ClientSafeProvider } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SignInFormProps {
  providers: Record<string, ClientSafeProvider> | null;
}

export default function SignInForm({ providers }: SignInFormProps) {
  if (!providers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-80">
          <CardContent className="text-center">
            <p>No authentication providers available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-80">
        <CardContent className="space-y-4">
          <h1 className="text-xl font-semibold text-center">Sign In</h1>
          {Object.values(providers).map((provider) => (
            <Button
              key={provider.id}
              onClick={() => signIn(provider.id, { callbackUrl: "/" })}
              className="w-full"
            >
              Continue with {provider.name}
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
