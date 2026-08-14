import type {
  VoxyStaticCanonCandidate,
  VoxyStaticCanonRecoveryPlan,
} from "./staticCanonRecovery";

export type VoxyStaticCanonEmbeddedAssets = {
  canonStageDataUrl: string;
  wordmarkDataUrl: string;
};

const CARD_MARKUP = `
  <div class="content-card source-card"><span class="card-index">01</span><div><b>QUELLEN</b><i></i><i></i></div></div>
  <div class="content-card contrast-card"><span class="card-index">02</span><div><b>GEGENPOSITION</b><i></i><i></i></div></div>
  <div class="content-card question-card"><span class="card-index">03</span><div><b>OFFENE FRAGE</b><i></i><i></i></div></div>
`;

function candidatePanelMarkup(candidate: VoxyStaticCanonCandidate): string {
  if (candidate.mode === "canon_fidelity") {
    return `
      <section class="topic-card"><small>THEMA · DATUM</small><strong>MODERATION IM KONTEXT</strong><span></span></section>
      <section class="content-stack">${CARD_MARKUP}</section>
    `;
  }
  if (candidate.mode === "broadcast") {
    return `
      <section class="broadcast-monitor">
        <small>LIVE MODERATION</small>
        <strong>VOXY IM STUDIO</strong>
        <div class="meter">${Array.from({ length: 18 }, (_, index) => `<i style="--h:${28 + ((index * 17) % 66)}%"></i>`).join("")}</div>
        <div class="broadcast-meta"><span>MIKROFON</span><span>WAVEFORM</span><span>HOST</span></div>
      </section>
    `;
  }
  return `
    <section class="editorial-grid">
      <div class="editorial-head"><small>THEMA · DATUM</small><strong>EDITORIAL MASTER</strong></div>
      <div class="editorial-field wide"><b>HEADLINE</b><i></i><i></i></div>
      <div class="editorial-field"><b>QUELLEN</b><i></i><i></i><i></i></div>
      <div class="editorial-field"><b>PRO / CONTRA</b><i></i><i></i><i></i></div>
      <div class="editorial-field wide compact"><b>DOSSIER · ABSTIMMUNG · CAPTIONS</b><i></i></div>
    </section>
  `;
}

