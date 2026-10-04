export const formatClock = (totalSeconds: number) => `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
export const shouldAutoExpel = (yellowCardCount: number) => yellowCardCount >= 2;
export const retryDelay = (attempts: number) => Math.min(300000, 2000 * (2 ** attempts));
