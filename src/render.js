// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const badge = value => `<span class="badge ${value === '긴급' ? 'critical' : value === '높음' ? 'high' : ''}">${esc(value)}</span>`;
export function renderSummary(impacts, cards = []) {
  const tierCount = tier => impacts.filter(i => i.priority?.tier === tier).length;
  const urgent = tierCount('긴급');
  const review = tierCount('높음');
  const minor = tierCount('보통');
  const total = impacts.length;
  const done = impacts.filter(i => i.status === '수정 완료').length;
  const proposed = impacts.filter(i => i.status === '수정 제안').length;
  const verified = impacts.filter(i => i.rescan === 0).length;
  const cveCount = cards.filter(c => c.key.startsWith('CVE-')).length;
  const kevCount = cards.filter(c => c.kev).length;
  const newsCount = cards.filter(c => c.key.startsWith('NEWS:')).length;
  const pct = total ? Math.round((urgent / total) * 100) : 0;
  const pct2 = total ? Math.round(((urgent + review) / total) * 100) : 0;
  const donutBg = total
    ? `conic-gradient(#c0392b 0 ${pct}%, #d4833a ${pct}% ${pct2}%, #c5c7cb ${pct2}% 100%)`
    : 'conic-gradient(#e5e5ea 0 100%)';
  const donePct = total ? Math.round((done / total) * 100) : 0;
  const proposedPct = total ? Math.round((proposed / total) * 100) : 0;
  document.querySelector('#summary').innerHTML = `
    <div class="stage-grid">
      <article class="stage-card">
        <div class="stage-head"><h2>수집</h2><span>01</span></div>
        <div class="stage-body">
          <strong class="stage-value">${cards.length}</strong>
          <div class="stage-icon"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#42474e" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M3 13.5 5.5 5h13L21 13.5V19H3z"/><path d="M3 13.5h5l1.5 2h5l1.5-2h5"/></svg><span>CVE · KEV</span></div>
        </div>
        <div class="stage-tags">
          <span class="tag">CVE ${cveCount}</span>
          <span class="tag">KEV ${kevCount}</span>
          <span class="tag tag-bold">뉴스 ${newsCount}</span>
        </div>
        <p class="stage-foot">위협 카드 ${cards.length}건</p>
      </article>

      <article class="stage-card">
        <div class="stage-head"><h2>영향 판단</h2><span>02</span></div>
        <div class="donut-row">
          <div class="donut" style="background:${donutBg}" aria-label="총 ${total}건: 우선 확인 ${urgent}건, 검토 필요 ${review}건, 영향 없음 ${minor}건">
            <div class="donut-hole"><strong>${total}</strong><span>건</span></div>
          </div>
          <ul class="legend">
            <li><i style="background:#c0392b"></i><span>우선 확인</span><b style="color:#c0392b">${urgent}</b></li>
            <li><i style="background:#d4833a"></i><span>검토 필요</span><b style="color:#d4833a">${review}</b></li>
            <li><i style="background:#c5c7cb"></i><span>영향 없음</span><b>${minor}</b></li>
          </ul>
        </div>
        <p class="stage-foot">우선 확인 ${urgent}건 · 검토 필요 ${review}건 · 영향 없음 ${minor}건</p>
      </article>

      <article class="stage-card">
        <div class="stage-head"><h2>수정</h2><span>03</span></div>
        <strong class="stage-value big">${done}/${total}</strong>
        <div class="bar-row"><span>완료</span><b>${done}</b></div>
        <div class="bar"><i style="width:${donePct}%"></i></div>
        <div class="bar-row muted"><span>제안</span><b>${proposed}</b></div>
        <div class="bar muted-bar"><i style="width:${proposedPct}%"></i></div>
        <p class="stage-foot">완료 ${done} · 제안 ${proposed}</p>
      </article>

      <article class="stage-card">
        <div class="stage-head"><h2>검증</h2><span>04</span></div>
        <strong class="stage-value">${verified}</strong>
        <div class="verify-steps">
          <div class="vstep"><span class="vicon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg></span><small>스캔</small></div>
          <span class="vline"></span>
          <div class="vstep done"><span class="vicon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg></span><small>완료</small></div>
        </div>
        <div class="verify-note"><span>재스캔 완료 · 결과 기록됨</span><b>${verified}건</b></div>
        <p class="stage-foot">재스캔 완료 ${verified}건</p>
      </article>
    </div>`;
  document.querySelector('#count-impacts').textContent = impacts.length;
  document.querySelector('#count-cards').textContent = cards.length;
}

