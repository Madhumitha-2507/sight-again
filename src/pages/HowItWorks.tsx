import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Camera, Box, Brain, Binary, Calculator, CheckCircle, XCircle } from "lucide-react";

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">How Face Recognition Works</h1>
          <p className="text-muted-foreground text-lg">
            Understanding the face-api.js pipeline used in our Missing Person Detection System
          </p>
        </div>

        {/* Main Pipeline Visualization */}
        <Card className="border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Face Recognition Pipeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4 p-4">
              {/* Step 1: Input Image */}
              <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg min-w-[150px]">
                <Camera className="w-12 h-12 text-primary mb-2" />
                <h3 className="font-semibold">1. Input Image</h3>
                <p className="text-sm text-muted-foreground">Video frame or photo</p>
              </div>

              <ArrowRight className="w-8 h-8 text-primary hidden lg:block" />
              <div className="lg:hidden">↓</div>

              {/* Step 2: Face Detection */}
              <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg min-w-[150px]">
                <Box className="w-12 h-12 text-orange-500 mb-2" />
                <h3 className="font-semibold">2. Face Detection</h3>
                <p className="text-sm text-muted-foreground">SSD MobileNet v1</p>
              </div>

              <ArrowRight className="w-8 h-8 text-primary hidden lg:block" />
              <div className="lg:hidden">↓</div>

              {/* Step 3: Landmark Detection */}
              <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg min-w-[150px]">
                <div className="w-12 h-12 text-blue-500 mb-2 relative">
                  <svg viewBox="0 0 48 48" className="w-full h-full">
                    <circle cx="16" cy="18" r="2" fill="currentColor" />
                    <circle cx="32" cy="18" r="2" fill="currentColor" />
                    <circle cx="24" cy="26" r="2" fill="currentColor" />
                    <circle cx="18" cy="34" r="1.5" fill="currentColor" />
                    <circle cx="24" cy="36" r="1.5" fill="currentColor" />
                    <circle cx="30" cy="34" r="1.5" fill="currentColor" />
                  </svg>
                </div>
                <h3 className="font-semibold">3. Landmarks</h3>
                <p className="text-sm text-muted-foreground">68 facial points</p>
              </div>

              <ArrowRight className="w-8 h-8 text-primary hidden lg:block" />
              <div className="lg:hidden">↓</div>

              {/* Step 4: Embedding Generation */}
              <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg min-w-[150px]">
                <Brain className="w-12 h-12 text-purple-500 mb-2" />
                <h3 className="font-semibold">4. Embeddings</h3>
                <p className="text-sm text-muted-foreground">128-D Vector</p>
              </div>

              <ArrowRight className="w-8 h-8 text-primary hidden lg:block" />
              <div className="lg:hidden">↓</div>

              {/* Step 5: Comparison */}
              <div className="flex flex-col items-center text-center p-4 bg-muted/50 rounded-lg min-w-[150px]">
                <Calculator className="w-12 h-12 text-green-500 mb-2" />
                <h3 className="font-semibold">5. Compare</h3>
                <p className="text-sm text-muted-foreground">Euclidean Distance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Explanation Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Face Detection */}
          <Card>
            <CardHeader className="bg-orange-500/10">
              <CardTitle className="flex items-center gap-2">
                <Box className="w-6 h-6 text-orange-500" />
                Face Detection (SSD MobileNet v1)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-muted-foreground">
                The first step uses a neural network to locate faces in an image.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`// Load the model
await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

// Detect all faces
const detections = await faceapi.detectAllFaces(
  image, 
  new faceapi.SsdMobilenetv1Options({ 
    minConfidence: 0.5 
  })
);

// Output: Array of face bounding boxes
// [{ box: { x, y, width, height }, score: 0.98 }]`}
                </pre>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-semibold">Output:</span>
                <span className="bg-orange-500/20 px-2 py-1 rounded">
                  Bounding box coordinates + confidence score
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Landmark Detection */}
          <Card>
            <CardHeader className="bg-blue-500/10">
              <CardTitle className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-blue-500">
                  <circle cx="8" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="16" cy="9" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="14" r="1" fill="currentColor" />
                  <path d="M8 17 Q12 20 16 17" stroke="currentColor" fill="none" strokeWidth="1.5" />
                </svg>
                Facial Landmarks (68 Points)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-muted-foreground">
                Identifies 68 key points on the face for alignment and feature extraction.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`// Load landmark model
await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

// Detect faces with landmarks
const detections = await faceapi
  .detectAllFaces(image)
  .withFaceLandmarks();

// Output: 68 facial landmark points
// Points include: jaw, eyebrows, nose, eyes, mouth`}
                </pre>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="bg-blue-500/20 px-2 py-1 rounded text-center">Eyes (12 points)</div>
                <div className="bg-blue-500/20 px-2 py-1 rounded text-center">Nose (9 points)</div>
                <div className="bg-blue-500/20 px-2 py-1 rounded text-center">Mouth (20 points)</div>
                <div className="bg-blue-500/20 px-2 py-1 rounded text-center">Jaw (17 points)</div>
              </div>
            </CardContent>
          </Card>

          {/* Embedding Generation */}
          <Card>
            <CardHeader className="bg-purple-500/10">
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-500" />
                Face Embeddings (128-D Vector)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-muted-foreground">
                Converts the face into a unique 128-dimensional numerical representation (fingerprint).
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`// Load recognition model
await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

// Generate face descriptor (embedding)
const detections = await faceapi
  .detectAllFaces(image)
  .withFaceLandmarks()
  .withFaceDescriptors();

// Output: Float32Array of 128 numbers
// [-0.12, 0.34, -0.56, 0.78, ... (128 values)]`}
                </pre>
              </div>
              <div className="bg-purple-500/20 p-3 rounded-lg">
                <p className="text-sm font-semibold mb-2">Example Embedding:</p>
                <div className="font-mono text-xs flex flex-wrap gap-1">
                  {[-0.12, 0.34, -0.56, 0.78, 0.15, -0.42, 0.91, -0.23].map((val, i) => (
                    <span key={i} className="bg-background px-1 rounded">
                      {val.toFixed(2)}
                    </span>
                  ))}
                  <span className="text-muted-foreground">... (128 total)</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Distance Comparison */}
          <Card>
            <CardHeader className="bg-green-500/10">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-6 h-6 text-green-500" />
                Face Comparison (Euclidean Distance)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <p className="text-muted-foreground">
                Compares two face embeddings by calculating the distance between them.
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <pre className="text-sm overflow-x-auto">
{`// Calculate Euclidean distance between two embeddings
const distance = faceapi.euclideanDistance(
  embedding1,  // [0.12, -0.34, ...]
  embedding2   // [0.15, -0.32, ...]
);

// Threshold for matching
const THRESHOLD = 0.6;
const isMatch = distance < THRESHOLD;

// distance < 0.6 = Same person (MATCH)
// distance > 0.6 = Different person`}
                </pre>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm">Distance = 0.3 → <strong className="text-green-500">MATCH</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span className="text-sm">Distance = 0.8 → <strong className="text-red-500">NO MATCH</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Visual Embedding Explanation */}
        <Card className="border-2 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-xl">What is an Embedding?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              An embedding is a way to represent a face as a list of 128 numbers. 
              Similar faces have similar numbers, making comparison easy.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Same Person Example */}
              <div className="space-y-3">
                <h4 className="font-semibold text-green-500">Same Person (Small Distance)</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">A</div>
                    <Binary className="w-4 h-4" />
                    <code className="text-xs">[0.12, 0.34, -0.56, ...]</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">A</div>
                    <Binary className="w-4 h-4" />
                    <code className="text-xs">[0.14, 0.32, -0.54, ...]</code>
                  </div>
                  <div className="text-center py-2">
                    <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm font-semibold">
                      Distance: 0.25 ✓
                    </span>
                  </div>
                </div>
              </div>

              {/* Different Person Example */}
              <div className="space-y-3">
                <h4 className="font-semibold text-red-500">Different Person (Large Distance)</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">A</div>
                    <Binary className="w-4 h-4" />
                    <code className="text-xs">[0.12, 0.34, -0.56, ...]</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 bg-secondary/50 rounded-full flex items-center justify-center">B</div>
                    <Binary className="w-4 h-4" />
                    <code className="text-xs">[-0.78, 0.91, 0.23, ...]</code>
                  </div>
                  <div className="text-center py-2">
                    <span className="bg-red-500/20 text-red-500 px-3 py-1 rounded-full text-sm font-semibold">
                      Distance: 0.85 ✗
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Formula */}
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Euclidean Distance Formula:</h4>
              <div className="text-center py-4 font-mono text-lg">
                d = √( (a₁-b₁)² + (a₂-b₂)² + ... + (a₁₂₈-b₁₂₈)² )
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Calculates the "straight line" distance between two 128-dimensional points
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Our Project Implementation */}
        <Card className="border-2 border-primary">
          <CardHeader className="bg-primary/10">
            <CardTitle className="text-xl">Our Project Implementation</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <p className="text-muted-foreground">
              In our Missing Person Detection System, we use face-api.js for detection and extraction,
              then send the cropped faces to Gemini AI for comparison.
            </p>
            
            <div className="grid md:grid-cols-3 gap-4 text-center">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-orange-500">Step 1</h4>
                <p className="text-sm">Upload CCTV footage</p>
                <p className="text-xs text-muted-foreground mt-1">Video file input</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-blue-500">Step 2</h4>
                <p className="text-sm">Extract faces from frames</p>
                <p className="text-xs text-muted-foreground mt-1">face-api.js detection</p>
              </div>
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold text-purple-500">Step 3</h4>
                <p className="text-sm">Compare with database</p>
                <p className="text-xs text-muted-foreground mt-1">Gemini AI matching</p>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg mt-4">
              <pre className="text-sm overflow-x-auto">
{`// Current implementation in our project
import { detectAndExtractFaces } from '@/utils/faceDetection';

// 1. Load models
await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

// 2. Detect and extract faces from video frame
const faces = await detectAndExtractFaces(videoFrame);
// Returns: [{ faceImage: base64, box: {...}, confidence: 0.95 }]

// 3. Send to Gemini AI for comparison
const result = await supabase.functions.invoke('compare-faces', {
  body: { detectedFaces: faces, missingPersons: [...] }
});`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HowItWorks;
