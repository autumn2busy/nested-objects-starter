import { getCurrentUser, getOutsetaUserId } from '@/lib/auth-server'
import { createServiceRoleClient } from '@/lib/supabase-server'
import ProfileView from './ProfileView'

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
            initialProfile = {
              ...profile,
              // Required for hydration sync with client data type
              trust_score: profile.trust_score || 0,
              trust_tier: profile.trust_tier || 'bronze',
              trust_score_breakdown: profile.trust_score_breakdown || null,
            };
            initialTrustStats = {
                trustScore: profile.trust_score || 0,
                trustTier: profile.trust_tier || 'bronze',
                trustScoreBreakdown: profile.trust_score_breakdown || null,
                backgroundCheckStatus: profile.background_check_status || 'not_started'
            };
        }
    }
  } catch (err) {
      console.error("[Profile SSR Error]", err);
  }

  return <ProfileView initialProfile={initialProfile} initialTrustStats={initialTrustStats} />
}
