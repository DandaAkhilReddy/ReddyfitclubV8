// AI Coach Access Control Hook
import { useAuth } from './useAuth';
import { useCallback } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, Collections } from '../lib/firebase';

interface AICoachAccess {
  hasAccess: boolean;
  isInTrial: boolean;
  daysRemaining: number;
  usageCount: number;
  usageLimit: number;
  usagePercentage: number;
  canUse: boolean;
  trialEndDate?: Date;
  recordUsage: () => Promise<void>;
  getPlanLimit: () => number;
}

export function useAICoachAccess(): AICoachAccess {
  const { user, userProfile, updateUserProfile } = useAuth();

  if (!userProfile) {
    return {
      hasAccess: false,
      isInTrial: false,
      daysRemaining: 0,
      usageCount: 0,
      usageLimit: 0,
      usagePercentage: 0,
      canUse: false,
      recordUsage: async () => {},
      getPlanLimit: () => 0,
    };
  }

  const now = new Date();

  // Check if user is in trial period
  const isInTrial =
    userProfile.aiCoachTrialEndDate &&
    now < userProfile.aiCoachTrialEndDate;

  // Calculate days remaining in trial
  const daysRemaining = isInTrial && userProfile.aiCoachTrialEndDate
    ? Math.ceil((userProfile.aiCoachTrialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Get usage limits based on subscription plan
  const getPlanLimit = (): number => {
    if (isInTrial) {
      return 999999; // Unlimited during trial
    }

    switch (userProfile.subscription) {
      case 'free':
        return 10; // 10 analyses per month
      case 'pro':
        return 100; // 100 analyses per month
      case 'club':
        return 999999; // Unlimited for club members
      default:
        return 10;
    }
  };

  const currentLimit = getPlanLimit();
  const usageCount = userProfile.aiCoachUsageCount || 0;
  const usagePercentage = (usageCount / currentLimit) * 100;
  const canUse = usageCount < currentLimit;

  // Record AI Coach usage (memoized to prevent stale closures)
  const recordUsage = useCallback(async () => {
    console.log('🔍 [recordUsage] Called with user:', user?.uid, 'profile:', userProfile?.uid);

    if (!user || !userProfile) {
      console.error('⚠️ [recordUsage] No user or userProfile');
      throw new Error('User not authenticated');
    }

    if (!userProfile.uid) {
      console.error('⚠️ [recordUsage] userProfile.uid is undefined', userProfile);
      throw new Error('User profile missing UID');
    }

    if (!canUse) {
      throw new Error('AI Coach usage limit reached. Please upgrade your plan.');
    }

    const newUsageCount = (userProfile.aiCoachUsageCount || 0) + 1;
    console.log('🔍 [recordUsage] Updating usage count to:', newUsageCount);

    // Update Firestore - use user.uid from Firebase Auth as fallback
    const userId = userProfile.uid || user.uid;
    await setDoc(
      doc(db, Collections.USERS, userId),
      {
        aiCoachUsageCount: newUsageCount,
      },
      { merge: true }
    );

    // Update local state
    await updateUserProfile({
      aiCoachUsageCount: newUsageCount,
    });

    console.log('✅ [recordUsage] Usage recorded successfully');
  }, [user, userProfile, canUse, updateUserProfile]);

  return {
    hasAccess: true,
    isInTrial: Boolean(isInTrial),
    daysRemaining,
    usageCount,
    usageLimit: currentLimit,
    usagePercentage,
    canUse,
    trialEndDate: userProfile.aiCoachTrialEndDate,
    recordUsage,
    getPlanLimit,
  };
}
