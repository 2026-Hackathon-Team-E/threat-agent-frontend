// 담당: F tmdtndks. 상태: 스텁 (구현 전). 명세는 docs/SCREENS.md.
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const badge = value => `<span class="badge ${value === '긴급' ? 'critical' : value === '높음' ? 'high' : ''}">${esc(value)}</span>`;
export function renderSummary(impacts) {
  document.querySelector('#summary').innerHTML = ['긴급','높음','보통'].map(tier => `<article class="metric"><span>${tier}</span><strong>${impacts.filter(i => i.priority?.tier === tier).length}</strong></article>`).join('');
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
