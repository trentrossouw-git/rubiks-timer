export const formatTime = (time) => {
  if (time === Infinity || time === null) return '0.00';
  const milliseconds = Math.floor((time % 1000) / 10);
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);

  const mStr = minutes > 0 ? `${minutes}:` : '';
  const sStr = minutes > 0 && seconds < 10 ? `0${seconds}.` : `${seconds}.`;
  const msStr = milliseconds < 10 ? `0${milliseconds}` : `${milliseconds}`;

  return `${mStr}${sStr}${msStr}`;
};
