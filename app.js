"use strict";
const KB = 1024; // 1 KB = 1024 bytes, like Windows

// ---- Presets (sources and dates are in README.md, "Form rules") ----
// w,h = pixels we produce. min,max = KB limits. px = allowed pixel ranges (omit = exactly w x h, false = notice gives none).
const OFFICIAL = [
  { id: "ibps", name: "IBPS RRB (CRP RRBs XV)",
    note: "Photo 200 x 230 px, 20-50 KB. Signature 140 x 60 px, 10-20 KB. Pixel sizes are marked 'preferred' by IBPS.",
    photo: { w: 200, h: 230, min: 20, max: 50 },
    sig:   { w: 140, h: 60,  min: 10, max: 20 } },
  { id: "gate", name: "GATE 2027",
    note: "Photo 3.5 x 4.5 cm, 200x260 to 530x690 px, 5-600 KB. Signature 250x80 to 580x180 px, 3-300 KB.",
    photo: { w: 413, h: 531, min: 5, max: 600, px: { minW: 200, maxW: 530, minH: 260, maxH: 690 } },
    sig:   { w: 450, h: 140, min: 3, max: 300, px: { minW: 250, maxW: 580, minH: 80, maxH: 180 } } },
  { id: "upsc", name: "UPSC CAPF (AC) 2026",
    note: "Photo 20-200 KB, signature 20-100 KB, JPG. The notice gives no pixel size, so this app uses 350 x 450 and 500 x 200.",
    photo: { w: 350, h: 450, min: 20, max: 200, px: false },
    sig:   { w: 500, h: 200, min: 20, max: 100, px: false } },
  { id: "ssc", name: "SSC CHSL 2026 (signature only)",
    note: "SSC takes the photo live from your camera inside the form, so no photo upload is needed. Signature: JPG, 10-20 KB, about 6.0 x 2.0 cm (354 x 118 px here).",
    photo: null,
    sig:   { w: 354, h: 118, min: 10, max: 20, px: false } },
];

// ---- Small helpers ----
const $ = (sel, root = document) => root.querySelector(sel);
const fmtKB = bytes => (bytes / KB).toFixed(2) + " KB";
const makeCanvas = (w, h) => Object.assign(document.createElement("canvas"), { width: w, height: h });
const toBlob = (c, q) => new Promise(res => c.toBlob(res, "image/jpeg", q));

function loadCustoms() {
  try { return JSON.parse(localStorage.getItem("ffx-customs")) || []; } catch { return []; }
}
function saveCustoms() {
  try { localStorage.setItem("ffx-customs", JSON.stringify(customs)); } catch { alert("This browser blocked saving."); }
}
let customs = loadCustoms();
let preset = OFFICIAL[0];

const allPresets = () => [...OFFICIAL, ...customs];
const ruleText = (s, label) => !s ? "" :
  `${label}: JPG, ${s.min}-${s.max} KB, ${s.px === false ? "about " : ""}${s.w} x ${s.h} px` + (s.px ? " (range allowed)" : "");

// ---- Preset picker ----
const presetSel = $("#preset");
function fillPresetList() {
  presetSel.innerHTML = "";
  const group = (label, list) => {
    if (!list.length) return;
    const g = document.createElement("optgroup");
    g.label = label;
    list.forEach(p => g.append(new Option(p.name, p.id)));
    presetSel.append(g);
  };
  group("Official forms", OFFICIAL);
  group("My custom presets", customs);
  presetSel.value = preset.id;
}
function choosePreset(id) {
  preset = allPresets().find(p => p.id === id) || OFFICIAL[0];
  presetSel.value = preset.id;
  $("#presetInfo").textContent = preset.custom ? "Your own rules, saved in this browser." : preset.note;
  $("#deleteCustom").hidden = !preset.custom;
  slots.forEach(s => s.setSpec(preset[s.kind]));
}
presetSel.onchange = () => choosePreset(presetSel.value);

