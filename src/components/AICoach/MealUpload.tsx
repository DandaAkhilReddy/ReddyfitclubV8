// Meal Photo Upload Component
import { useState, useRef } from 'react';
import './AICoach.css';

interface MealUploadProps {
  onAnalyze: (imageFile: File) => void;
  loading: boolean;
}

export default function MealUpload({ onAnalyze, loading }: MealUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image size must be less than 10MB');
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = () => {
    if (selectedFile) {
      onAnalyze(selectedFile);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="meal-upload-container">
      <h2>📸 AI Meal Analyzer</h2>
      <p className="subtitle">Upload a photo of your meal for instant nutrition analysis</p>

      <div className="upload-area">
        {!preview ? (
          <div className="upload-placeholder" onClick={() => fileInputRef.current?.click()}>
            <div className="upload-icon">📷</div>
            <p>Click to upload or drag image here</p>
            <small>Supports JPG, PNG, HEIC (max 10MB)</small>
          </div>
        ) : (
          <div className="preview-container">
            <img src={preview} alt="Meal preview" className="meal-preview" />
            <button className="clear-button" onClick={handleClear} disabled={loading}>
              ✕ Clear
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>

      {selectedFile && (
        <div className="action-buttons">
          <button
            className="analyze-button primary"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Analyzing...
              </>
            ) : (
              <>
                🤖 Analyze with AI
              </>
            )}
          </button>
        </div>
      )}

      <div className="info-box">
        <strong>💡 Tip:</strong> For best results:
        <ul>
          <li>Take photo from above</li>
          <li>Ensure good lighting</li>
          <li>Capture all food items clearly</li>
          <li>Avoid shadows or glare</li>
        </ul>
      </div>
    </div>
  );
}
