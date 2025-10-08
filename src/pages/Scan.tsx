import { useState, useRef } from 'react';
import { Camera, Upload, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

export function Scan() {
  const navigate = useNavigate();
  const { userProfile, updateUserProfile } = useAuth();
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);

  // Check if user has scans remaining
  const hasScansRemaining = userProfile && (userProfile.scansUsed < userProfile.scansLimit);

  const handleImageSelect = (file: File, type: 'front') => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'front') {
        setFrontImage(file);
        setFrontPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    setError('');
  };

  const handleStartScan = async () => {
    if (!frontImage || !userProfile) {
      setError('Please upload a front-facing photo');
      return;
    }

    if (!hasScansRemaining) {
      setError('You have reached your scan limit for this month');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // Upload to Firebase Storage
      const timestamp = Date.now();
      const frontRef = ref(storage, `scans/${userProfile.uid}/${timestamp}_front.jpg`);

      await uploadBytes(frontRef, frontImage);
      const frontUrl = await getDownloadURL(frontRef);

      // Update scans used count
      await updateUserProfile({
        scansUsed: userProfile.scansUsed + 1,
      });

      // Navigate to processing page with image URL
      navigate('/scan/processing', { state: { frontUrl, timestamp } });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload scan. Please try again.');
      setUploading(false);
    }
  };

  const handleRemoveImage = (type: 'front') => {
    if (type === 'front') {
      setFrontImage(null);
      setFrontPreview('');
      if (frontInputRef.current) frontInputRef.current.value = '';
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-2xl font-bold text-primary-600"
            >
              ReddyFit Club
            </button>
            <div className="text-sm text-gray-600">
              Scans remaining: <strong>{userProfile.scansLimit - userProfile.scansUsed}</strong> / {userProfile.scansLimit}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Start Your Body Scan</h1>
          <p className="text-xl text-gray-600">
            Upload a clear front-facing photo for AI-powered body composition analysis
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        {/* No Scans Remaining */}
        {!hasScansRemaining && (
          <div className="mb-6 p-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
            <h3 className="text-xl font-bold text-yellow-900 mb-2">Scan Limit Reached</h3>
            <p className="text-yellow-700 mb-4">
              You've used all {userProfile.scansLimit} scans this month. Your scans reset in{' '}
              {Math.ceil((userProfile.resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days.
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="bg-yellow-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-yellow-700"
            >
              Upgrade for Unlimited Scans
            </button>
          </div>
        )}

        {/* Photo Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-bold text-blue-900 mb-3">📸 Photo Guidelines for Best Results</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Stand 6-8 feet from camera</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Good lighting (natural light is best)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Wear fitted clothing or workout attire</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Plain background (wall or door)</span>
            </div>
          </div>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Front-Facing Photo (Required)</h3>

          {!frontPreview ? (
            <div
              onClick={() => frontInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors"
            >
              <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-700 mb-2">Upload Front Photo</h4>
              <p className="text-gray-500 mb-4">Click to select or drag and drop</p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Upload className="w-4 h-4" />
                <span>JPG, PNG up to 10MB</span>
              </div>
              <input
                ref={frontInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'front')}
                className="hidden"
              />
            </div>
          ) : (
            <div className="relative">
              <img
                src={frontPreview}
                alt="Front preview"
                className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
              />
              <button
                onClick={() => handleRemoveImage('front')}
                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleStartScan}
            disabled={!frontImage || uploading || !hasScansRemaining}
            className="flex-1 bg-primary-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-primary-700 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                Start Analysis
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
