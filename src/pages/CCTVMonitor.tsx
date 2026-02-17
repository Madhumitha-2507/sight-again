import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2, CheckCircle, AlertCircle, Trash2, Users, Scan } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMissingPersons } from "@/hooks/useMissingPersons";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Extract a frame from video at a given time as base64
const extractFrameAsBase64 = (videoFile: File, timeSeconds: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(timeSeconds, video.duration - 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('No canvas context')); return; }
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      URL.revokeObjectURL(video.src);
      resolve(base64);
    };

    video.onerror = () => reject(new Error('Could not load video'));
    video.src = URL.createObjectURL(videoFile);
  });
};

export default function CCTVMonitor() {
  const { toast } = useToast();
  const { missingPersons } = useMissingPersons();
  const [video, setVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleUpload = async () => {
    if (!video) {
      toast({
        title: "Error",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    if (missingPersons.length === 0) {
      toast({
        title: "No Missing Persons",
        description: "Please add missing person records first before analyzing footage",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setResults([]);
    setProgressMessage("Extracting frames from video...");

    try {
      // Extract 3 frames directly as base64 (no face-api.js needed)
      setProgress(10);
      const tempVideo = document.createElement('video');
      tempVideo.preload = 'metadata';
      const duration = await new Promise<number>((resolve, reject) => {
        tempVideo.onloadedmetadata = () => resolve(tempVideo.duration);
        tempVideo.onerror = () => reject(new Error('Could not load video'));
        tempVideo.src = URL.createObjectURL(video);
      });
      URL.revokeObjectURL(tempVideo.src);

      const frameCount = 3;
      const frameTimes = Array.from({ length: frameCount }, (_, i) => 
        (duration / (frameCount + 1)) * (i + 1)
      );

      setProgress(20);
      setProgressMessage("Extracting frames...");
      
      const frames = await Promise.all(
        frameTimes.map(t => extractFrameAsBase64(video, t))
      );

      setProgress(40);
      setProgressMessage(`Sending ${frames.length} frames to AI for analysis...`);

      // Send all frames to backend in parallel
      const allMatches: any[] = [];
      const frameResults = await Promise.allSettled(
        frames.map((frameBase64, i) =>
          supabase.functions.invoke("compare-faces", {
            body: {
              videoFrameBase64: frameBase64,
              videoFilename: video.name,
              location: "Uploaded via web interface",
              faceIndex: i + 1,
              totalFaces: frames.length,
            },
          })
        )
      );

      for (const result of frameResults) {
        if (result.status === "fulfilled" && result.value.data?.matches?.length > 0) {
          allMatches.push(...result.value.data.matches);
        }
      }

      setProgress(100);
      setResults(allMatches);

      if (allMatches.length > 0) {
        toast({
          title: "🚨 Matches Found!",
          description: `Found ${allMatches.length} potential match(es)! Check the Matches page.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: `Analyzed ${frames.length} frames. No matches found.`,
        });
      }
    } catch (error) {
      console.error("Error processing video:", error);
      toast({
        title: "Error",
        description: "Failed to process video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setProgressMessage("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CCTV Monitor</h1>
        <p className="text-muted-foreground">
          Upload and analyze CCTV footage for missing person detection using AI-powered face recognition
        </p>
      </div>

      {missingPersons.length === 0 && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning" />
          <p className="text-sm">
            No missing persons in database. Please add missing person records before analyzing footage.
          </p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="h-5 w-5" />
              Upload CCTV Footage
            </CardTitle>
            <CardDescription>
              Upload video files to analyze for missing person matches. Works with crowded scenes!
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
                disabled={isProcessing}
              />
              <p className="text-sm text-muted-foreground">
                Supported formats: MP4, AVI, MOV, WebM
              </p>
            </div>

            {video && (
              <div className="space-y-2">
                <div className="rounded-lg border overflow-hidden bg-muted">
                  <video
                    ref={videoRef}
                    src={URL.createObjectURL(video)}
                    className="w-full max-h-[200px] object-contain"
                    controls
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setVideo(null);
                    setResults([]);
                    setProgress(0);
                  }}
                  disabled={isProcessing}
                  className="w-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove Video
                </Button>
              </div>
            )}

            {isProcessing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center">
                  {progressMessage}
                </p>
              </div>
            )}

            <Button 
              onClick={handleUpload} 
              disabled={!video || isProcessing || missingPersons.length === 0}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload & Analyze with AI
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Analysis Status
            </CardTitle>
            <CardDescription>
              Database: {missingPersons.length} missing person(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((result, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg border bg-destructive/5 border-destructive/20">
                    <img
                      src={result.person.image_url}
                      alt={result.person.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{result.person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {result.confidence}%
                      </p>
                      <Badge variant="destructive" className="mt-1">
                        Match Detected
                      </Badge>
                    </div>
                    <CheckCircle className="h-6 w-6 text-destructive" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Scan className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isProcessing
                    ? "AI is detecting and analyzing faces..."
                    : "Upload a video to detect faces in crowded scenes"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>AI-powered multi-face detection for crowded videos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">1</div>
              <div>
                <p className="font-medium">Upload Video</p>
                <p className="text-sm text-muted-foreground">
                  Upload CCTV footage with crowds
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">2</div>
              <div>
                <p className="font-medium">Face Detection</p>
                <p className="text-sm text-muted-foreground">
                  AI detects all faces in multiple frames
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">3</div>
              <div>
                <p className="font-medium">Face Comparison</p>
                <p className="text-sm text-muted-foreground">
                  Each face is compared with database
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">4</div>
              <div>
                <p className="font-medium">Get Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Instant alerts for matches found
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
