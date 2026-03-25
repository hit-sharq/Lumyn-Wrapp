import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider } from "@clerk/clerk-react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthSync } from "@/components/auth-sync";

import LandingPage from "@/pages/landing";
import SignInPage from "@/pages/sign-in";
import SignUpPage from "@/pages/sign-up";
import DashboardPage from "@/pages/dashboard";
import ConvertPage from "@/pages/convert";
import ConversionDetailPage from "@/pages/conversion-detail";
import PricingPage from "@/pages/pricing";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
const hasValidClerkKey = !!(clerkPubKey && clerkPubKey.startsWith("pk_"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/sign-in/*" component={SignInPage} />
      <Route path="/sign-up/*" component={SignUpPage} />
      <Route path="/pricing" component={PricingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/convert" component={ConvertPage} />
      <Route path="/conversions/:id" component={ConversionDetailPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppCore() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthSync />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

function App() {
  if (hasValidClerkKey) {
    return (
      <ClerkProvider publishableKey={clerkPubKey!}>
        <AppCore />
      </ClerkProvider>
    );
  }
  return <AppCore />;
}

export default App;
