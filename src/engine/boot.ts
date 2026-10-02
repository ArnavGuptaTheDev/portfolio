// Inlined into <head> (bundled at build time) so the right sky and palette
// are in place before first paint. It uses yesterday's cached sun windows or
// the fixed table; the main bundle refines that and the change eases in.
import { computeState } from './engine';
import { fixedWindows } from './sun';
import { cachedWindows, realMinutes, urlMinutes } from './time';
import { rootStyle } from './vars';

try {
  const w = cachedWindows() ?? fixedWindows();
  const s = computeState(urlMinutes(location.search, w) ?? realMinutes(), w);
  const root = document.documentElement;
  root.style.cssText = rootStyle(s, innerWidth, innerHeight);
  root.dataset.phase = s.phase;
  root.classList.add('js');
} catch {
  // Leave the server-rendered daytime theme in place.
}
