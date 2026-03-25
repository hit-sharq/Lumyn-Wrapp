import { SignUp } from "@clerk/clerk-react";
import { Layout } from "@/components/layout";
import { Card, CardContent } from "@/components/ui/card";
import { Layers } from "lucide-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const hasValidClerkKey = !!(clerkPubKey && clerkPubKey.startsWith("pk_"));

function NotConfigured() {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="pt-8 pb-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
          <Layers className="w-7 h-7 text-accent" />
        </div>
        <h2 className="text-xl font-bold">Authentication Not Configured</h2>
        <p className="text-muted-foreground text-sm">
          Clerk authentication is not yet set up. Add your{" "}
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs">VITE_CLERK_PUBLISHABLE_KEY</code>{" "}
          environment variable to enable sign-up.
        </p>
      </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Layout>
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] py-12">
        <div className="relative">
          <div className="absolute -inset-10 bg-accent/20 blur-[60px] rounded-full" />
          <div className="relative z-10">
            {hasValidClerkKey ? (
              <SignUp
                path="/sign-up"
                routing="path"
                signInUrl="/sign-in"
                fallbackRedirectUrl="/dashboard"
                appearance={{
                  elements: {
                    rootBox: "mx-auto",
                    card: "bg-card border border-border shadow-2xl rounded-2xl",
                    headerTitle: "text-foreground",
                    headerSubtitle: "text-muted-foreground",
                    socialButtonsBlockButton: "border-border hover:bg-muted text-foreground",
                    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                    formFieldLabel: "text-foreground",
                    formFieldInput: "bg-background border-border text-foreground focus:ring-primary",
                    footerActionText: "text-muted-foreground",
                    footerActionLink: "text-primary hover:text-primary/80",
                  },
                }}
              />
            ) : (
              <NotConfigured />
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
