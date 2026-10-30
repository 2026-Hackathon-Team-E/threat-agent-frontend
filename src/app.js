// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
import { REFRESH_MS, USE_FIXTURE } from './config.js';
import { getImpacts, getCards, getCard } from './api.js';
import { renderSummary, renderImpacts, renderDetail, renderCards, renderCardDetail } from './render.js';
let impacts = [], cards = [], selectedImpact = null, pending = false, timer = null;
const statusEl = document.querySelector('#conn');
const noticeEl = document.querySelector('#notice');
function notice(text, error = false) { noticeEl.textContent = text; noticeEl.className = error ? 'notice error' : 'notice'; }
function connection(ok) { statusEl.className = `connection ${ok ? 'online' : 'offline'}`; statusEl.textContent = ok ? (USE_FIXTURE ? 'Fixture 모드' : '연결됨') : '백엔드 연결 끊김'; }
async function refresh() {
  if (pending || document.hidden) return;
  pending = true;
  try {
    const [nextImpacts, nextCards] = await Promise.all([getImpacts(), getCards()]);
    impacts = nextImpacts; cards = nextCards;
    if (!selectedImpact || !impacts.some(i => i.id === selectedImpact)) selectedImpact = impacts[0]?.id || null;
    renderSummary(impacts, cards); renderImpacts(impacts, selectedImpact);
    renderDetail(impacts.find(i => i.id === selectedImpact)); renderCards(cards);
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
  renderImpacts(impacts, selectedImpact); renderDetail(impacts.find(i => i.id === selectedImpact));
});
document.querySelector('#cards').addEventListener('click', async event => {
  const item = event.target.closest('[data-card]'); if (!item) return;
  const target = document.querySelector('#card-detail'); target.textContent = '상세 정보 불러오는 중…';
  try { const base = cards.find(c => c.key === item.dataset.card) || {}; renderCardDetail({ ...base, ...(await getCard(item.dataset.card)) }); } catch (error) { target.textContent = `상세 조회 실패: ${error.message}`; }
});
renderSummary([]); document.querySelector('#impacts').textContent = '불러오는 중…'; document.querySelector('#cards').textContent = '불러오는 중…';
refresh(); start();
