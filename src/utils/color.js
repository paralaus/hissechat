export const USER_COLORS = [
  'red.500',
  'orange.500',
  'yellow.500',
  'green.500',
  'teal.500',
  'blue.500',
  'cyan.500',
  'purple.500',
  'pink.500',
];

export const getUserColor = (userId) => {
  if (!userId) return 'blue.500';
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};
