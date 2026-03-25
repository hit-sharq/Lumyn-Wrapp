import { useRoute } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Download, AlertCircle, RefreshCw, Smartphone, CheckCircle, Clock } from "lucide-react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useConversion, useConversionStatus } from "@/hooks/use-conversions";

export default function ConversionDetailPage() {
  const [, params] = useRoute("/conversions/:id");
  const id = params?.id || "";
  
  const { data: job, isLoading } = useConversion(id);
  // Polling hook automatically refetches if status is pending/processing
  const { data: statusData } = useConversionStatus(id);

  // Merge the base job data with any updated status
  const currentStatus = statusData?.status || job?.status;
  const currentDownloadUrl = statusData?.apkDownloadUrl || job?.apkDownloadUrl;
  const currentError = statusData?.errorMessage || job?.errorMessage;

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <Skeleton className="h-10 w-40 mb-8" />
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Conversion Not Found</h1>
        </div>
      </Layout>
    );
  }

  const isWorking = currentStatus === 'pending' || currentStatus === 'processing';
  const isDone = currentStatus === 'completed';
  const isFailed = currentStatus === 'failed';

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 md:py-12 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => window.history.back()}
          className="mb-6 -ml-4 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl md:text-4xl font-bold font-display tracking-tight">
                {job.appName}
              </h1>
              <Badge className={
                isDone ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                isFailed ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                isWorking ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' :
                'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
              } variant="outline">
                {currentStatus?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-muted-foreground font-mono text-sm">{job.packageName} • v{job.versionName}</p>
          </div>
          
          {isDone && currentDownloadUrl && (
            <Button size="lg" className="rounded-full px-8 shadow-glow bg-primary text-primary-foreground" asChild>
              <a href={currentDownloadUrl} download>
                <Download className="w-5 h-5 mr-2" /> Download APK
              </a>
            </Button>
          )}
        </div>

        <Card className="glass-panel border-border/50 overflow-hidden mb-8">
          <div className="bg-muted/30 p-8 flex flex-col items-center justify-center text-center min-h-[300px] relative border-b border-border/50">
            {isWorking && (
              <>
                <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full animate-pulse-glow" />
                <div className="relative z-10 w-24 h-24 rounded-full bg-background border border-border flex items-center justify-center shadow-xl mb-6">
                  <RefreshCw className="w-10 h-10 text-primary animate-spin" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Building your APK</h3>
                <p className="text-muted-foreground max-w-md">
                  We're wrapping your web application into a native Android container. 
                  This usually takes 2-5 minutes.
                </p>
                <div className="w-full max-w-md mt-8 h-2 bg-background rounded-full overflow-hidden border border-border">
                  <div className="h-full bg-primary w-1/2 animate-pulse rounded-full" />
                </div>
              </>
            )}

            {isDone && (
              <>
                <div className="absolute inset-0 bg-green-500/5 blur-[100px] rounded-full" />
                <div className="relative z-10 w-24 h-24 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-xl mb-6">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Build Completed Successfully!</h3>
                <p className="text-muted-foreground max-w-md">
                  Your native Android application is ready. Download the APK file to install it on devices or submit to the Play Store.
                </p>
              </>
            )}

            {isFailed && (
              <>
                <div className="absolute inset-0 bg-red-500/5 blur-[100px] rounded-full" />
                <div className="relative z-10 w-24 h-24 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-xl mb-6">
                  <AlertCircle className="w-12 h-12 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Build Failed</h3>
                <p className="text-red-400 max-w-md bg-red-500/10 p-4 rounded-xl border border-red-500/20 mt-4">
                  {currentError || "An unknown error occurred during compilation."}
                </p>
              </>
            )}
          </div>
          
          <CardContent className="p-0">
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border/50">
              <div className="p-6 md:p-8 space-y-6">
                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                  <Smartphone className="w-4 h-4 text-muted-foreground" /> App Details
                </h4>
                <div className="space-y-4">
                  <DetailRow label="Target URL" value={job.webUrl} />
                  <DetailRow label="App Name" value={job.appName} />
                  <DetailRow label="Package" value={job.packageName} />
                  <DetailRow label="Version" value={job.versionName} />
                </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-6">
                <h4 className="font-semibold flex items-center gap-2 text-foreground">
                  <Clock className="w-4 h-4 text-muted-foreground" /> Job Information
                </h4>
                <div className="space-y-4">
                  <DetailRow label="Job ID" value={job.id.substring(0, 8) + '...'} />
                  <DetailRow label="Started At" value={format(new Date(job.createdAt), 'MMM d, h:mm a')} />
                  <DetailRow label="Completed At" value={statusData?.completedAt || job.completedAt ? format(new Date(statusData?.completedAt || job.completedAt!), 'MMM d, h:mm a') : 'Pending'} />
                  
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
                    <div className="flex-1 flex gap-2 items-center">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: job.splashScreenColor || '#000' }} />
                      <span className="text-xs text-muted-foreground">Splash</span>
                    </div>
                    <div className="flex-1 flex gap-2 items-center">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: job.themeColor || '#000' }} />
                      <span className="text-xs text-muted-foreground">Theme</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

function DetailRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right max-w-[200px] truncate" title={value}>{value}</span>
    </div>
  );
}
