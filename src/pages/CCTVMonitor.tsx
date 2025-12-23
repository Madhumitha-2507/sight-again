import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Loader2, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMissingPersons } from "@/hooks/useMissingPersons";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function CCTVMonitor() {
  const { toast } = useToast();
  const { missingPersons } = useMissingPersons();
  const [video, setVideo] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const extractFrameFromVideo = (videoFile: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      
      video.onloadedmetadata = () => {
        // Seek to 1 second or middle of video
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const base64 = canvas.toDataURL("image/jpeg", 0.8).split(",")[1];
          resolve(base64);
        } else {
          reject(new Error("Could not get canvas context"));
        }
        
        URL.revokeObjectURL(video.src);
      };

      video.onerror = () => {
        reject(new Error("Could not load video"));
      };

      video.src = URL.createObjectURL(videoFile);
    });
  };

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

    try {
      // Extract frame from video
      setProgress(20);
      toast({
        title: "Processing",
        description: "Extracting frames from video...",
      });

      const frameBase64 = await extractFrameFromVideo(video);
      setProgress(40);

      toast({
        title: "Analyzing",
        description: "AI is comparing faces with missing person database...",
      });

      // Call AI comparison function
      const { data, error } = await supabase.functions.invoke("compare-faces", {
        body: {
          videoFrameBase64: frameBase64,
          videoFilename: video.name,
          location: "Uploaded via web interface",
        },
      });

      setProgress(100);

      if (error) {
        throw error;
      }

      setResults(data.matches || []);

      if (data.matches && data.matches.length > 0) {
        toast({
          title: "🚨 Matches Found!",
          description: `Found ${data.matches.length} potential match(es)! Check the Matches page for details.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: "No matches found in this footage.",
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
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">CCTV Monitor</h1>
        <p className="text-muted-foreground">
          Upload and analyze CCTV footage for missing person detection using AI
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
            <CardTitle>Upload CCTV Footage</CardTitle>
            <CardDescription>
              Upload video files to analyze for missing person matches using AI face recognition
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
                  {progress < 40 ? "Extracting frames..." : "AI analyzing faces..."}
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
            <CardTitle>Analysis Status</CardTitle>
            <CardDescription>
              Current database: {missingPersons.length} missing person(s)
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
                <Play className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {isProcessing
                    ? "AI is analyzing the footage..."
                    : "Upload a video to start AI face detection"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <Card>
        <CardHeader>
          <CardTitle>How It Works</CardTitle>
          <CardDescription>AI-powered face recognition process</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">1</div>
              <div>
                <p className="font-medium">Upload Video</p>
                <p className="text-sm text-muted-foreground">
                  Upload CCTV footage in MP4, AVI, or other formats
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">2</div>
              <div>
                <p className="font-medium">AI Analysis</p>
                <p className="text-sm text-muted-foreground">
                  AI extracts faces and compares with missing persons database
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 rounded-full p-2 text-primary font-bold">3</div>
              <div>
                <p className="font-medium">Get Alerts</p>
                <p className="text-sm text-muted-foreground">
                  Receive instant alerts when potential matches are found
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