$("#customForm").onsubmit = e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  const spec = (w, h, min, max) => ({ w: +w, h: +h, min: +min, max: +max });
  const p = { id: "c-" + f.name.trim().toLowerCase(), name: "Custom: " + f.name.trim(), custom: true,
    photo: spec(f.pw, f.ph, f.pmin, f.pmax), sig: spec(f.sw, f.sh, f.smin, f.smax) };
  if (p.photo.min > p.photo.max || p.sig.min > p.sig.max) return alert("Min size must not be bigger than max size.");
  customs = customs.filter(c => c.id !== p.id).concat(p);
  saveCustoms();
  fillPresetList();
  choosePreset(p.id);
};
$("#deleteCustom").onclick = () => {
  customs = customs.filter(c => c.id !== preset.id);
  saveCustoms();
  preset = OFFICIAL[0];
  fillPresetList();
  choosePreset(preset.id);
};

// ---- Image slot: crop box + compress + download ----
class Slot {
  constructor(sec) {
    this.sec = sec;
    this.kind = sec.dataset.kind;
    this.canvas = $("canvas", sec);
    this.ctx = this.canvas.getContext("2d");
    this.zoomInput = $(".zoom", sec);
    this.img = null; this.zoom = 1; this.cx = 0; this.cy = 0; this.spec = null;
    this.pointers = new Map(); this.run = 0; this.timer = 0; this.url = "";

    $("input[type=file]", sec).onchange = e => e.target.files[0] && this.load(e.target.files[0]);
    this.zoomInput.oninput = () => this.setZoom(+this.zoomInput.value);
    this.canvas.onwheel = e => { e.preventDefault(); this.setZoom(this.zoom * Math.exp(-e.deltaY * 0.002)); };
    this.canvas.onpointerdown = e => { this.canvas.setPointerCapture(e.pointerId); this.pointers.set(e.pointerId, e); };
    this.canvas.onpointermove = e => this.move(e);
    this.canvas.onpointerup = this.canvas.onpointercancel = e => this.pointers.delete(e.pointerId);
    addEventListener("resize", () => this.draw());
  }

  setSpec(spec) {
    this.spec = spec;
    $(".body", this.sec).hidden = !spec;
    $(".rule", this.sec).textContent = spec ? ruleText(spec, this.kind === "photo" ? "Photo" : "Signature") : "This form does not need a photo upload.";
    this.resetCrop();
  }

