export function calculateTrustScore(profile: any, modulesCompletedFromDb?: number) {
  const trainingScoreMax = 50;
  const backgroundScoreMax = 50;

  // 1. Training (max 50)
  const trainingModulesCount = modulesCompletedFromDb !== undefined 
    ? modulesCompletedFromDb 
    : (profile.training_modules_completed || 0);

  const totalModules = profile.training_modules_total || 8;
  const trainingScore = totalModules > 0 
    ? Math.min(Math.round((trainingModulesCount / totalModules) * trainingScoreMax), trainingScoreMax)
    : 0;

  // 2. Background Check (max 50)
  let backgroundScore = 0;
  const bgStatus = profile.background_check_status;
  if (bgStatus === 'verified' || bgStatus === 'completed') {
    backgroundScore = 50;
  } else if (bgStatus === 'pending_verification' || bgStatus === 'pending') {
    backgroundScore = 10;
  }

  const breakdown = {
    background: backgroundScore,
    training: trainingScore,
  };

  const total = breakdown.background + breakdown.training;

  let tier = 'bronze';
  if (total >= 80) tier = 'platinum';
  else if (total >= 60) tier = 'gold';
  else if (total >= 40) tier = 'silver';

  return { total, tier, breakdown };
}
