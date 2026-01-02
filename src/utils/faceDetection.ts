import * as faceapi from 'face-api.js';

let modelsLoaded = false;

// Load face detection models
export const loadFaceDetectionModels = async (): Promise<void> => {
  if (modelsLoaded) return;
  
  const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model';
  
  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face detection models loaded successfully');
  } catch (error) {
    console.error('Error loading face detection models:', error);
    throw new Error('Failed to load face detection models');
  }
};

export interface DetectedFace {
  faceImage: string; // Base64 encoded face image
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

// Detect all faces in an image and extract them
export const detectAndExtractFaces = async (
  imageElement: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<DetectedFace[]> => {
  if (!modelsLoaded) {
    await loadFaceDetectionModels();
  }

  // Detect all faces with landmarks
  const detections = await faceapi
    .detectAllFaces(imageElement, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks();

  if (detections.length === 0) {
    return [];
  }

  const faces: DetectedFace[] = [];

  for (const detection of detections) {
    const box = detection.detection.box;
    
    // Add more padding around the face for better context
    const padding = 0.5;
    const paddedX = Math.max(0, box.x - box.width * padding);
    const paddedY = Math.max(0, box.y - box.height * padding);
    
    // Get source dimensions
    const sourceWidth = 'videoWidth' in imageElement ? imageElement.videoWidth : imageElement.width;
    const sourceHeight = 'videoHeight' in imageElement ? imageElement.videoHeight : imageElement.height;
    
    const paddedWidth = Math.min(box.width * (1 + padding * 2), sourceWidth - paddedX);
    const paddedHeight = Math.min(box.height * (1 + padding * 2), sourceHeight - paddedY);

    // Upscale small faces to minimum 256x256 for better AI analysis
    const minSize = 256;
    const scale = Math.max(1, minSize / Math.min(paddedWidth, paddedHeight));
    const outputWidth = Math.round(paddedWidth * scale);
    const outputHeight = Math.round(paddedHeight * scale);

    // Create canvas for face extraction with upscaling
    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Enable image smoothing for better upscaling quality
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(
        imageElement,
        paddedX,
        paddedY,
        paddedWidth,
        paddedHeight,
        0,
        0,
        outputWidth,
        outputHeight
      );

      // Use higher quality JPEG encoding
      const faceBase64 = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
      
      faces.push({
        faceImage: faceBase64,
        box: {
          x: box.x,
          y: box.y,
          width: box.width,
          height: box.height,
        },
        confidence: detection.detection.score,
      });
    }
  }

  return faces;
};

// Extract faces from a video frame
export const extractFacesFromVideoFrame = async (
  videoFile: File,
  onProgress?: (message: string) => void
): Promise<{ frameBase64: string; faces: DetectedFace[] }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    
    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2);
    };

    video.onseeked = async () => {
      try {
        onProgress?.('Loading face detection models...');
        await loadFaceDetectionModels();
        
        // Create canvas from video frame
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0);
        const frameBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        
        onProgress?.('Detecting faces in frame...');
        
        // Detect faces in the frame
        const faces = await detectAndExtractFaces(canvas);
        
        URL.revokeObjectURL(video.src);
        resolve({ frameBase64, faces });
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Could not load video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};

// Extract faces from multiple frames for better detection
export const extractFacesFromMultipleFrames = async (
  videoFile: File,
  frameCount: number = 3,
  onProgress?: (message: string) => void
): Promise<{ allFaces: DetectedFace[]; frameBase64: string }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.crossOrigin = 'anonymous';
    
    let duration = 0;
    let currentFrameIndex = 0;
    const allFaces: DetectedFace[] = [];
    const seenFacePositions: { x: number; y: number }[] = [];
    let mainFrameBase64 = '';

    video.onloadedmetadata = async () => {
      duration = video.duration;
      
      try {
        onProgress?.('Loading face detection models...');
        await loadFaceDetectionModels();
        processNextFrame();
      } catch (error) {
        reject(error);
      }
    };

    const processNextFrame = () => {
      if (currentFrameIndex >= frameCount) {
        URL.revokeObjectURL(video.src);
        resolve({ allFaces, frameBase64: mainFrameBase64 });
        return;
      }

      // Calculate time for each frame
      const frameTime = (duration / (frameCount + 1)) * (currentFrameIndex + 1);
      video.currentTime = Math.min(frameTime, duration - 0.1);
    };

    video.onseeked = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(video, 0, 0);
        
        // Save the middle frame as the main frame
        if (currentFrameIndex === Math.floor(frameCount / 2)) {
          mainFrameBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        }
        
        onProgress?.(`Detecting faces in frame ${currentFrameIndex + 1}/${frameCount}...`);
        
        const faces = await detectAndExtractFaces(canvas);
        
        // Add unique faces (avoid duplicates based on position)
        for (const face of faces) {
          const isDuplicate = seenFacePositions.some(pos => {
            const distance = Math.sqrt(
              Math.pow(pos.x - face.box.x, 2) + Math.pow(pos.y - face.box.y, 2)
            );
            return distance < 50; // Threshold for considering same face
          });
          
          if (!isDuplicate) {
            allFaces.push(face);
            seenFacePositions.push({ x: face.box.x, y: face.box.y });
          }
        }
        
        currentFrameIndex++;
        processNextFrame();
      } catch (error) {
        reject(error);
      }
    };

    video.onerror = () => {
      reject(new Error('Could not load video'));
    };

    video.src = URL.createObjectURL(videoFile);
  });
};