  async load(file) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    try { await img.decode(); } catch { URL.revokeObjectURL(url); return alert("This file is not an image the browser can open."); }
    if (this.url) URL.revokeObjectURL(this.url);
    this.url = url; this.img = img; this.name = file.name;
    this.resetCrop();
  }

  resetCrop() {
    this.zoom = 1; this.zoomInput.value = 1;
    if (this.img) { this.cx = this.img.naturalWidth / 2; this.cy = this.img.naturalHeight / 2; }
    this.draw();
  }

  // Geometry: the box is fixed on screen with the preset's shape; the picture moves under it.
  geometry() {
    const cw = this.canvas.clientWidth, ch = Math.round(cw * 0.9);
    const r = this.spec.w / this.spec.h;
    const bw = Math.min(cw - 32, (ch - 32) * r), bh = bw / r;
    const g = { cw, ch, bw, bh, bx: (cw - bw) / 2, by: (ch - bh) / 2 };
    if (this.img) {
      const iw = this.img.naturalWidth, ih = this.img.naturalHeight;
      g.s = Math.max(bw / iw, bh / ih) * this.zoom;                 // screen pixels per image pixel
      const hw = bw / 2 / g.s, hh = bh / 2 / g.s;                   // half box in image pixels
      this.cx = Math.min(Math.max(this.cx, hw), iw - hw);
      this.cy = Math.min(Math.max(this.cy, hh), ih - hh);
      Object.assign(g, { iw, ih, hw, hh });
    }
    return g;
  }

  draw() {
    if (!this.spec) return;
    const { canvas, ctx } = this, dpr = devicePixelRatio || 1;
    const g = this.geometry();
    canvas.width = g.cw * dpr; canvas.height = g.ch * dpr;
    canvas.style.height = g.ch + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#222"; ctx.fillRect(0, 0, g.cw, g.ch);
    if (this.img) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(this.img, g.cw / 2 - this.cx * g.s, g.ch / 2 - this.cy * g.s, g.iw * g.s, g.ih * g.s);
    } else {
      ctx.fillStyle = "#ddd"; ctx.font = "16px system-ui"; ctx.textAlign = "center";
      ctx.fillText("Choose a " + (this.kind === "photo" ? "photo" : "signature") + " to start", g.cw / 2, g.ch / 2);
    }
    ctx.fillStyle = "rgba(0,0,0,.55)";                              // dim outside the box
    ctx.beginPath(); ctx.rect(0, 0, g.cw, g.ch); ctx.rect(g.bx, g.by, g.bw, g.bh); ctx.fill("evenodd");
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(g.bx, g.by, g.bw, g.bh);
    if (this.kind === "photo") {                                    // face guide oval
      ctx.setLineDash([6, 5]); ctx.strokeStyle = "#ffd34d";
      ctx.beginPath(); ctx.ellipse(g.cw / 2, g.by + g.bh * 0.47, g.bw * 0.27, g.bh * 0.36, 0, 0, 7); ctx.stroke();
      ctx.setLineDash([]);
    }
    if (this.img) { clearTimeout(this.timer); this.timer = setTimeout(() => this.process(), 250); }
  }

  setZoom(z) {
    this.zoom = Math.min(5, Math.max(1, z));
    this.zoomInput.value = this.zoom;
    this.draw();
  }

  move(e) {
    const prev = this.pointers.get(e.pointerId);
    if (!prev || !this.img) return;
    const g = this.geometry();
    if (this.pointers.size === 1) {                                 // drag
      this.cx -= (e.clientX - prev.clientX) / g.s;
      this.cy -= (e.clientY - prev.clientY) / g.s;
      this.pointers.set(e.pointerId, e);
      this.draw();
    } else if (this.pointers.size === 2) {                          // pinch zoom
      const other = [...this.pointers.values()].find(p => p.pointerId !== e.pointerId);
      const d0 = Math.hypot(prev.clientX - other.clientX, prev.clientY - other.clientY);
      const d1 = Math.hypot(e.clientX - other.clientX, e.clientY - other.clientY);
      this.pointers.set(e.pointerId, e);
      if (d0) this.setZoom(this.zoom * d1 / d0);
    }
  }

  // Draw the crop at w x h. Halve step by step first so a 12 MP photo shrinks smoothly.
  render(w, h) {
    const g = this.geometry();
    let src = this.img, x = this.cx - g.hw, y = this.cy - g.hh, sw = g.hw * 2, sh = g.hh * 2;
    while (sw / 2 >= w * 1.5 && sh / 2 >= h * 1.5) {
      const c = makeCanvas(Math.round(sw / 2), Math.round(sh / 2));
      const cx = c.getContext("2d"); cx.imageSmoothingQuality = "high";
      cx.drawImage(src, x, y, sw, sh, 0, 0, c.width, c.height);
      src = c; x = 0; y = 0; sw = c.width; sh = c.height;
    }
    const out = makeCanvas(w, h), ctx = out.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, w, h);               // white behind any transparency
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(src, x, y, sw, sh, 0, 0, w, h);
    return out;
  }

  // Lower JPEG quality step by step (98% down). Exact pixel size: keep the size, go down to 10%.
  // Range or no pixel rule: go down to 30%, then shrink by 10% (never below the allowed range) and retry.
  async process() {
    const run = ++this.run, { w, h, min, max, px } = this.spec;
    const exact = px === undefined, floorQ = exact ? 0.1 : 0.3;
    const minScale = exact ? 1 : px ? Math.max(px.minW / w, px.minH / h) : 0.3;
    let scale = 1, best = null;
    search: while (true) {
      const W = Math.max(Math.round(w * scale), px ? px.minW : 1), H = Math.max(Math.round(h * scale), px ? px.minH : 1);
      const c = this.render(W, H);
      for (let q = 0.98; q >= floorQ - 1e-9; q -= 0.02) {
        const blob = await toBlob(c, q);
        if (run !== this.run) return;                               // newer crop started
        best = { blob, q, W, H, padded: false };
        if (blob.size <= max * KB) break search;
      }
      if (scale <= minScale + 1e-9) break;                          // cannot shrink more
      scale = Math.max(scale * 0.9, minScale);
    }
    if (best.blob.size < min * KB && best.blob.size <= max * KB) {  // too small: add harmless JPEG comment bytes
      best.blob = await padJpeg(best.blob, Math.min(min * KB + 512, max * KB));
      best.padded = true;
    }
    this.show(best);
  }

  show({ blob, q, W, H, padded }) {
    const { min, max, w, h, px } = this.spec, r = $(".result", this.sec);
    const sizeOk = blob.size >= min * KB && blob.size <= max * KB;
    const p = px === false ? null : px || { minW: w, maxW: w, minH: h, maxH: h };
    const pxOk = !p || (W >= p.minW && W <= p.maxW && H >= p.minH && H <= p.maxH);
    if (this.outUrl) URL.revokeObjectURL(this.outUrl);
    this.outUrl = URL.createObjectURL(blob);
    $("img", r).src = this.outUrl;
    $("dl", r).innerHTML =
      `<dt>File size</dt><dd>${fmtKB(blob.size)} (${blob.size.toLocaleString()} bytes)</dd>` +
      `<dt>Limit</dt><dd>${min}-${max} KB</dd>` +
      `<dt>Pixels</dt><dd>${W} x ${H}</dd>` +
      `<dt>JPEG quality</dt><dd>${Math.round(q * 100)}%${padded ? " (padded up to the minimum size)" : ""}</dd>`;
    const bad = [!sizeOk && `size is outside ${min}-${max} KB`, !pxOk && "pixels do not match the rule"].filter(Boolean);
    const badge = $(".badge", r);
    badge.className = "badge " + (bad.length ? "fail" : "pass");
    badge.textContent = bad.length ? "Does not pass: " + bad.join(" and ") : "Passes: size in KB" + (p ? " and pixels" : "") + " are within the rule";
    const a = $("a", r);
    a.href = this.outUrl;
    a.download = `${this.kind === "photo" ? "photo" : "signature"}-${preset.id.replace(/[^a-z0-9]+/g, "-")}.jpg`;
    const help = $(".help", r);
    help.hidden = blob.size <= max * KB;
    help.textContent = `Even at the lowest quality allowed (${Math.round(q * 100)}%${px === undefined ? "" : " and the smallest allowed size"}) the file is still above ${max} KB. ` +
      "The picture is very detailed or noisy. Try a plain, well-lit picture with a plain background (for a signature: thick dark ink on white paper), or zoom in so less is shown. " +
      "For a custom preset, check that the KB limit is not too small for the pixel size.";
    r.hidden = false;
  }
}

// Insert a JPEG comment segment (FF FE) after the header so the file reaches the minimum size.
async function padJpeg(blob, target) {
  const buf = new Uint8Array(await blob.arrayBuffer());
  const at = buf[2] === 0xFF && buf[3] === 0xE0 ? 4 + ((buf[4] << 8) | buf[5]) : 2; // after SOI + JFIF header
  const parts = [buf.slice(0, at)];
  for (let need = target - buf.length; need > 0;) {
    const total = Math.max(5, Math.min(need, 65537)), len = total - 2;   // marker 2 bytes + length field and data
    parts.push(new Uint8Array([0xFF, 0xFE, len >> 8, len & 255]), new Uint8Array(len - 2));
    need -= total;
  }
  parts.push(buf.slice(at));
  return new Blob(parts, { type: "image/jpeg" });
}

const slots = [...document.querySelectorAll(".slot")].map(s => new Slot(s));
fillPresetList();
choosePreset(preset.id);
