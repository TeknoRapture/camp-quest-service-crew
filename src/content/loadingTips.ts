export const loadingTips = [
  'Checking who borrowed the mop…',
  'Asking Gweg annoying questions…',
  'Declogging toilets with dynamite…',
  'Counting suspicious raccoons…',
  'Looking for the green mop in the wrong building…',
  'Pretending the bridge is totally safe…',
] as const;

export function chooseLoadingTip() {
  return loadingTips[Math.floor(Math.random() * loadingTips.length)];
}
