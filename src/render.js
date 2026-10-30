// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const badge = value => `<span class="badge ${value === '긴급' ? 'critical' : value === '높음' ? 'high' : ''}">${esc(value)}</span>`;
export function renderSummary(impacts, cards = []) {
  const count = tier => impacts.filter(i => i.priority?.tier === tier).length;
  const done = impacts.filter(i => i.status === '수정 완료').length;
  const proposed = impacts.filter(i => i.status === '수정 제안').length;
  const verified = impacts.filter(i => i.rescan === 0).length;
  const ratio = impacts.length ? done / impacts.length : 0;
  const steps = [
    { name: '수집', value: cards.length, desc: `위협 카드 ${cards.length}건` },
    { name: '영향 판단', value: impacts.length, desc: `긴급 ${count('긴급')} · 높음 ${count('높음')}` },
    { name: '수정', value: `${done}/${impacts.length}`, desc: `수정 완료 ${done} · 제안 ${proposed}`, ratio },
    { name: '검증', value: verified, desc: `재스캔 완료 ${verified}건` },
  ];
  document.querySelector('#summary').innerHTML =
    `<div class="steps">${steps.map(s => `<article class="step"><span class="step-bar" style="--p:${s.ratio ?? 1}"></span><small>${esc(s.name)}</small><strong>${esc(s.value)}</strong><span>${esc(s.desc)}</span></article>`).join('')}</div>` +
    `<div class="tier-row">${['긴급', '높음', '보통'].map(t => `<article class="tier ${t === '긴급' ? 'critical' : t === '높음' ? 'high' : ''}"><span>${t}</span><strong>${count(t)}</strong></article>`).join('')}</div>`;
  document.querySelector('#count-impacts').textContent = impacts.length;
  document.querySelector('#count-cards').textContent = cards.length;
  document.querySelector('#tiers').innerHTML = ['긴급', '높음', '보통'].map(t => `<div class="tier-link"><span>${t}</span><b>${count(t)}</b></div>`).join('');
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
export function renderCards(cards) {
  const el = document.querySelector('#cards');
  if (!cards.length) { el.innerHTML = '<p class="empty">수집된 위협 카드가 없습니다.</p>'; return; }
  el.innerHTML = cards.map(c => `<button class="item threat" data-card="${esc(c.key)}"><span class="item-top"><b>${esc(c.key)}</b>${badge(c.status)}</span><span>${esc(c.title)}</span><small>KEV: ${c.kev ? '등록' : '미등록'} · EPSS: ${esc(c.epss ?? '-')} · v${esc(c.version ?? '-')}</small></button>`).join('');
}
export function renderCardDetail(card) {
  const el = document.querySelector('#card-detail');
  if (!card) { el.innerHTML = '<p class="muted">위협 카드를 선택해 상세 정보를 확인하세요.</p>'; return; }
  el.innerHTML = `<h3>${esc(card.key)}</h3><p>${esc(card.title)}</p><p>${esc(card.summary || '요약 정보 없음')}</p><p><b>출처:</b> ${esc((card.sources || []).join(', '))}</p><p><b>영향 범위:</b> ${esc((card.affected || []).map(a => `${a.ecosystem}: ${a.name}`).join(', ') || '확인된 범위 없음')}</p>`;
}
