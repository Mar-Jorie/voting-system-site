// Progress calculation utilities

export const calculateProgress = (current, total) => {
  if (total === 0) return 0;
  return Math.round((current / total) * 100);
};

export const calculatePercentage = (value, max) => {
  if (max === 0) return 0;
  return Math.round((value / max) * 100);
};

export const formatProgress = (progress) => {
  return `${progress}%`;
};

export const getProgressColor = (progress) => {
  if (progress >= 80) return 'text-green-600';
  if (progress >= 60) return 'text-blue-600';
  if (progress >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

export const getProgressBarColor = (progress) => {
  if (progress >= 80) return 'bg-green-600';
  if (progress >= 60) return 'bg-blue-600';
  if (progress >= 40) return 'bg-yellow-600';
  return 'bg-red-600';
};
