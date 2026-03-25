import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { useCreateConversion } from "@/hooks/use-conversions";
import { useMySubscription } from "@/hooks/use-subscriptions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  webUrl: z.string().url({ message: "Please enter a valid URL (e.g. https://myapp.com)" }),
  appName: z.string().min(2, { message: "App name must be at least 2 characters" }),
  packageName: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+[0-9a-z_]$/i, { 
    message: "Valid package name required (e.g., com.company.app)" 
  }),
  versionName: z.string().min(1, "Version is required").default("1.0.0"),
  enableOffline: z.boolean().default(true),
  enablePushNotifications: z.boolean().default(false),
  splashScreenColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Valid hex color required").default("#0A0A0A"),
  themeColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Valid hex color required").default("#06b6d4"),
});

type FormValues = z.infer<typeof formSchema>;

export default function ConvertPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: subData, isLoading: isLoadingSub } = useMySubscription();
  const createMutation = useCreateConversion();

  const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      versionName: "1.0.0",
      enableOffline: true,
      enablePushNotifications: false,
      splashScreenColor: "#0A0A0A",
      themeColor: "#06b6d4"
    }
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await createMutation.mutateAsync(data);
      toast({
        title: "Conversion Started",
        description: "Your app is being packaged. This usually takes a few minutes.",
      });
      setLocation(`/conversions/${result.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Conversion Failed",
        description: error.message || "An error occurred starting the conversion.",
      });
    }
  };

  const hasAccess = subData?.subscription?.status === 'active' && 
                    (subData.conversionsRemaining > 0 || subData.conversionsRemaining === -1);

  if (!isLoadingSub && !hasAccess) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 max-w-2xl text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-3xl font-bold mb-4">Subscription Required</h1>
          <p className="text-muted-foreground mb-8 text-lg">
            You need an active subscription with available conversions to create an app.
          </p>
          <Button onClick={() => setLocation('/pricing')} size="lg" className="rounded-full px-8">
            View Pricing Plans
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-3xl">
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/dashboard')}
          className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight text-foreground">
            Configure Your App
          </h1>
          <p className="text-muted-foreground mt-2">
            Set up the details for your Android APK wrapper.
          </p>
        </div>

        <Card className="glass-panel overflow-hidden border-t-4 border-t-primary">
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2">Core Details</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="webUrl">Web App URL *</Label>
                  <Input 
                    id="webUrl" 
                    placeholder="https://your-amazing-app.com" 
                    {...register("webUrl")}
                    className={`bg-background/50 h-12 ${errors.webUrl ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  {errors.webUrl && <p className="text-red-500 text-sm">{errors.webUrl.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="appName">App Name *</Label>
                    <Input 
                      id="appName" 
                      placeholder="My App" 
                      {...register("appName")}
                      className={`bg-background/50 h-12 ${errors.appName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                    />
                    {errors.appName && <p className="text-red-500 text-sm">{errors.appName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="versionName">Version</Label>
                    <Input 
                      id="versionName" 
                      placeholder="1.0.0" 
                      {...register("versionName")}
                      className="bg-background/50 h-12"
                    />
                    {errors.versionName && <p className="text-red-500 text-sm">{errors.versionName.message}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="packageName">Package Name *</Label>
                  <Input 
                    id="packageName" 
                    placeholder="com.yourcompany.app" 
                    {...register("packageName")}
                    className={`bg-background/50 h-12 font-mono text-sm ${errors.packageName ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">Unique identifier for the Play Store.</p>
                  {errors.packageName && <p className="text-red-500 text-sm">{errors.packageName.message}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium border-b border-border pb-2 mt-4">Features & Branding</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/30">
                    <div>
                      <Label htmlFor="enableOffline" className="text-base cursor-pointer">Offline Mode</Label>
                      <p className="text-xs text-muted-foreground mt-1">Cache static assets</p>
                    </div>
                    <Switch 
                      id="enableOffline" 
                      checked={watch("enableOffline")}
                      onCheckedChange={(c) => setValue("enableOffline", c)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background/30">
                    <div>
                      <Label htmlFor="enablePush" className="text-base cursor-pointer">Push Notifications</Label>
                      <p className="text-xs text-muted-foreground mt-1">OneSignal integration</p>
                    </div>
                    <Switch 
                      id="enablePush" 
                      checked={watch("enablePushNotifications")}
                      onCheckedChange={(c) => setValue("enablePushNotifications", c)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="splashColor">Splash Screen Color</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                        <input 
                          type="color" 
                          id="splashColor"
                          {...register("splashScreenColor")}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0"
                        />
                      </div>
                      <Input {...register("splashScreenColor")} className="bg-background/50 h-12 font-mono uppercase" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="themeColor">Theme Color (Status bar)</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border shrink-0">
                        <input 
                          type="color" 
                          id="themeColor"
                          {...register("themeColor")}
                          className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0"
                        />
                      </div>
                      <Input {...register("themeColor")} className="bg-background/50 h-12 font-mono uppercase" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={isSubmitting}
                  className="w-full h-14 text-base rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-glow text-primary-foreground"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-3" />
                      Initializing Build...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" /> Start Conversion Job
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  This will consume 1 conversion from your monthly quota.
                </p>
              </div>

            </CardContent>
          </form>
        </Card>
      </div>
    </Layout>
  );
}