export function renderImpacts(impacts, selected) {
  const el = document.querySelector('#impacts');
  if (!impacts.length) { el.innerHTML = '<p class="empty">아직 영향 카드가 없습니다.</p>'; return; }
  el.innerHTML = impacts.map(i => `<button class="item ${selected === i.id ? 'selected' : ''}" data-impact="${esc(i.id)}"><span class="item-top"><b>${esc(i.service)}</b>${badge(i.priority?.tier)}</span><span>${esc(i.dep)}</span><small>${esc(i.installed)} → ${esc(i.fixed || '확인 필요')} · ${esc(i.status)}</small></button>`).join('');
}
export function renderDetail(impact, card = null, articleState = 'ready') {
  const el = document.querySelector('#detail');
  if (!impact) { el.innerHTML = '<p class="empty">영향 카드를 선택하면 근거와 수정 내역이 표시됩니다.</p>'; return; }
  const lines = (impact.remediation?.diff || '').split('\n').filter(Boolean);
  const diff = lines.map(line => `<div class="diff-line ${line.startsWith('+') && !line.startsWith('+++') ? 'add' : line.startsWith('-') && !line.startsWith('---') ? 'remove' : ''}">${esc(line)}</div>`).join('');
  el.innerHTML = `<h3>${esc(impact.service)}</h3><p>${esc(impact.title)}</p><div class="tags">${badge(impact.priority?.tier)} ${badge(impact.status)}</div>${renderImpactArticle(impact, card, articleState)}<h4>판단 근거</h4><ul>${(impact.priority?.reasons || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul><h4>수정 내용</h4><p>${esc(impact.remediation?.text || '수정 제안 없음')} <small>(${esc(impact.remediation?.kind || 'manual')})</small></p><h4>변경 사항 (diff)</h4>${diff ? `<pre class="diff">${diff}</pre>` : '<p class="muted">표시할 diff가 없습니다.</p>'}<h4>재스캔</h4><p class="rescan">${impact.rescan === null || impact.rescan === undefined ? '아직 재스캔하지 않았습니다.' : `재스캔 ${esc(impact.rescan)}건`}</p>`;
}
function renderImpactArticle(impact, card, state) {
  const match = `<p class="impact-match"><strong>서비스 영향 근거</strong><br>${esc(impact.service)}의 ${esc(impact.dep)} ${esc(impact.installed)} 버전이 ${esc(impact.card)}의 취약 버전 범위에 해당합니다. 탐지 당시 버전 기준입니다.</p>`;
  let content;
  if (state === 'loading') content = '<p class="muted" role="status">관련 위협 설명을 불러오는 중…</p>';
  else if (state === 'error') content = '<p role="status">관련 위협 설명을 불러오지 못했습니다.</p><button type="button" class="article-retry" data-retry-impact>다시 불러오기</button>';
  else if (!card) content = '<p class="muted">연결된 위협 설명이 없습니다.</p>';
  else {
    const description = card.description_ko || plainText(card.summary);
    content = `<a href="#p2" class="impact-article impact-article-link" data-related-card="${esc(card.key)}"><span class="detail-label">관련 기사 · 보안 권고</span><h5>${esc(card.headline_ko || card.title || impact.title || impact.card)}</h5><span class="detail-id">${esc(card.key)}</span>${card.description_ko ? '<span class="detail-label">한국어 요약 (자동 번역)</span>' : ''}<p class="impact-description">${esc(description || '수집된 자료에 취약점의 상세 원인이 제공되지 않았습니다.')}</p><p class="impact-source">출처: ${esc((card.sources || []).join(', ') || '출처 정보 없음')}</p></a>`;
  }
  return `<section class="impact-context" aria-label="취약점 원인 및 관련 자료"><h4>취약점 원인 및 관련 자료</h4>${match}${content}</section>`;
}
const RISK_CLASS = { 긴급: 'critical', 높음: 'high', 보통: 'normal' };
function headlineOf(c) {
  if (c.key.startsWith('NEWS:') && c.headline_ko) return c.headline_ko;
  return c.summary_ko || c.title || '';
}
const CATEGORIES = [
  { id: 'news', title: '뉴스', test: c => c.key.startsWith('NEWS:') },
  { id: 'cve', title: 'CVE 취약점 발견', test: c => c.key.startsWith('CVE-') },
  { id: 'advisory', title: '보안 이슈', test: c => !c.key.startsWith('CVE-') && !c.key.startsWith('NEWS:') },
];
function cardHtml(c) {
  const risk = c.risk_label || '보통';
  const products = c.products?.length ? esc(c.products.join(', ')) : '확인 전';
  const services = c.affected_services?.length ? esc(c.affected_services.join(', ')) : '없음';
  const epss = c.epss_percent == null ? '-' : `${c.epss_percent}%`;
  return `<button class="threat ${RISK_CLASS[risk] || 'normal'}" data-card="${esc(c.key)}">
    <span class="threat-top"><span class="risk-chip">${esc(risk)}</span><span class="threat-tags">${isNew(c.key) ? '<span class="new-badge">NEW</span>' : ''}<span class="status-chip">${esc(c.status)}</span></span></span>
    <strong class="threat-summary">${esc(headlineOf(c))}</strong>
    ${c.description_ko ? `<p class="threat-desc">${esc(c.description_ko)}</p>` : ''}
    <span class="threat-cve">${esc(c.key.startsWith('NEWS:') ? '뉴스 기사' : c.key)}</span>
    <dl class="threat-facts">
      <div><dt>대상</dt><dd>${products}</dd></div>
      <div><dt>우리 서비스</dt><dd>${services}</dd></div>
      <div><dt>악용 가능성</dt><dd>${esc(epss)}${c.kev ? ' · 실제 악용 확인' : ''}</dd></div>
    </dl>
  </button>`;
}
const SCOPES = [
  { id: 'impact', label: '우리 서비스 영향' },
  { id: 'all', label: '전체' },
  { id: 'other', label: '기타' },
];
const CAT_FILTERS = [
  { id: 'all', label: '전부' },
  { id: 'news', label: '뉴스' },
  { id: 'cve', label: 'CVE' },
  { id: 'advisory', label: '보안 이슈' },
];
const RISK_FILTERS = [
  { id: 'all', label: '전체 등급' },
  { id: '긴급', label: '긴급' },
  { id: '높음', label: '높음' },
  { id: '보통', label: '보통' },
];
const threatState = { scope: 'impact', category: 'all', risk: 'all' };
let lastCards = [];
const inScope = c => {
  const hit = (c.affected_services || []).length > 0;
  if (threatState.scope === 'impact') return hit;
  if (threatState.scope === 'other') return !hit;
  return true;
};
const inCategory = c => threatState.category === 'all' || CATEGORIES.find(x => x.id === threatState.category)?.test(c);
const inRisk = c => threatState.risk === 'all' || (c.risk_label || '보통') === threatState.risk;
function renderControls() {
  const el = document.querySelector('#filters');
  const scopeCount = id => lastCards.filter(c => { const hit = (c.affected_services || []).length > 0; return id === 'impact' ? hit : id === 'other' ? !hit : true; }).length;
  const catCount = id => lastCards.filter(c => inScope(c) && inRisk(c) && (id === 'all' || CATEGORIES.find(x => x.id === id)?.test(c))).length;
  const riskCount = id => lastCards.filter(c => inScope(c) && inCategory(c) && (id === 'all' || (c.risk_label || '보통') === id)).length;
  el.innerHTML = `<div class="filter-row">${SCOPES.map(s => `<button class="scope-btn ${threatState.scope === s.id ? 'active' : ''}" data-scope="${s.id}">${s.label}<span>${scopeCount(s.id)}</span></button>`).join('')}</div>
    <div class="filter-row sub">${CAT_FILTERS.map(f => `<button class="cat-btn ${threatState.category === f.id ? 'active' : ''}" data-cat="${f.id}">${f.label}<span>${catCount(f.id)}</span></button>`).join('')}</div>
    <div class="filter-row sub">${RISK_FILTERS.map(f => `<button class="risk-btn ${threatState.risk === f.id ? 'active' : ''}" data-risk="${f.id}">${f.label}<span>${riskCount(f.id)}</span></button>`).join('')}</div>`;
}
const SEEN_KEY = 'seenThreatKeys';
let seenKeys = null;
function loadSeen() {
  if (seenKeys) return seenKeys;
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    seenKeys = raw === null ? null : new Set(JSON.parse(raw));
  } catch (e) {
    seenKeys = null;
  }
  return seenKeys;
}
function saveSeen() {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...seenKeys])); } catch (e) { /* 저장 실패는 무시 */ }
}
function isNew(key) {
  return seenKeys !== null && !seenKeys.has(key);
}
export function markSeen(key) {
  if (!seenKeys) return;
  seenKeys.add(key);
  saveSeen();
}
function renderList() {
  const el = document.querySelector('#cards');
  const items = lastCards.filter(c => inScope(c) && inCategory(c) && inRisk(c));
  if (!items.length) {
    el.innerHTML = `<p class="empty">${threatState.scope === 'impact' ? '우리 서비스에 영향을 주는 카드가 아직 없습니다.' : '표시할 카드가 없습니다.'}</p>`;
    return;
  }
  // 새로 들어온 카드(NEW)는 맨 위에 모으고, 나머지는 구획별로 보여 준다
  const fresh = items.filter(c => isNew(c.key));
  const rest = items.filter(c => !isNew(c.key));
  const freshHtml = fresh.length
    ? `<section class="category new-section"><h3 class="category-title">새로 들어온 카드<span>${fresh.length}</span></h3><div class="category-grid">${fresh.map(cardHtml).join('')}</div></section>`
    : '';
  const restHtml = CATEGORIES.map(cat => {
    const group = rest.filter(cat.test);
    if (!group.length) return '';
    return `<section class="category"><h3 class="category-title">${cat.title}<span>${group.length}</span></h3><div class="category-grid">${group.map(cardHtml).join('')}</div></section>`;
  }).join('');
  el.innerHTML = freshHtml + restHtml;
}
export function renderCards(cards) {
  lastCards = cards;
  if (loadSeen() === null) {
    seenKeys = new Set(cards.map(c => c.key));
    saveSeen();
  }
  renderControls();
  renderList();
}
document.querySelector('#filters')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-scope],[data-cat],[data-risk]');
  if (!btn) return;
  if (btn.dataset.scope) threatState.scope = btn.dataset.scope;
  if (btn.dataset.cat) threatState.category = btn.dataset.cat;
  if (btn.dataset.risk) threatState.risk = btn.dataset.risk;
  renderControls();
  renderList();
});
function plainText(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
}
export function renderCardDetail(card) {
  const el = document.querySelector('#card-detail');
  if (!card) { el.innerHTML = '<p class="muted">위협 카드를 선택해 상세 정보를 확인하세요.</p>'; return; }
  const category = (CATEGORIES.find(c => c.test(card)) || CATEGORIES[1]).title;
  const text = plainText(card.summary);
  const short = text.length > 400 ? `${text.slice(0, 400)}…` : text;
  const products = (card.affected || []).map(a => a.name.split(':').pop()).filter((v, i, arr) => arr.indexOf(v) === i);
  const identifier = card.key.startsWith('NEWS:') ? '뉴스 기사' : card.key;
  el.innerHTML = `<div class="detail-head">
      <span class="detail-category">${esc(category)}</span>
      <span class="detail-id">${esc(identifier)}</span>
    </div>
    <h3 class="detail-title">${esc(headlineOf(card))}</h3>
    <dl class="detail-facts">
      <div><dt>위험 등급</dt><dd>${esc(card.risk_label || '보통')}</dd></div>
      <div><dt>상태</dt><dd>${esc(card.status)}</dd></div>
      <div><dt>대상 제품</dt><dd>${esc(products.join(', ') || '확인 전')}</dd></div>
      <div><dt>우리 서비스</dt><dd>${esc((card.affected_services || []).join(', ') || '영향 없음')}</dd></div>
      <div><dt>출처</dt><dd>${esc((card.sources || []).join(', ') || '-')}</dd></div>
    </dl>
    ${card.description_ko ? `<div class="detail-ko"><span class="detail-label">한국어 요약 (자동 번역)</span><p>${esc(card.description_ko)}</p></div>` : ''}
    <div class="detail-original">
      <span class="detail-label">원문 제목 (영문)</span>
      <p>${esc(card.title || '-')}</p>
      <span class="detail-label">원문 설명 (영문)</span>
      <p class="detail-text">${esc(short || '설명이 없습니다.')}</p>
    </div>`;
}
