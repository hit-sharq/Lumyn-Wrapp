import { motion } from "framer-motion";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Smartphone, Zap, Shield, WifiOff, Bell, ArrowRight } from "lucide-react";
import { Layout } from "@/components/layout";

export default function LandingPage() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 md:pt-32 md:pb-48 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
            alt="Abstract Background" 
            className="w-full h-full object-cover opacity-30 mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background" />
        </div>
        
        <div className="container mx-auto relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge variant="outline" className="mb-6 border-primary/30 bg-primary/10 text-primary py-1.5 px-4 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5 mr-2" /> Launched 2.0 - Faster Builds
            </Badge>
          </motion.div>
          
          <motion.h1 
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Turn Your Web App Into a <br className="hidden md:block" />
            <span className="text-gradient">Native Android App</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Deploy your web application to millions of Android devices in minutes. No coding, no Android Studio, just instant conversion with Lumyn Wrapp.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto rounded-full h-14 px-8 text-base shadow-glow-lg hover:scale-105 transition-transform">
                Start Converting Now <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full h-14 px-8 text-base border-border/60 hover:bg-card">
                View Pricing
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-card/30 relative border-y border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Enterprise-grade wrappers</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">Everything you need to deliver a premium native experience.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard 
              icon={<Smartphone className="w-8 h-8 text-primary" />}
              title="Native Performance"
              description="High-performance WebView wrapper that feels indistinguishable from a native application."
              delay={0.1}
            />
            <FeatureCard 
              icon={<WifiOff className="w-8 h-8 text-accent" />}
              title="Offline Support"
              description="Built-in caching and offline mode support ensures your app works even without an internet connection."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Bell className="w-8 h-8 text-primary" />}
              title="Push Notifications"
              description="Keep users engaged with full support for native Android push notifications."
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Visual Section */}
      <section className="py-32 overflow-hidden">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              Ready for the <br/> <span className="text-primary">Play Store</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              We provide you with a production-ready signed APK that you can immediately upload to the Google Play Store or distribute directly to your users.
            </p>
            <ul className="space-y-4">
              {[
                "Custom package name (com.your.app)",
                "Customized splash screens",
                "Theme color integration",
                "Automated signing"
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-lg font-medium">
                  <Shield className="w-6 h-6 text-accent" /> {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex-1 relative">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <img 
              src={`${import.meta.env.BASE_URL}images/mockup.png`} 
              alt="App Mockup" 
              className="relative z-10 w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-700"
            />
          </div>
        </div>
      </section>
    </Layout>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="glass-panel p-8 rounded-3xl hover:-translate-y-2 transition-all duration-300"
    >
      <div className="w-16 h-16 rounded-2xl bg-background border border-border/50 flex items-center justify-center mb-6 shadow-lg">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </motion.div>
  );
}
