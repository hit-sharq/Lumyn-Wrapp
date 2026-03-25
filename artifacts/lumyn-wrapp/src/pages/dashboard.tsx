import { Link } from "wouter";
import { format } from "date-fns";
import { Plus, Package, ExternalLink, Download, AlertCircle, Clock, CheckCircle2, Zap } from "lucide-react";
import { Layout } from "@/components/layout";
import { useMySubscription } from "@/hooks/use-subscriptions";
import { useConversions } from "@/hooks/use-conversions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: subData, isLoading: isLoadingSub } = useMySubscription();
  const { data: conversions, isLoading: isLoadingConversions } = useConversions();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your web-to-APK conversions</p>
          </div>
          <Link href="/convert">
            <Button className="rounded-full shadow-glow bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" /> New Conversion
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {isLoadingSub ? (
            <Skeleton className="h-40 rounded-2xl w-full md:col-span-3" />
          ) : (
            <>
              <Card className="glass-panel border-primary/20 md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subData?.subscription ? (
                    <div>
                      <div className="text-3xl font-bold mb-1">{subData.subscription.planName}</div>
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {subData.subscription.status.toUpperCase()}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-4">
                        Renews on {format(new Date(subData.subscription.currentPeriodEnd), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-2xl font-bold mb-3">No Active Plan</div>
                      <Link href="/pricing">
                        <Button size="sm" variant="secondary" className="w-full">Upgrade Now</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="glass-panel md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-5 h-5 text-accent" /> Conversion Usage
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-center gap-8">
                  <div>
                    <div className="text-4xl font-bold text-foreground">
                      {subData?.conversionsUsedThisMonth || 0}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mt-1">Used this month</div>
                  </div>
                  <div className="h-16 w-px bg-border/50"></div>
                  <div>
                    <div className="text-4xl font-bold text-primary">
                      {subData?.conversionsRemaining === -1 ? '∞' : (subData?.conversionsRemaining || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground font-medium mt-1">Remaining</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock className="w-5 h-5" /> Recent Conversions
          </h2>

          {isLoadingConversions ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-xl w-full" />)}
            </div>
          ) : conversions?.length === 0 ? (
            <div className="text-center py-20 bg-card/30 rounded-3xl border border-dashed border-border">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">No conversions yet</h3>
              <p className="text-muted-foreground mb-6">Create your first Android app in minutes.</p>
              <Link href="/convert">
                <Button>Start Conversion</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {conversions?.map((job) => (
                <Link key={job.id} href={`/conversions/${job.id}`}>
                  <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-card/80 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-background border border-border/50 flex items-center justify-center shrink-0">
                        {job.status === 'completed' ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : job.status === 'failed' ? (
                          <AlertCircle className="w-6 h-6 text-red-500" />
                        ) : job.status === 'processing' ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Clock className="w-6 h-6 text-yellow-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{job.appName}</h3>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                          <span className="truncate max-w-[200px] block">{job.packageName}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span>v{job.versionName}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span>{format(new Date(job.createdAt), 'MMM d, yyyy')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full md:w-auto mt-2 md:mt-0 justify-between md:justify-end">
                      <Badge className={
                        job.status === 'completed' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                        job.status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                        job.status === 'processing' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                        'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                      } variant="outline">
                        {job.status.toUpperCase()}
                      </Badge>
                      
                      <div className="opacity-50 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
