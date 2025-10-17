# MealUpload Component Documentation

## Location
`src/components/AICoach/MealUpload.tsx`

## Purpose
Handles multi-photo meal uploads (up to 10 photos) with camera capture support. Converts images to base64 and manages photo state.

## Props Interface
```typescript
interface MealUploadProps {
  onAnalyze: (imageFiles: File[]) => void;  // Callback when user clicks analyze
  loading: boolean;                         // Disable UI during analysis
}
```

## State Management

### Primary State
```typescript
const [photos, setPhotos] = useState<PhotoItem[]>([]);
const [showCamera, setShowCamera] = useState(false);
const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
```

### PhotoItem Interface
```typescript
interface PhotoItem {
  file: File;          // Original File object
  preview: string;     // Base64 data URL for preview
  id: string;          // Unique identifier (timestamp + random)
}
```

## Key Functions

### 1. `handleFileSelect(event)`
**Purpose**: Process files selected via file input

**Flow**:
```
1. Extract files from input event
2. Validate each file:
   - Check photo limit (10 max)
   - Validate file type (image/*)
   - Validate file size (10MB max)
3. Convert valid files to PhotoItems using FileReader
4. Use Promise.all to wait for all conversions
5. Update state with new photos
```

**Implementation**:
```typescript
const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('🔍 [MealUpload] handleFileSelect called');
  const files = Array.from(event.target.files || []);

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

  // Update state once with all new photos
  setPhotos(prev => [...prev, ...newPhotos]);

  // Clear input for re-selection
  if (fileInputRef.current) {
    fileInputRef.current.value = '';
  }
};
```

**Why Promise.all?**
- Ensures all FileReader operations complete before state update
- Prevents race conditions
- Enables parallel processing for performance

### 2. `startCamera()`
**Purpose**: Request camera access and start video stream

**Flow**:
```
1. Request camera access via navigator.mediaDevices.getUserMedia()
2. Use 'environment' facingMode (back camera on mobile)
3. Set video element srcObject to stream
4. Show camera UI
```

**Implementation**:
```typescript
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
```

### 3. `capturePhoto()`
**Purpose**: Capture still frame from video stream

**Flow**:
```
1. Draw current video frame to canvas
2. Convert canvas to blob
3. Create File object from blob
4. Generate base64 preview
5. Add to photos array
6. Close camera if limit reached
```

**Implementation**:
```typescript
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
  }, 'image/jpeg', 0.9); // 90% quality
};
```

### 4. `handleAnalyze()`
**Purpose**: Send photos to parent component for analysis

**Flow**:
```
1. Check if photos exist
2. Extract File objects from PhotoItems
3. Call onAnalyze callback with File[]
```

**Implementation**:
```typescript
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
```

### 5. `handleRemovePhoto(id)`
**Purpose**: Remove a single photo from the array

```typescript
const handleRemovePhoto = (id: string) => {
  setPhotos(prev => prev.filter(photo => photo.id !== id));
};
```

### 6. `handleClearAll()`
**Purpose**: Clear all photos and stop camera

```typescript
const handleClearAll = () => {
  setPhotos([]);
  stopCamera();
};
```

## UI Structure

```
┌─────────────────────────────────────────────┐
│  📸 AI Meal Analyzer                        │
│  Upload or capture up to 10 photos...      │
└─────────────────────────────────────────────┘

          ┌─ If photos exist ─┐
          │                    │
          ▼                    │
┌─────────────────────┐        │
│  2 / 10 photos      │        │
│  [counter badge]    │        │
└─────────────────────┘        │
                               │
          ┌───────────────────┐│
          │  Photos Grid      ││
          │  [img] [img]      ││
          │  [×]   [×]        ││ ← Hover to remove
          └───────────────────┘│
                               │
          ┌───────────────────┐│
          │  🤖 Analyze w/ AI ││
          │  [Clear All]      ││
          └───────────────────┘│
          ▲                    │
          └────────────────────┘

OR

          ┌─ If showCamera ─┐
          │                 │
          ▼                 │
┌──────────────────────────┐│
│  [Live Video Stream]     ││
│                          ││
│  [📷 Capture] [✕ Close] ││
└──────────────────────────┘│
          ▲                 │
          └─────────────────┘

OR

          ┌─ If no photos ─┐
          │                │
          ▼                │
┌──────────────────────────┐│
│  [📁 Upload Photos]      ││
│  [📷 Use Camera]         ││
└──────────────────────────┘│
          ▲                │
          └────────────────┘
```

## Constants

```typescript
const MAX_PHOTOS = 10;                      // Photo limit
const MAX_FILE_SIZE = 10 * 1024 * 1024;    // 10MB per file
```

## Refs

```typescript
const fileInputRef = useRef<HTMLInputElement>(null);  // Hidden file input
const videoRef = useRef<HTMLVideoElement>(null);      // Camera video element
const canvasRef = useRef<HTMLCanvasElement>(null);   // Canvas for capture
```

## Debug Logging

The component includes comprehensive logging:
- Component mount/unmount
- Photos state changes
- File selection events
- Photo loading progress
- Analyze button clicks

Example logs:
```
🔍 [MealUpload] Component mounted
🔍 [MealUpload] Rendering - photos: 0 showCamera: false loading: false canAddMore: true
🔍 [MealUpload] handleFileSelect called
🔍 [MealUpload] Files selected: 2
🔍 [MealUpload] Valid files to process: 2
🔍 [MealUpload] Photos loaded: 2
🔍 [MealUpload] Updating photos state to: 2
🔍 [MealUpload] Photos state: 2 photos
```

## Error Handling

1. **No camera access**: Alert user and suggest file upload
2. **File type mismatch**: Skip invalid files with alert
3. **File size exceeded**: Skip large files with alert
4. **Photo limit reached**: Alert user and stop accepting more
5. **FileReader errors**: Gracefully skip failed files

## Performance Optimizations

1. **useCallback for parent callbacks**: Prevents parent re-renders
2. **Promise.all for FileReader**: Parallel processing
3. **Refs for DOM elements**: Avoid re-renders
4. **useEffect cleanup**: Stop camera on unmount
5. **Memoized canAddMore**: Computed once per render

## Browser Compatibility

- **FileReader API**: Supported in all modern browsers
- **MediaDevices API**: Requires HTTPS (except localhost)
- **Canvas API**: Universal support
- **File API**: Universal support

## Mobile Considerations

- `facingMode: 'environment'` uses back camera on mobile
- Touch-friendly button sizes (44px+ tap targets)
- Responsive grid layout for photos
- File input accepts all image types (`accept="image/*"`)

## Testing Checklist

- [ ] Upload single photo
- [ ] Upload multiple photos (2-10)
- [ ] Upload 10+ photos (should block at 10)
- [ ] Upload non-image file (should reject)
- [ ] Upload 10MB+ file (should reject)
- [ ] Remove individual photos
- [ ] Clear all photos
- [ ] Start camera
- [ ] Capture photo from camera
- [ ] Capture multiple photos
- [ ] Close camera
- [ ] Analyze with photos
- [ ] Analyze without photos (should warn)
- [ ] Component remounts (state should persist)
