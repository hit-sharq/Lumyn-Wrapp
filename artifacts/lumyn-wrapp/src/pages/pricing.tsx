import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { usePlans, useCreateCheckout } from "@/hooks/use-subscriptions";
import { useSafeAuth } from "@/hooks/use-safe-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const { data: plans, isLoading } = usePlans();
  const { mutate: checkout, isPending: isCheckingOut } = useCreateCheckout();
  const { isSignedIn } = useSafeAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubscribe = (planId: string) => {
    if (!isSignedIn) {
      setLocation("/sign-up");
      return;
    }
    
    checkout(planId, {
      onSuccess: (data) => {
        // Redirect to PesaPal checkout
        window.location.href = data.redirectUrl;
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Checkout Error",
          description: err.message || "Failed to initiate checkout",
        });
      }
    });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 md:py-32 relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[400px] bg-primary/10 blur-[120px] rounded-[100%] pointer-events-none" />
        
        <div className="text-center mb-20 relative z-10">
          <h1 className="text-4xl md:text-6xl font-extrabold font-display tracking-tight mb-6">
            Simple, transparent <span className="text-primary">pricing</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees, cancel anytime.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10 items-center">
            {plans?.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`glass-panel rounded-3xl p-8 flex flex-col relative ${
                  plan.popular ? 'border-primary shadow-glow-lg scale-100 md:scale-105 bg-card/80 z-20' : 'border-border/50'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-extrabold">${plan.priceUsd}</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                
                <div className="mb-8 p-4 bg-background/50 rounded-xl border border-border/50">
                  <div className="font-semibold text-primary mb-1">
                    {plan.conversionsPerMonth === -1 ? "Unlimited" : plan.conversionsPerMonth} Conversions
                  </div>
                  <div className="text-sm text-muted-foreground">per month</div>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 font-bold" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button 
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCheckingOut}
                  size="lg" 
                  className={`w-full rounded-xl h-14 text-base ${
                    plan.popular ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : 'bg-secondary hover:bg-secondary/80 text-foreground'
                  }`}
                >
                  {isCheckingOut ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Subscribe Now'}
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