export function renderVoxyStaticCanonCandidateHtml(input: {
  plan: VoxyStaticCanonRecoveryPlan;
  candidate: VoxyStaticCanonCandidate;
  assets: VoxyStaticCanonEmbeddedAssets;
}): string {
  const { candidate, assets } = input;
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${candidate.label}</title>
<style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#020718;font-family:Arial,Helvetica,sans-serif;color:#fff}
.master{position:relative;width:1920px;height:1080px;overflow:hidden;isolation:isolate;background:#020718}
.canon-stage{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transform:translate(${candidate.camera.translateX}px,${candidate.camera.translateY}px) scale(${candidate.camera.scale});transform-origin:50% 45%;filter:saturate(1.04) contrast(1.025)}
.light-grade{position:absolute;inset:0;background:radial-gradient(circle at 48% 42%,transparent 0 34%,rgba(0,7,25,.16) 66%,rgba(0,4,16,.62) 100%),linear-gradient(90deg,rgba(0,217,192,.055),transparent 40%,rgba(30,107,255,.04));pointer-events:none}
.source-clean-left{position:absolute;left:0;top:0;width:470px;height:805px;background:linear-gradient(90deg,#020718 0%,rgba(2,7,24,.985) 77%,rgba(2,7,24,.3) 100%)}
.source-clean-right{position:absolute;right:0;top:0;width:${candidate.rightPanelWidth}px;height:880px;background:linear-gradient(90deg,rgba(2,7,24,.35),rgba(2,7,24,.98) 12%,#020718 100%)}
.source-clean-bottom{position:absolute;left:0;right:0;bottom:0;height:286px;background:linear-gradient(180deg,rgba(2,7,24,.12),rgba(2,7,24,.97) 18%,#01040f 100%);border-top:1px solid rgba(93,162,255,.25)}
.frame{position:absolute;inset:14px;border:1px solid rgba(151,184,224,.42);border-radius:18px;box-shadow:inset 0 0 70px rgba(0,32,85,.18);pointer-events:none}
.review-label{position:absolute;left:38px;top:32px;z-index:5;padding:11px 16px;border:1px solid rgba(255,255,255,.46);border-radius:10px;background:rgba(1,5,15,.86);font-size:17px;letter-spacing:.14em;font-weight:700}
.review-label:before{content:"";display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:10px;background:linear-gradient(135deg,#00d9c0,#1e6bff);box-shadow:0 0 16px #00d9c0}
.brand-panel{position:absolute;left:44px;top:112px;width:354px;height:226px;padding:18px;border:1px solid rgba(55,144,255,.48);border-radius:22px;background:linear-gradient(145deg,rgba(4,12,31,.98),rgba(1,5,15,.9));box-shadow:0 20px 60px rgba(0,0,0,.36),0 0 42px rgba(30,107,255,.16)}
.brand-panel img{width:100%;height:100%;object-fit:contain}
.brand-note{position:absolute;left:58px;top:370px;width:330px;color:#90a8c9;font-size:16px;line-height:1.55;letter-spacing:.04em}
.brand-note strong{display:block;color:#fff;font-size:21px;letter-spacing:.08em;margin-bottom:8px}
.topic-card,.broadcast-monitor,.editorial-grid{position:absolute;right:42px;top:60px;width:${Math.max(410, candidate.rightPanelWidth - 72)}px}
.topic-card{height:148px;padding:25px 28px;border:1px solid rgba(160,188,222,.55);border-radius:15px;background:rgba(2,8,22,.94);box-shadow:0 20px 60px rgba(0,0,0,.3)}
.topic-card small,.broadcast-monitor small,.editorial-head small{display:block;color:#39d9e6;font-size:16px;letter-spacing:.14em;margin-bottom:12px}
.topic-card strong,.broadcast-monitor strong,.editorial-head strong{font-size:26px;letter-spacing:.045em}.topic-card span{display:block;width:66%;height:4px;margin-top:18px;background:linear-gradient(90deg,#00d9c0,#1e6bff);border-radius:4px}
.content-stack{position:absolute;right:42px;top:232px;width:${Math.max(410, candidate.rightPanelWidth - 72)}px;display:grid;gap:14px}
.content-card{height:150px;border:1px solid rgba(76,164,255,.5);border-radius:16px;background:linear-gradient(130deg,rgba(4,24,50,.97),rgba(2,9,25,.96));display:grid;grid-template-columns:72px 1fr;align-items:center;padding:18px 20px;box-shadow:0 16px 45px rgba(0,0,0,.28)}
.content-card.contrast-card{border-color:rgba(118,96,255,.6);background:linear-gradient(130deg,rgba(15,20,72,.97),rgba(3,8,25,.96))}.content-card.question-card{border-color:rgba(0,217,192,.55)}
.card-index{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#00d9c0,#1e6bff);font-weight:800;font-size:18px;box-shadow:0 0 26px rgba(30,107,255,.28)}
.content-card b{display:block;font-size:22px;letter-spacing:.055em;margin-bottom:12px}.content-card i,.editorial-field i{display:block;height:6px;background:rgba(189,212,239,.23);border-radius:4px;margin-top:9px}.content-card i:last-child{width:68%}
.lower-third{position:absolute;left:46px;right:${candidate.mode === "editorial" ? 726 : 54}px;bottom:79px;height:176px;border:1px solid rgba(110,156,211,.5);border-radius:17px;background:linear-gradient(105deg,rgba(2,9,24,.98),rgba(3,14,34,.93));padding:27px 34px 25px 50px;box-shadow:0 22px 70px rgba(0,0,0,.4)}
.lower-third:before{content:"";position:absolute;left:22px;top:26px;bottom:26px;width:6px;border-radius:5px;background:linear-gradient(#00d9c0,#1e6bff);box-shadow:0 0 20px rgba(0,217,192,.4)}
.lower-third small{color:#42dbe6;font-size:16px;letter-spacing:.14em}.lower-third strong{display:block;font-size:36px;letter-spacing:.02em;margin:13px 0}.lower-third span{display:block;width:62%;height:7px;border-radius:5px;background:rgba(188,211,239,.22)}
.footer{position:absolute;left:48px;right:48px;bottom:25px;display:flex;justify-content:space-between;color:#79a8df;font-size:14px;letter-spacing:.14em}.footer b{color:#3cd9e7}
.broadcast-monitor{top:116px;padding:32px;border:1px solid rgba(44,126,255,.6);border-radius:18px;background:linear-gradient(150deg,rgba(1,7,22,.98),rgba(4,19,51,.96));box-shadow:0 0 70px rgba(30,107,255,.17)}
.meter{height:210px;margin:32px 0 22px;display:flex;gap:8px;align-items:center;justify-content:center;border-block:1px solid rgba(79,137,209,.24)}.meter i{display:block;width:11px;height:var(--h);border-radius:8px;background:linear-gradient(#00d9c0,#1e6bff);box-shadow:0 0 16px rgba(30,107,255,.28)}
.broadcast-meta{display:flex;justify-content:space-between;color:#8faacb;font-size:13px;letter-spacing:.12em}
.editorial-grid{top:54px;display:grid;grid-template-columns:1fr 1fr;gap:14px}.editorial-head,.editorial-field{border:1px solid rgba(79,139,215,.46);border-radius:15px;background:rgba(2,9,24,.96);padding:20px 22px}.editorial-head{grid-column:1/-1;height:122px}.editorial-field{min-height:175px}.editorial-field.wide{grid-column:1/-1}.editorial-field.compact{min-height:105px}.editorial-field b{display:block;color:#e7f1ff;font-size:18px;letter-spacing:.1em;margin-bottom:16px}
.candidate-b-broadcast .light-grade{background:radial-gradient(circle at 52% 43%,rgba(30,107,255,.06),transparent 39%),linear-gradient(90deg,rgba(1,5,17,.15),transparent 58%,rgba(0,17,55,.34))}
.candidate-c-editorial .light-grade{background:linear-gradient(90deg,rgba(0,217,192,.035),transparent 43%,rgba(1,5,17,.46) 65%),radial-gradient(circle at 43% 42%,transparent 0 31%,rgba(1,5,17,.24) 75%)}
</style>
</head>
<body><main class="master ${candidate.id}" data-candidate-id="${candidate.id}" data-character-source="CANON-04">
  <img class="canon-stage" src="${assets.canonStageDataUrl}" alt="">
  <div class="light-grade"></div><div class="source-clean-left"></div><div class="source-clean-right"></div><div class="source-clean-bottom"></div>
  <div class="frame"></div><div class="review-label">${candidate.label}</div>
  <section class="brand-panel"><img src="${assets.wordmarkDataUrl}" alt="Voxy eDebatte"></section>
  <section class="brand-note"><strong>DIGITALER MODERATOR</strong>Eine kanonische Identität · lokales statisches Review-Master</section>
  ${candidatePanelMarkup(candidate)}
  <section class="lower-third"><small>HUMAN-REVIEW-ZONE</small><strong>Headline und Kernaussage</strong><span></span></section>
  <footer class="footer"><span>VOXY · VOICEOPENGOV · eDEBATTE</span><b>STATISCH · NICHT PRODUKTIV</b></footer>
</main></body></html>`;
}

export function renderVoxyStaticCanonComparisonHtml(input: {
  candidateDataUrls: Readonly<Record<VoxyStaticCanonCandidate["id"], string>>;
  canonBoards: readonly Readonly<{ id: string; dataUrl: string }>[];
}): string {
  const candidates = [
    ["candidate-a-canon", "A · CANON FIDELITY"],
    ["candidate-b-broadcast", "B · BROADCAST"],
    ["candidate-c-editorial", "C · EDITORIAL"],
  ] as const;
  return `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#01040d;color:#fff;font-family:Arial,Helvetica,sans-serif}.sheet{width:3200px;height:1800px;padding:54px 58px;background:radial-gradient(circle at 50% 0,#071a40,#01040d 58%)}
h1{margin:0;font-size:42px;letter-spacing:.08em}p{margin:12px 0 32px;color:#8ea9cc;font-size:22px}.candidate-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:28px}.candidate,.canon{border:1px solid rgba(94,151,224,.48);border-radius:17px;overflow:hidden;background:#020718;box-shadow:0 20px 55px rgba(0,0,0,.38)}.candidate img{display:block;width:100%;aspect-ratio:16/9;object-fit:cover}.label{height:64px;display:flex;align-items:center;padding:0 22px;color:#dfeeff;font-size:21px;font-weight:700;letter-spacing:.08em;border-top:1px solid rgba(94,151,224,.32)}
h2{font-size:25px;letter-spacing:.1em;margin:42px 0 18px;color:#55dce9}.canon-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}.canon img{display:block;width:100%;height:410px;object-fit:contain;background:#01030a}.canon .label{height:55px;font-size:17px}.notice{display:flex;justify-content:space-between;margin-top:28px;color:#718aad;font-size:18px;letter-spacing:.06em}.notice b{color:#49dbe7}
</style></head><body><main class="sheet"><h1>VOXY · STATISCHE MASTER-AUSWAHL</h1><p>Direkter Human-Review-Vergleich · keine automatische Bewertung · keine Animationsfreigabe</p><section class="candidate-grid">${candidates.map(([id, label]) => `<article class="candidate"><img src="${input.candidateDataUrls[id]}" alt=""><div class="label">${label}</div></article>`).join("")}</section><h2>HUMAN-APPROVED CANON-REFERENZEN</h2><section class="canon-grid">${input.canonBoards.map((board) => `<article class="canon"><img src="${board.dataUrl}" alt=""><div class="label">${board.id}</div></article>`).join("")}</section><div class="notice"><span>Charakterquelle A/B/C identisch: CANON-04 · CANON-01/02 Character-Kontrolle · CANON-03/04 Studio/Layout</span><b>HUMAN VISUAL ACCEPTANCE: PENDING</b></div></main></body></html>`;
}
