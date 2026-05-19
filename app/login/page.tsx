import { sendMagicLink } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { sent, error } = await searchParams;

  return (
    <main className="flex min-h-dvh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Plate</CardTitle>
          <CardDescription>
            {sent
              ? "Check your email for a sign-in link."
              : "Sign in to the Carr household meal plan."}
          </CardDescription>
        </CardHeader>
        {!sent && (
          <CardContent>
            <form action={sendMagicLink} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error === "invalid-email"
                    ? "Enter a valid email address."
                    : "Could not send the link. Try again."}
                </p>
              )}
              <Button type="submit" className="w-full">
                Send magic link
              </Button>
            </form>
          </CardContent>
        )}
      </Card>
    </main>
  );
}
