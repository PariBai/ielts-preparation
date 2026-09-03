/* SVG chart renderers for the Band 9 Vault.
   Every shape carries a class so styles.css can theme it for light and dark;
   colours are never baked into the markup. All charts scale to their container. */

function svgWrap(viewBox, inner, caption) {
  return (
    '<figure class="chart">' +
    '<div class="chart-scroll"><svg viewBox="' + viewBox + '" role="img" preserveAspectRatio="xMidYMid meet">' + inner + '</svg></div>' +
    (caption ? '<figcaption>' + caption + '</figcaption>' : '') +
    '</figure>'
  );
}

/* ---------- line graph ---------- */

function lineChart(cfg) {
  const W = 640, H = 360;
  const L = 66, R = W - 24, T = 28, B = H - 58;
  const max = cfg.yMax;
  const xs = (i) => L + (i * (R - L)) / (cfg.labels.length - 1);
  const ys = (v) => B - (v / max) * (B - T);

  let g = '';
  for (const t of cfg.yTicks) {
    g += '<line class="cv-grid" x1="' + L + '" y1="' + ys(t) + '" x2="' + R + '" y2="' + ys(t) + '"/>';
    g += '<text class="cv-tick" x="' + (L - 10) + '" y="' + (ys(t) + 4) + '" text-anchor="end">' + (cfg.fmt ? cfg.fmt(t) : t) + '</text>';
  }
  g += '<line class="cv-axis" x1="' + L + '" y1="' + T + '" x2="' + L + '" y2="' + B + '"/>';
  g += '<line class="cv-axis" x1="' + L + '" y1="' + B + '" x2="' + R + '" y2="' + B + '"/>';

  cfg.labels.forEach((lab, i) => {
    g += '<text class="cv-tick" x="' + xs(i) + '" y="' + (B + 22) + '" text-anchor="middle">' + lab + '</text>';
  });

  cfg.series.forEach((s, si) => {
    const pts = s.values.map((v, i) => xs(i).toFixed(1) + ',' + ys(v).toFixed(1)).join(' ');
    g += '<polyline class="cv-line cv-s' + (si + 1) + '" points="' + pts + '"/>';
    s.values.forEach((v, i) => {
      g += '<circle class="cv-dot cv-s' + (si + 1) + '" cx="' + xs(i).toFixed(1) + '" cy="' + ys(v).toFixed(1) + '" r="4"/>';
    });
  });

  let legend = '';
  cfg.series.forEach((s, si) => {
    const x = L + si * 210;
    legend += '<rect class="cv-swatch cv-s' + (si + 1) + '" x="' + x + '" y="' + (H - 26) + '" width="13" height="13" rx="3"/>';
    legend += '<text class="cv-legend" x="' + (x + 20) + '" y="' + (H - 15) + '">' + s.name + '</text>';
  });

  return svgWrap('0 0 ' + W + ' ' + H, g + legend, cfg.caption);
}

/* ---------- horizontal bar chart ---------- */

function barChartH(cfg) {
  const W = 640;
  const rowH = 46, top = 26;
  const H = top + cfg.items.length * rowH + 20;
  const L = 132, R = W - 66;

  let g = '';
  cfg.items.forEach((it, i) => {
    const y = top + i * rowH;
    const w = (it.value / cfg.max) * (R - L);
    g += '<text class="cv-catlabel" x="' + (L - 12) + '" y="' + (y + 24) + '" text-anchor="end">' + it.label + '</text>';
    g += '<rect class="cv-bartrack" x="' + L + '" y="' + (y + 4) + '" width="' + (R - L) + '" height="30" rx="5"/>';
    g += '<rect class="cv-bar cv-s' + ((i % 4) + 1) + '" x="' + L + '" y="' + (y + 4) + '" width="' + w.toFixed(1) + '" height="30" rx="5"/>';
    g += '<text class="cv-barval" x="' + (L + w + 10) + '" y="' + (y + 25) + '">' + it.value + (cfg.unit || '') + '</text>';
  });
  g += '<line class="cv-axis" x1="' + L + '" y1="' + top + '" x2="' + L + '" y2="' + (top + cfg.items.length * rowH) + '"/>';

  return svgWrap('0 0 ' + W + ' ' + H, g, cfg.caption);
}

/* ---------- pie charts ---------- */

