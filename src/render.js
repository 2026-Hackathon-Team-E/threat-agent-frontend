// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const badge = value => `<span class="badge ${value === '긴급' ? 'critical' : value === '높음' ? 'high' : ''}">${esc(value)}</span>`;
export function renderSummary(impacts, cards = []) {
  const done = impacts.filter(i => i.status === '수정 완료').length;
  const proposed = impacts.filter(i => i.status === '수정 제안').length;
  const verified = impacts.filter(i => i.rescan === 0).length;
  const high = impacts.filter(i => i.priority?.tier === '긴급' || i.priority?.tier === '높음').length;
  const steps = [
    { name: '수집', value: cards.length, desc: `위협 카드 ${cards.length}건`, ratio: 1 },
    { name: '영향 판단', value: impacts.length, desc: `우선 확인 ${high}건`, ratio: 1 },
    { name: '수정', value: `${done}/${impacts.length}`, desc: `완료 ${done} · 제안 ${proposed}`, ratio: impacts.length ? done / impacts.length : 0 },
    { name: '검증', value: verified, desc: `재스캔 완료 ${verified}건`, ratio: 1 },
  ];
  document.querySelector('#summary').innerHTML =
    `<div class="steps">${steps.map((s, i) => `<article class="step"><div class="step-head"><span class="step-name">${esc(s.name)}</span><span class="step-no">0${i + 1}</span></div><strong class="step-value">${esc(s.value)}</strong><div class="step-track"><i style="width:${Math.round(s.ratio * 100)}%"></i></div><span class="step-desc">${esc(s.desc)}</span></article>`).join('')}</div>`;
  document.querySelector('#count-impacts').textContent = impacts.length;
  document.querySelector('#count-cards').textContent = cards.length;
}

export function renderImpacts(impacts, selected) {
  const el = document.querySelector('#impacts');
  if (!impacts.length) { el.innerHTML = '<p class="empty">아직 영향 카드가 없습니다. CVE 재생으로 샘플을 넣어 보세요.</p>'; return; }
  el.innerHTML = impacts.map(i => `<button class="item ${selected === i.id ? 'selected' : ''}" data-impact="${esc(i.id)}"><span class="item-top"><b>${esc(i.service)}</b>${badge(i.priority?.tier)}</span><span>${esc(i.dep)}</span><small>${esc(i.installed)} → ${esc(i.fixed || '확인 필요')} · ${esc(i.status)}</small></button>`).join('');
}
export function renderDetail(impact) {
  const el = document.querySelector('#detail');
  if (!impact) { el.innerHTML = '<p class="empty">영향 카드를 선택하면 근거와 수정 내역이 표시됩니다.</p>'; return; }
  const lines = (impact.remediation?.diff || '').split('\n').filter(Boolean);
  const diff = lines.map(line => `<div class="diff-line ${line.startsWith('+') && !line.startsWith('+++') ? 'add' : line.startsWith('-') && !line.startsWith('---') ? 'remove' : ''}">${esc(line)}</div>`).join('');
  el.innerHTML = `<h3>${esc(impact.service)}</h3><p>${esc(impact.title)}</p><div class="tags">${badge(impact.priority?.tier)} ${badge(impact.status)}</div><h4>판단 근거</h4><ul>${(impact.priority?.reasons || []).map(r => `<li>${esc(r)}</li>`).join('')}</ul><h4>수정 내용</h4><p>${esc(impact.remediation?.text || '수정 제안 없음')} <small>(${esc(impact.remediation?.kind || 'manual')})</small></p><h4>변경 사항 (diff)</h4>${diff ? `<pre class="diff">${diff}</pre>` : '<p class="muted">표시할 diff가 없습니다.</p>'}<h4>재스캔</h4><p class="rescan">${impact.rescan === null || impact.rescan === undefined ? '아직 재스캔하지 않았습니다.' : `재스캔 ${esc(impact.rescan)}건`}</p>`;
}
const RISK_CLASS = { 긴급: 'critical', 높음: 'high', 보통: 'normal' };
function headlineOf(c) {
  if (c.key.startsWith('NEWS:') && c.headline_ko) return c.headline_ko;
  return c.summary_ko || c.title || '';
}
const CATEGORIES = [
  { id: 'cve', title: 'CVE 취약점 발견', test: c => c.key.startsWith('CVE-') },
  { id: 'advisory', title: '보안 이슈', test: c => !c.key.startsWith('CVE-') && !c.key.startsWith('NEWS:') },
  { id: 'news', title: '뉴스', test: c => c.key.startsWith('NEWS:') },
];
function cardHtml(c) {
  const risk = c.risk_label || '보통';
  const products = c.products?.length ? esc(c.products.join(', ')) : '확인 전';
  const services = c.affected_services?.length ? esc(c.affected_services.join(', ')) : '없음';
  const epss = c.epss_percent == null ? '-' : `${c.epss_percent}%`;
  return `<button class="threat ${RISK_CLASS[risk] || 'normal'}" data-card="${esc(c.key)}">
    <span class="threat-top"><span class="risk-chip">${esc(risk)}</span><span class="status-chip">${esc(c.status)}</span></span>
    <strong class="threat-summary">${esc(headlineOf(c))}</strong>
    <span class="threat-cve">${esc(c.key.startsWith('NEWS:') ? '뉴스 기사' : c.key)}</span>
    <dl class="threat-facts">
      <div><dt>대상</dt><dd>${products}</dd></div>
      <div><dt>우리 서비스</dt><dd>${services}</dd></div>
      <div><dt>악용 가능성</dt><dd>${esc(epss)}${c.kev ? ' · 실제 악용 확인' : ''}</dd></div>
    </dl>
  </button>`;
}
export function renderCards(cards) {
  const el = document.querySelector('#cards');
  if (!cards.length) { el.innerHTML = '<p class="empty">수집된 위협 카드가 없습니다.</p>'; return; }
  el.innerHTML = CATEGORIES.map(cat => {
    const items = cards.filter(cat.test);
    if (!items.length) return '';
    return `<section class="category"><h3 class="category-title">${cat.title}<span>${items.length}</span></h3><div class="category-grid">${items.map(cardHtml).join('')}</div></section>`;
  }).join('');
}
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
