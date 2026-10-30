// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
import { REFRESH_MS, USE_FIXTURE } from './config.js';
import { getImpacts, getCards, getCard } from './api.js';
import { renderSummary, renderImpacts, renderDetail, renderCards, renderCardDetail, markSeen } from './render.js';
let impacts = [], cards = [], selectedImpact = null, pending = false, timer = null;
const statusEl = document.querySelector('#conn');
const noticeEl = document.querySelector('#notice');
function notice(text, error = false) { noticeEl.textContent = text; noticeEl.className = error ? 'notice error' : 'notice'; }
function connection(ok) { statusEl.className = `connection ${ok ? 'online' : 'offline'}`; statusEl.textContent = ok ? (USE_FIXTURE ? 'Fixture 모드' : '연결됨') : '백엔드 연결 끊김'; }
const impactCardCache = new Map();
let impactDetailRequest = 0;
async function showImpactDetail() {
  const requestId = ++impactDetailRequest;
  const impact = impacts.find(i => i.id === selectedImpact);
  if (!impact) { renderDetail(null); return; }
  const base = cards.find(c => c.key === impact.card) || {};
  const cached = impactCardCache.get(impact.card);
  if (cached && cached.version === base.version) {
    renderDetail(impact, { ...base, ...cached.card });
    return;
  }
  renderDetail(impact, null, 'loading');
  try {
    const card = await getCard(impact.card);
    if (card.key !== impact.card) throw new Error('연결된 위협 정보를 찾을 수 없습니다.');
    impactCardCache.set(impact.card, { version: base.version, card });
    if (requestId === impactDetailRequest) renderDetail(impact, { ...base, ...card });
  } catch (error) {
    if (requestId === impactDetailRequest) renderDetail(impact, null, 'error');
  }
}
async function refresh() {
  if (pending || document.hidden) return;
  pending = true;
  try {
    const [nextImpacts, nextCards] = await Promise.all([getImpacts(), getCards()]);
    impacts = nextImpacts; cards = nextCards;
    if (!selectedImpact || !impacts.some(i => i.id === selectedImpact)) selectedImpact = impacts[0]?.id || null;
    renderSummary(impacts, cards); renderImpacts(impacts, selectedImpact);
    showImpactDetail(); renderCards(cards);
    connection(true);
    document.querySelector('#updated').textContent = `마지막 갱신: ${new Date().toLocaleTimeString('ko-KR')}`;
  } catch (error) {
    connection(false); notice(`데이터를 불러오지 못했습니다. ${error.message}`, true);
  } finally { pending = false; }
}
function start() { if (!timer) timer = setInterval(refresh, REFRESH_MS); }
function stop() { if (timer) clearInterval(timer); timer = null; }
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else { refresh(); start(); } });
document.querySelector('#impacts').addEventListener('click', event => {
  const item = event.target.closest('[data-impact]'); if (!item) return;
  selectedImpact = item.dataset.impact;
  renderImpacts(impacts, selectedImpact); showImpactDetail();
});
let cardDetailRequest = 0;
async function showThreatDetail(key, navigate = false) {
  const requestId = ++cardDetailRequest;
  if (navigate) location.hash = 'p2';
  const target = document.querySelector('#card-detail'); target.textContent = '상세 정보 불러오는 중…';
  if (navigate) requestAnimationFrame(() => target.scrollIntoView({ block: 'start' }));
  try {
    const base = cards.find(c => c.key === key) || {};
    const card = await getCard(key);
    if (card.key !== key) throw new Error('연결된 위협 정보를 찾을 수 없습니다.');
    if (requestId !== cardDetailRequest) return;
    markSeen(key);
    renderCards(cards);
    renderCardDetail({ ...base, ...card });
    if (navigate) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'start' });
    }
  } catch (error) {
    if (requestId === cardDetailRequest) target.textContent = `상세 조회 실패: ${error.message}`;
  }
}
document.querySelector('#cards').addEventListener('click', event => {
  const item = event.target.closest('[data-card]'); if (!item) return;
  showThreatDetail(item.dataset.card);
});
document.querySelector('#detail').addEventListener('click', event => {
  const article = event.target.closest('[data-related-card]');
  if (article) {
    event.preventDefault();
    showThreatDetail(article.dataset.relatedCard, true);
  }
  if (event.target.closest('[data-retry-impact]')) showImpactDetail();
});
renderSummary([]); document.querySelector('#impacts').textContent = '불러오는 중…'; document.querySelector('#cards').textContent = '불러오는 중…';
refresh(); start();
