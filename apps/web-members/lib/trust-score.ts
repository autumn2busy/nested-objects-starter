export function calculateTrustScore(profile: any, modulesCompletedFromDb?: number) {
  const profileScoreMax = 20;
  const trainingScoreMax = 40;
  const backgroundScoreMax = 25;
  const identityScoreMax = 15;

  // 1. Profile Completeness (max 20)
  let profileCompleteness = 0;
  if (profile.avatar_url) profileCompleteness += 4;
  if (profile.headline) profileCompleteness += 4;
  if (profile.bio) profileCompleteness += 4;
  if (profile.city && profile.state) profileCompleteness += 3;
  if (profile.primary_services) profileCompleteness += 3;

  // Phone check if any points are missing
  if (profile.phone_verified && profileCompleteness < profileScoreMax) {
    profileCompleteness = Math.min(profileCompleteness + 5, profileScoreMax);
  }

  // 2. Training (max 40)
  const trainingModulesCount = modulesCompletedFromDb !== undefined 
    ? modulesCompletedFromDb 
    : (profile.training_modules_completed || 0);
  const trainingScore = Math.min(trainingModulesCount * 5, trainingScoreMax);

  // 3. Background Check (max 25)
  let backgroundScore = 0;
  const bgStatus = profile.background_check_status;
  if (bgStatus === 'verified' || bgStatus === 'completed') {
    backgroundScore = 25;
  } else if (bgStatus === 'pending_verification' || bgStatus === 'pending') {
    backgroundScore = 5;
  }

  // 4. Identity Verified (max 15)
  let identityScore = 0;
  if (profile.identity_verified) {
    identityScore = 15;
  }

  const breakdown = {
    background: backgroundScore,
    training: trainingScore,
    profile: profileCompleteness,
    identity: identityScore,
  };

  const total = breakdown.background + breakdown.training + breakdown.profile + breakdown.identity;

  let tier = 'bronze';
  if (total >= 80) tier = 'platinum';
  else if (total >= 60) tier = 'gold';
  else if (total >= 40) tier = 'silver';

  return { total, tier, breakdown };
}
