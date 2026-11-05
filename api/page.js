/* Link previews for profile links.
   WhatsApp, iMessage, X and others don't run the site's JavaScript, so a shared link like
   tenbars.vercel.app/@asha would otherwise only ever show the generic Tenbars card.
   This function sends the normal page, but with the title, description and picture filled
   in for that person (and that series, for /@asha/show/169 links).
   It only reads things that are already public, and if anything goes wrong it sends the
   page unchanged, so the site itself never depends on it. */

const PROJECT = 'episodic-917d6';
const FIRESTORE = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/`;
const LEVELS = [{ n: 1, name: 'Pilot', at: 5 }, { n: 2, name: 'Regular', at: 20 }, { n: 3, name: 'Binger', at: 50 }, { n: 4, name: 'Critic', at: 100 }, { n: 5, name: 'Showrunner', at: 200 }];
const WORDS = ['', 'Awful', 'Bad', 'Poor', 'Meh', 'Okay', 'Decent', 'Good', 'Great', 'Superb', 'Perfect'];

const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const one = n => (Math.round(n * 10) / 10).toFixed(1);
const plural = (n, w) => `${n} ${n === 1 ? w : w === 'series' ? w : w + 's'}`;

/* Firestore's REST format wraps every value, e.g. { stringValue: 'x' }. Unwrap it. */
function val(f) {
  if (!f || typeof f !== 'object') return undefined;
  if ('stringValue' in f) return f.stringValue;
  if ('integerValue' in f) return Number(f.integerValue);
  if ('doubleValue' in f) return f.doubleValue;
  if ('booleanValue' in f) return f.booleanValue;
  if ('nullValue' in f) return null;
  if ('mapValue' in f) return unwrap(f.mapValue.fields || {});
  if ('arrayValue' in f) return (f.arrayValue.values || []).map(val);
  return undefined;
}
const unwrap = fields => Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, val(v)]));

async function getJSON(fetchImpl, url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 2500);
  try {
    const r = await fetchImpl(url, { signal: ctl.signal });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; }
  finally { clearTimeout(t); }
}
const getDoc = async (f, path) => { const j = await getJSON(f, FIRESTORE + path); return j && j.fields ? unwrap(j.fields) : null; };

function levelOf(count) { let cur = null; for (const l of LEVELS) if (count >= l.at) cur = l; return cur; }
const bigPoster = url => url ? url.replace('/medium_portrait/', '/original_untouched/') : url;

/* Work out the preview for a path like "asha" or "asha/show/169/season/2". */
async function previewFor(rest, origin, fetchImpl) {
  const m = /^([a-z0-9_]{3,20})(?:\/show\/(\d+))?/i.exec(rest || '');
  if (!m) return null;
  const name = m[1].toLowerCase(), showId = m[2];
  const url = `${origin}/@${name}${showId ? '/show/' + showId : ''}`;
  const generic = { title: `@${name} on Tenbars`, description: 'Score every episode you watch, out of 10.', url, image: `${origin}/og.png`, large: true };

  const u = await getDoc(fetchImpl, `usernames/${name}`);
  if (!u || !u.uid) return generic;
  const prof = await getDoc(fetchImpl, `profiles/${u.uid}`); // private profiles can't be read, so they stay generic
  if (!prof || !prof.public) return generic;
  const display = prof.name || prof.username || name;
  const first = display.split(' ')[0];

  if (!showId) {
    const st = prof.stats || {};
    const lvl = levelOf(st.episodes || 0);
    const description = st.episodes
      ? `${first} has scored ${plural(st.episodes, 'episode')} across ${plural(st.series || 0, 'series')}, averaging ${one(st.avg || 0)}.${lvl ? ` Level ${lvl.n}, ${lvl.name}.` : ''}`
      : `See what ${first} is watching and how they score it, episode by episode.`;
    return { ...generic, title: `${display} (@${prof.username || name}) on Tenbars`, description };
  }

  const rec = await getDoc(fetchImpl, `users/${u.uid}/shows/${showId}`);
  let showName = rec && rec.name, poster = rec && rec.image;
  if (!showName) {
    const s = await getJSON(fetchImpl, `https://api.tvmaze.com/shows/${showId}`);
    if (s) { showName = s.name; poster = s.image && (s.image.original || s.image.medium); }
  }
  if (!showName) return generic;
  const eps = rec && rec.episodes ? Object.values(rec.episodes).filter(e => e && e.r) : [];
  const parts = [];
  if (rec && rec.showRating) parts.push(`${first} gave ${showName} ${rec.showRating}/10 (${WORDS[rec.showRating]})`);
  if (eps.length) parts.push(`${parts.length ? 'and' : `${first} has`} scored ${plural(eps.length, 'episode')}, averaging ${one(eps.reduce((a, e) => a + e.r, 0) / eps.length)}`);
  const description = parts.length ? parts.join(' ') + '. See every score, episode by episode.' : `See how ${first} scores ${showName}, episode by episode.`;
  return { title: `${first}’s scores for ${showName} | Tenbars`, description, url, image: bigPoster(poster) || `${origin}/og.png`, large: !poster };
}

function metaBlock(p) {
  return `<!--meta:start-->
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<link rel="canonical" href="${esc(p.url)}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.description)}">
<meta property="og:url" content="${esc(p.url)}">
<meta property="og:image" content="${esc(p.image)}">
${p.large ? '<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n' : ''}<meta name="twitter:card" content="${p.large ? 'summary_large_image' : 'summary'}">
<meta name="twitter:title" content="${esc(p.title)}">
<meta name="twitter:description" content="${esc(p.description)}">
<meta name="twitter:image" content="${esc(p.image)}">
<!--meta:end-->`;
}

async function render(rest, origin, fetchImpl) {
  const r = await fetchImpl(`${origin}/index.html`);
  if (!r.ok) throw new Error('index ' + r.status);
  let html = await r.text();
  try {
    const p = await previewFor(rest, origin, fetchImpl);
    if (p) html = html.replace(/<!--meta:start-->[\s\S]*?<!--meta:end-->/, metaBlock(p));
  } catch (e) { /* keep the generic preview */ }
  return html;
}

async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const origin = `https://${host}`;
  const q = new URL(req.url, origin).searchParams;
  const rest = (q.get('p') || '').replace(/^\/+/, '');
  try {
    const html = await render(rest, origin, fetch);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=3600');
    res.statusCode = 200;
    res.end(html);
  } catch (e) {
    // Couldn't build the page: send people to the app, which still understands this address.
    res.statusCode = 302;
    res.setHeader('Location', `/#/u/${rest.replace(/[^a-z0-9_/]/gi, '')}`);
    res.end();
  }
}

module.exports = handler;
module.exports.previewFor = previewFor;
module.exports.render = render;