function pieSlices(cx, cy, r, slices) {
  let angle = -Math.PI / 2;
  let out = '';
  slices.forEach((s, i) => {
    const sweep = (s.value / 100) * Math.PI * 2;
    const end = angle + sweep;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(end), y2 = cy + r * Math.sin(end);
    const large = sweep > Math.PI ? 1 : 0;
    out += '<path class="cv-slice cv-s' + (i + 1) + '" d="M ' + cx + ' ' + cy + ' L ' + x1.toFixed(1) + ' ' + y1.toFixed(1) +
      ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + x2.toFixed(1) + ' ' + y2.toFixed(1) + ' Z"/>';
    /* Percentage sits at the slice midpoint. */
    const mid = angle + sweep / 2;
    const lx = cx + r * 0.62 * Math.cos(mid), ly = cy + r * 0.62 * Math.sin(mid);
    out += '<text class="cv-slicelabel" x="' + lx.toFixed(1) + '" y="' + (ly + 5).toFixed(1) + '" text-anchor="middle">' + s.value + '%</text>';
    angle = end;
  });
  return out;
}

function pieChart(cfg) {
  const W = 640, H = 340;
  const r = 92;
  let g = '';
  cfg.charts.forEach((c, i) => {
    const cx = 160 + i * 320;
    g += '<text class="cv-pietitle" x="' + cx + '" y="24" text-anchor="middle">' + c.title + '</text>';
    g += pieSlices(cx, 142, r, c.slices);
  });

  /* One shared legend: the categories are identical across both charts. */
  const legend = cfg.charts[0].slices;
  let lg = '';
  legend.forEach((s, i) => {
    const y = 276 + i * 22;
    const x = 60;
    lg += '<rect class="cv-swatch cv-s' + (i + 1) + '" x="' + x + '" y="' + (y - 11) + '" width="13" height="13" rx="3"/>';
    lg += '<text class="cv-legend" x="' + (x + 20) + '" y="' + y + '">' + s.label + '</text>';
  });

  return svgWrap('0 0 ' + W + ' ' + H, g + lg, cfg.caption);
}

/* ---------- data table ---------- */

function dataTable(cfg) {
  const head = cfg.headers.map((h) => '<th>' + h + '</th>').join('');
  const body = cfg.rows
    .map((r) => '<tr>' + r.map((c, i) => (i === 0 ? '<th scope="row">' + c + '</th>' : '<td>' + c + '</td>')).join('') + '</tr>')
    .join('');
  return (
    '<figure class="chart">' +
    '<div class="chart-scroll"><table class="cv-table"><thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table></div>' +
    (cfg.caption ? '<figcaption>' + cfg.caption + '</figcaption>' : '') +
    '</figure>'
  );
}

/* ---------- process flowchart ---------- */

function processFlow(cfg) {
  const W = 640;
  const boxH = 64, gap = 24;
  const H = 14 + cfg.steps.length * (boxH + gap);
  const bw = 500, bx = (W - bw) / 2;

  let g = '';
  cfg.steps.forEach((s, i) => {
    const y = 8 + i * (boxH + gap);
    g += '<rect class="cv-node" x="' + bx + '" y="' + y + '" width="' + bw + '" height="' + boxH + '" rx="10"/>';
    g += '<circle class="cv-stepnum" cx="' + (bx + 28) + '" cy="' + (y + boxH / 2) + '" r="15"/>';
    g += '<text class="cv-stepnumtext" x="' + (bx + 28) + '" y="' + (y + boxH / 2 + 5) + '" text-anchor="middle">' + (i + 1) + '</text>';
    g += '<text class="cv-nodetitle" x="' + (bx + 56) + '" y="' + (y + 27) + '">' + s.title + '</text>';
    g += '<text class="cv-nodesub" x="' + (bx + 56) + '" y="' + (y + 47) + '">' + s.detail + '</text>';
    if (i < cfg.steps.length - 1) {
      const ay = y + boxH;
      g += '<line class="cv-arrow" x1="' + (W / 2) + '" y1="' + ay + '" x2="' + (W / 2) + '" y2="' + (ay + gap - 8) + '"/>';
      g += '<path class="cv-arrowhead" d="M ' + (W / 2 - 5) + ' ' + (ay + gap - 9) + ' L ' + (W / 2 + 5) + ' ' + (ay + gap - 9) + ' L ' + (W / 2) + ' ' + (ay + gap) + ' Z"/>';
    }
  });
  return svgWrap('0 0 ' + W + ' ' + H, g, cfg.caption);
}

/* ---------- map comparison ---------- */

