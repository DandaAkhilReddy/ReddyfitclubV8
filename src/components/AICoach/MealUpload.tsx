// Meal Photo Upload Component (Multi-Photo + Camera Support)
import { useState, useRef, useEffect, memo } from 'react';
import './AICoach.css';

interface PhotoItem {
  file: File;
  preview: string;
  id: string;
}

interface MealUploadProps {
  onAnalyze: (imageFiles: File[]) => void;
  loading: boolean;
}

const MAX_PHOTOS = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function MealUpload({ onAnalyze, loading }: MealUploadProps) {
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Debug: Component mounted
  useEffect(() => {
    console.log('🔍 [MealUpload] Component mounted');
    return () => console.log('🔍 [MealUpload] Component unmounted');
  }, []);

  // Debug: Photos state changed
  useEffect(() => {
    console.log('🔍 [MealUpload] Photos state:', photos.length, 'photos');
  }, [photos]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🔍 [MealUpload] handleFileSelect called');
    const files = Array.from(event.target.files || []);
    console.log('🔍 [MealUpload] Files selected:', files.length);
    if (files.length === 0) return;

    // Validate files first
    const filesToProcess: File[] = [];

    for (const file of files) {
      // Stop if we've reached the limit
      if (photos.length + filesToProcess.length >= MAX_PHOTOS) {
        alert(`Maximum ${MAX_PHOTOS} photos allowed`);
        break;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert(`Skipping ${file.name}: Not an image file`);
        continue;
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        alert(`Skipping ${file.name}: File too large (max 10MB)`);
        continue;
      }

      filesToProcess.push(file);
    }

    console.log('🔍 [MealUpload] Valid files to process:', filesToProcess.length);

    // Process all valid files with Promise.all
    const photoPromises = filesToProcess.map((file) => {
      return new Promise<PhotoItem>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const preview = e.target?.result as string;
          resolve({
            file,
            preview,
            id: `${Date.now()}-${Math.random()}`,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    // Wait for all FileReaders to complete
    const newPhotos = await Promise.all(photoPromises);
    console.log('🔍 [MealUpload] Photos loaded:', newPhotos.length);

    // Update state once with all new photos
    setPhotos(prev => {
      const updated = [...prev, ...newPhotos];
      console.log('🔍 [MealUpload] Updating photos state to:', updated.length);
      return updated;
    });

    // Clear input for re-selection
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleClearAll = () => {
    setPhotos([]);
    stopCamera();
  };

  const handleAnalyze = () => {
    console.log('🔍 [MealUpload] handleAnalyze called, photos:', photos.length);
    if (photos.length > 0) {
      const files = photos.map(p => p.file);
      console.log('🔍 [MealUpload] Sending files to onAnalyze:', files.length);
      onAnalyze(files);
    } else {
      console.warn('⚠️ [MealUpload] No photos to analyze!');
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Use back camera on mobile
      });
      setCameraStream(stream);
      setShowCamera(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access error:', error);
      alert('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0);

    // Convert canvas to blob then File
    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = canvas.toDataURL('image/jpeg');

      setPhotos(prev => [
        ...prev,
        {
          file,
          preview,
          id: `${Date.now()}-${Math.random()}`,
        },
      ]);

      // Stop camera after capturing if we've reached the limit
      if (photos.length + 1 >= MAX_PHOTOS) {
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const canAddMore = photos.length < MAX_PHOTOS;

  console.log('🔍 [MealUpload] Rendering - photos:', photos.length, 'showCamera:', showCamera, 'loading:', loading, 'canAddMore:', canAddMore);

  return (
    <div className="meal-upload-container">
      <h2>📸 AI Meal Analyzer</h2>
      <p className="subtitle">
        Upload or capture up to {MAX_PHOTOS} photos for accurate nutrition analysis
      </p>

      {/* Photo Counter */}
      {photos.length > 0 && (
        <div className="photo-counter">
          <span className="counter-badge">
            {photos.length} / {MAX_PHOTOS} photos
          </span>
        </div>
      )}

      {/* Camera View */}
      {showCamera ? (
        <div className="camera-container">
          <video ref={videoRef} autoPlay playsInline className="camera-video" />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          <div className="camera-controls">
            <button
              className="camera-button capture"
              onClick={capturePhoto}
              disabled={!canAddMore || loading}
            >
              📷 Capture Photo
            </button>
            <button className="camera-button cancel" onClick={stopCamera}>
              ✕ Close Camera
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Upload Buttons */}
          <div className="upload-buttons">
            <button
              className="upload-method-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAddMore || loading}
            >
              📁 Upload Photos
            </button>
            <button
              className="upload-method-button camera-btn"
              onClick={startCamera}
              disabled={!canAddMore || loading}
            >
              📷 Use Camera
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </>
      )}

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="photos-grid">
          {photos.map((photo) => (
            <div key={photo.id} className="photo-item">
              <img src={photo.preview} alt="Meal" className="photo-thumbnail" />
              <button
                className="remove-photo-button"
                onClick={() => handleRemovePhoto(photo.id)}
                disabled={loading}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {photos.length > 0 && (
        <div className="action-buttons">
          <button
            className="analyze-button primary"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing {photos.length} photo{photos.length > 1 ? 's' : ''}...
              </>
            ) : (
              <>
                🤖 Analyze with AI
              </>
            )}
          </button>
          <button
            className="clear-all-button"
            onClick={handleClearAll}
            disabled={loading}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Tips */}
      <div className="info-box">
        <strong>💡 Tips for best results:</strong>
        <ul>
          <li>Take photos from multiple angles</li>
          <li>Capture all food items clearly</li>
          <li>Ensure good lighting</li>
          <li>Include side dishes and drinks</li>
          <li>Up to {MAX_PHOTOS} photos per analysis</li>
        </ul>
      </div>
    </div>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(MealUpload);
