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
  const [sideImage, setSideImage] = useState<File | null>(null);
  const [sidePreview, setSidePreview] = useState<string>('');
  const [backImage, setBackImage] = useState<File | null>(null);
  const [backPreview, setBackPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const frontInputRef = useRef<HTMLInputElement>(null);
  const sideInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  // Check if user has scans remaining
  const hasScansRemaining = userProfile && (userProfile.scansUsed < userProfile.scansLimit);

  const handleImageSelect = (file: File, type: 'front' | 'side' | 'back') => {
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
      } else if (type === 'side') {
        setSideImage(file);
        setSidePreview(reader.result as string);
      } else if (type === 'back') {
        setBackImage(file);
        setBackPreview(reader.result as string);
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

      // Upload side image if provided
      let sideUrl: string | undefined;
      if (sideImage) {
        const sideRef = ref(storage, `scans/${userProfile.uid}/${timestamp}_side.jpg`);
        await uploadBytes(sideRef, sideImage);
        sideUrl = await getDownloadURL(sideRef);
      }

      // Upload back image if provided
      let backUrl: string | undefined;
      if (backImage) {
        const backRef = ref(storage, `scans/${userProfile.uid}/${timestamp}_back.jpg`);
        await uploadBytes(backRef, backImage);
        backUrl = await getDownloadURL(backRef);
      }

      // Update scans used count
      await updateUserProfile({
        scansUsed: userProfile.scansUsed + 1,
      });

      // Navigate to processing page with all image URLs
      navigate('/scan/processing', {
        state: { frontUrl, sideUrl, backUrl, timestamp },
      });
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload scan. Please try again.');
      setUploading(false);
    }
  };

  const handleRemoveImage = (type: 'front' | 'side' | 'back') => {
    if (type === 'front') {
      setFrontImage(null);
      setFrontPreview('');
      if (frontInputRef.current) frontInputRef.current.value = '';
    } else if (type === 'side') {
      setSideImage(null);
      setSidePreview('');
      if (sideInputRef.current) sideInputRef.current.value = '';
    } else if (type === 'back') {
      setBackImage(null);
      setBackPreview('');
      if (backInputRef.current) backInputRef.current.value = '';
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
            Upload 1-3 body photos for AI-powered composition analysis with Nobel Prize-level Body Signature
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
          <h3 className="text-lg font-bold text-blue-900 mb-3">📸 Photo Guidelines for Accurate Body Analysis</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800 mb-4">
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
              <span>Plain background (wall or door)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Arms slightly away from body</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Neutral stance (don't flex)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">✓</span>
              <span>Multiple angles = more accurate</span>
            </div>
          </div>
          <div className="bg-white border border-blue-300 rounded-lg p-4">
            <p className="font-semibold text-blue-900 mb-2">👕 What to Wear:</p>
            <p className="text-sm text-blue-800">
              <strong>Men:</strong> Shirtless, shorts or fitted pants<br/>
              <strong>Women:</strong> Sports bra + fitted leggings or similar
            </p>
          </div>
        </div>

        {/* Upload Areas */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-2">Upload Body Photos</h3>
          <p className="text-sm text-gray-600 mb-6">
            Front photo required. Side and back photos are optional but improve accuracy.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Front Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Front View <span className="text-red-500">*</span>
              </label>
              {!frontPreview ? (
                <div
                  onClick={() => frontInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                >
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600 mb-1">Upload Front</p>
                  <p className="text-xs text-gray-500">JPG, PNG (10MB max)</p>
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
                    className="w-full h-[200px] object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage('front')}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Side Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Side View <span className="text-gray-400">(Optional)</span>
              </label>
              {!sidePreview ? (
                <div
                  onClick={() => sideInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                >
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600 mb-1">Upload Side</p>
                  <p className="text-xs text-gray-500">Better posture analysis</p>
                  <input
                    ref={sideInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'side')}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={sidePreview}
                    alt="Side preview"
                    className="w-full h-[200px] object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage('side')}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Back Photo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Back View <span className="text-gray-400">(Optional)</span>
              </label>
              {!backPreview ? (
                <div
                  onClick={() => backInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors min-h-[200px] flex flex-col items-center justify-center"
                >
                  <Camera className="w-12 h-12 text-gray-400 mb-2" />
                  <p className="text-sm font-medium text-gray-600 mb-1">Upload Back</p>
                  <p className="text-xs text-gray-500">Back muscle analysis</p>
                  <input
                    ref={backInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0], 'back')}
                    className="hidden"
                  />
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={backPreview}
                    alt="Back preview"
                    className="w-full h-[200px] object-cover rounded-lg border-2 border-gray-200"
                  />
                  <button
                    onClick={() => handleRemoveImage('back')}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
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