function mapCompare(cfg) {
  const W = 640, H = 300;
  const pw = 300, ph = 216, py = 42;

  function panel(x, title, kind) {
    let s = '<text class="cv-pietitle" x="' + (x + pw / 2) + '" y="24" text-anchor="middle">' + title + '</text>';
    s += '<rect class="cv-mapframe" x="' + x + '" y="' + py + '" width="' + pw + '" height="' + ph + '" rx="8"/>';
    /* River across the north edge, present in both years. */
    s += '<path class="cv-river" d="M ' + x + ' ' + (py + 32) + ' Q ' + (x + pw * 0.35) + ' ' + (py + 14) + ' ' + (x + pw * 0.62) + ' ' + (py + 36) + ' T ' + (x + pw) + ' ' + (py + 28) + '"/>';
    s += '<text class="cv-maplabel" x="' + (x + 8) + '" y="' + (py + 20) + '">River</text>';

    if (kind === 'before') {
      s += '<rect class="cv-farm" x="' + (x + pw * 0.44) + '" y="' + (py + 56) + '" width="' + (pw * 0.5) + '" height="' + (ph - 100) + '" rx="5"/>';
      s += '<text class="cv-maplabel" x="' + (x + pw * 0.69) + '" y="' + (py + 122) + '" text-anchor="middle">Farmland</text>';
      s += '<rect class="cv-house" x="' + (x + 20) + '" y="' + (py + ph - 70) + '" width="26" height="22" rx="3"/>';
      s += '<rect class="cv-house" x="' + (x + 52) + '" y="' + (py + ph - 64) + '" width="22" height="16" rx="3"/>';
      s += '<rect class="cv-house" x="' + (x + 26) + '" y="' + (py + ph - 42) + '" width="24" height="18" rx="3"/>';
      s += '<text class="cv-maplabel" x="' + (x + 18) + '" y="' + (py + ph - 78) + '">Houses</text>';
      s += '<path class="cv-roadthin" d="M ' + (x + 14) + ' ' + (py + ph - 14) + ' L ' + (x + pw - 14) + ' ' + (py + ph - 14) + '"/>';
      s += '<text class="cv-maplabel" x="' + (x + pw / 2) + '" y="' + (py + ph - 20) + '" text-anchor="middle">Unpaved road</text>';
    } else {
      s += '<rect class="cv-park" x="' + (x + pw * 0.44) + '" y="' + (py + 56) + '" width="' + (pw * 0.5) + '" height="' + (ph - 100) + '" rx="5"/>';
      s += '<text class="cv-maplabel cv-on-fill" x="' + (x + pw * 0.69) + '" y="' + (py + 114) + '" text-anchor="middle">National</text>';
      s += '<text class="cv-maplabel cv-on-fill" x="' + (x + pw * 0.69) + '" y="' + (py + 130) + '" text-anchor="middle">Technology Park</text>';
      s += '<rect class="cv-tower" x="' + (x + 20) + '" y="' + (py + ph - 96) + '" width="20" height="48" rx="2"/>';
      s += '<rect class="cv-tower" x="' + (x + 46) + '" y="' + (py + ph - 82) + '" width="20" height="34" rx="2"/>';
      s += '<rect class="cv-tower" x="' + (x + 72) + '" y="' + (py + ph - 104) + '" width="20" height="56" rx="2"/>';
      s += '<text class="cv-maplabel" x="' + (x + 18) + '" y="' + (py + ph - 110) + '">High-rise flats</text>';
      s += '<path class="cv-roadwide" d="M ' + (x + 14) + ' ' + (py + ph - 14) + ' L ' + (x + pw - 14) + ' ' + (py + ph - 14) + '"/>';
      s += '<path class="cv-roadline" d="M ' + (x + 14) + ' ' + (py + ph - 14) + ' L ' + (x + pw - 14) + ' ' + (py + ph - 14) + '"/>';
      s += '<text class="cv-maplabel" x="' + (x + pw / 2) + '" y="' + (py + ph - 22) + '" text-anchor="middle">Dual carriageway</text>';
      s += '<rect class="cv-plant" x="' + (x + 34) + '" y="' + (py + 44) + '" width="64" height="26" rx="4"/>';
      s += '<text class="cv-maplabel" x="' + (x + 66) + '" y="' + (py + 61) + '" text-anchor="middle">Filtration</text>';
    }
    return s;
  }

  const g = panel(8, cfg.beforeTitle, 'before') + panel(W - pw - 8, cfg.afterTitle, 'after');
  return svgWrap('0 0 ' + W + ' ' + H, g, cfg.caption);
}
