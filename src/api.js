// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
import { API_BASE, USE_FIXTURE } from './config.js';
async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = new Error(response.status === 404 ? 'KEV에 없는 CVE이거나 대상을 찾을 수 없습니다.' : `요청 실패 (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}
export const getImpacts = () => request(USE_FIXTURE ? './tests/fixtures/impacts.json' : `${API_BASE}/impacts`);
export const getCards = () => request(USE_FIXTURE ? './tests/fixtures/cards.json' : `${API_BASE}/cards`);
export const getCard = key => request(USE_FIXTURE ? './tests/fixtures/card-detail.json' : `${API_BASE}/cards/${encodeURIComponent(key)}`);
export async function replayCve(cve) {
  if (USE_FIXTURE) return { queued: cve, fixture: true };
  return request(`${API_BASE}/replay/${encodeURIComponent(cve)}`, { method: 'POST' });
}
