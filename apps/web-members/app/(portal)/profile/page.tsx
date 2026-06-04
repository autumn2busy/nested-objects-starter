import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import { calculateTrustScore } from '@/lib/trust-score'
import ProfileView from './ProfileView'

export const dynamic = 'force-dynamic'

function resolveUserId(outsetaUser: any) {
  return (
    getOutsetaUserId(outsetaUser) ||
    outsetaUser?.Uid ||
    outsetaUser?.uid ||
    outsetaUser?.Id ||
    outsetaUser?.id ||
    outsetaUser?.UserAccountUid ||
    null
  )
}

export default async function ProfilePage() {
  let initialProfile = null;
  let initialTrustStats = null;

  try {
    const outsetaUser = await getCurrentUser();
    if (outsetaUser) {
        const userId = resolveUserId(outsetaUser);
        const supabase = createServiceRoleClient();
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .or(`outseta_person_uid.eq.${userId},user_id.eq.${userId}`)
          .limit(1)
          .single();

        if (profile) {
            // Guarantee fresh trust score adherence
            const live = calculateTrustScore(profile, profile.training_modules_completed || 0);

            initialProfile = {
              ...profile,
              // Required for hydration sync with client data type
              trust_score: live.total,
              trust_tier: live.tier,
              trust_score_breakdown: live.breakdown,
            };
            initialTrustStats = {
                trustScore: live.total,
                trustTier: live.tier,
                trustScoreBreakdown: live.breakdown,
                backgroundCheckStatus: profile.background_check_status || 'not_started'
            };
        }
    }
  } catch (err) {
      console.error("[Profile SSR Error]", err);
  }

  return <ProfileView initialProfile={initialProfile} initialTrustStats={initialTrustStats} />
}
