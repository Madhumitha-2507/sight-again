import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play } from "lucide-react";

export default function CCTVMonitor() {
  const { toast } = useToast();
  const [video, setVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUpload = async () => {
    if (!video) {
      toast({
        title: "Error",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Processing Started",
        description: "CCTV footage is being analyzed for matches",
      });
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CCTV Monitor</h1>
        <p className="text-muted-foreground">
          Upload and analyze CCTV footage for missing person detection
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upload CCTV Footage</CardTitle>
            <CardDescription>
              Upload video files to analyze for missing person matches
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video">Video File</Label>
              <Input
                id="video"
                type="file"
                accept="video/*"
                onChange={(e) => setVideo(e.target.files?.[0] || null)}
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: MP4, AVI, MOV
              </p>
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!video || isProcessing}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isProcessing ? "Processing..." : "Upload & Process"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Feed Status</CardTitle>
            <CardDescription>
              Real-time CCTV monitoring (Coming Soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Play className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Live feed monitoring will be available in future updates
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Processing Queue</CardTitle>
          <CardDescription>Videos currently being analyzed</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No videos in processing queue
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
