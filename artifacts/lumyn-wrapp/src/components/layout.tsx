import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Layers, Sparkles } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const hasValidClerkKey = !!(clerkPubKey && clerkPubKey.startsWith("pk_"));

function ClerkNavItems() {
  const [location] = useLocation();
  return (
    <>
      <SignedIn>
        <Link
          href="/dashboard"
          className={`text-sm font-medium transition-colors hover:text-primary ${location.startsWith("/dashboard") ? "text-primary" : "text-muted-foreground"}`}
        >
          Dashboard
        </Link>
        <Link href="/convert">
          <Button className="hidden md:flex gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:border-primary/50 transition-all rounded-full">
            <Sparkles className="w-4 h-4" /> Convert App
          </Button>
        </Link>
        <div className="ml-4 pl-4 border-l border-border/50">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-9 h-9 border-2 border-primary/20 hover:border-primary/60 transition-colors",
              },
            }}
          />
        </div>
      </SignedIn>
      <SignedOut>
        <Link href="/sign-in">
          <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
            Log in
          </Button>
        </Link>
        <Link href="/sign-up">
          <Button className="rounded-full hover:scale-105 transition-all bg-primary text-primary-foreground">
            Get Started
          </Button>
        </Link>
      </SignedOut>
    </>
  );
}

function PublicNavItems() {
  return (
    <>
      <Link href="/sign-in">
        <Button variant="ghost" className="hidden sm:flex text-muted-foreground hover:text-foreground">
          Log in
        </Button>
      </Link>
      <Link href="/sign-up">
        <Button className="rounded-full hover:scale-105 transition-all bg-primary text-primary-foreground">
          Get Started
        </Button>
      </Link>
    </>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden text-foreground">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent p-0.5">
              <div className="w-full h-full bg-background rounded-[10px] flex items-center justify-center group-hover:bg-background/80 transition-colors">
                <Layers className="w-5 h-5 text-primary" />
              </div>
            </div>
            <span className="font-bold text-xl tracking-tight hidden sm:block">Lumyn Wrapp</span>
          </Link>

          <nav className="flex items-center gap-2 md:gap-4">
            <Link href="/pricing" className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground">
              Pricing
            </Link>
            {hasValidClerkKey ? <ClerkNavItems /> : <PublicNavItems />}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full relative z-10">{children}</main>

      <footer className="border-t border-border/40 bg-background/40 py-8 md:py-12 mt-20">
        <div className="container mx-auto px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Layers className="w-5 h-5" />
            <span className="font-semibold">Lumyn Technologies</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Lumyn Wrapp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
