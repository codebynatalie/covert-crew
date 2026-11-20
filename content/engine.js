// Covert Crew engine: spawns the family, runs their little brains, physics,
// cursor interaction, and reactions to searches / typing.
(() => {
  'use strict';
  const CC = globalThis.CovertCrew;
  if (!CC || !CC.art || CC.started) return;
  if (window.top !== window) return;
  CC.started = true;

  const ART = CC.art;
  const IDS = CC.IDS;
  const G = 2000; // gravity, px/s^2
  const Z = { dad: 2, mom: 3, kid: 5, dog: 4 };
  const chromeApi = globalThis.chrome && chrome.storage && chrome.storage.local ? chrome : null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const chance = (p) => Math.random() < p;
  const now = () => performance.now();
  const div = (cls) => {
    const d = document.createElement('div');
    d.className = cls;
    return d;
  };
  function weighted(table) {
    let total = 0;
    for (const k in table) total += table[k];
    let r = Math.random() * total;
    for (const k in table) if ((r -= table[k]) <= 0) return k;
    return Object.keys(table)[0];
  }

  // ---------------------------------------------------------------------------
  // Personalities
  const PERSONA = {
    dad: {
      speed: 70, climbSpeed: 55, jump: 380, climber: true,
      acts: { idle: 3, walk: 4, climb: 1.2, perch: 1.2, sit: 0.8, read: 1.5, sneak: 1, social: 2.2, wave: 0.3 },
      click: ['Hm?', 'Need something?', 'Stay sharp.', 'All quiet on my end.', 'Careful, that\'s classified.'],
      clickEmote: ['❗', '🕶️', '🤨'],
      climbEmote: ['🧗', '🔭', '😎'],
    },
    mom: {
      speed: 78, climbSpeed: 65, jump: 420, climber: true,
      acts: { idle: 2, walk: 4, climb: 2, perch: 1.6, train: 1.2, tinker: 1.2, social: 2.2, sit: 0.8 },
      click: ['Oh! Hello!', 'Wanna see my newest gadget?', 'Hehe, that tickles!', 'Need a hand?'],
      clickEmote: ['😊', '🔧', '✨'],
      climbEmote: ['💪', '😄', '🌟'],
    },
    kid: {
      speed: 62, climbSpeed: 50, jump: 300, climber: true,
      acts: { idle: 2, walk: 3, run: 2, climb: 1.5, perch: 1.6, dance: 1.2, hops: 1, social: 3, sit: 0.6 },
      click: ['Hehe!', 'That tickles!', 'Again! Again!', 'Hi hi!', 'Am I a spy yet?'],
      clickEmote: ['✨', '😆', '🤩'],
      climbEmote: ['😆', '🙌', '👀'],
    },
    dog: {
      speed: 85, climbSpeed: 0, jump: 140, climber: false,
      acts: { idle: 2, walk: 3, run: 2, sniff: 2, spin: 0.8, sit: 1.2, follow: 2, social: 1.5, nap: 0.8, perch: 0.5 },
      click: ['Woof!', 'Arf!', '*wag wag*', 'Bork!'],
      clickEmote: ['🐾', '💕', '❗'],
      climbEmote: [],
    },
  };

  const EXPR = {
    neutral: { e: 'open', m: 'smile' },
    happy: { e: 'happy', m: 'grin', b: 1 },
    love: { e: 'heart', m: 'smile', b: 1 },
    excited: { e: 'star', m: 'grin', b: 1 },
    surprised: { e: 'wide', m: 'o' },
    scared: { e: 'wide', m: 'wavy', s: 1 },
    nervous: { e: 'open', m: 'wavy', s: 1 },
    sad: { e: 'sad', m: 'frown' },
    sleepy: { e: 'closed', m: 'o' },
    dizzy: { e: 'x', m: 'wavy' },
    smug: { e: 'open', m: 'smirk', acc: 'shades' },
    angry: { e: 'angry', m: 'frown' },
    focused: { e: 'open', m: 'flat' },
    shy: { e: 'happy', m: 'smile', b: 1 },
    content: { e: 'closed', m: 'smile' },
  };
  // Emoji shown on custom-image skins, since they have no drawn face.
  const EXPR_EMOJI = {
    happy: '😄', love: '😍', excited: '🤩', surprised: '😮', scared: '😱', nervous: '😅', sad: '😢',
    sleepy: '😴', dizzy: '😵', smug: '😎', angry: '😠', shy: '😊', content: '😌',
  };

  // ---------------------------------------------------------------------------
  // State
  let settings = CC.mergeSettings(null);
  let skins = {};
  let host = null;
  let stage = null;
  const members = new Map();
  let raf = 0;
  let lastFrame = 0;
  let lastHousekeep = 0;
  let VW = window.innerWidth;
  let FLOOR = window.innerHeight;
  let lastQuery = '';
  let lastHref = location.href;
  let ttPolicy = null;

  const activity = {
    last: now(), keys: [], lastWork: 0, dozing: false,
    px: -1, py: -1, lastMove: 0, lastChase: 0,
  };

  function measure() {
    const de = document.documentElement;
    VW = Math.min(window.innerWidth, (de && de.clientWidth) || window.innerWidth);
    FLOOR = Math.min(window.innerHeight, (de && de.clientHeight) || window.innerHeight);
  }

  function setSvg(el, markup) {
    try {
      el.innerHTML = markup;
      return true;
    } catch (_) { /* page enforces Trusted Types */ }
    try {
      if (!ttPolicy && globalThis.trustedTypes) {
        ttPolicy = trustedTypes.createPolicy('covert-crew', { createHTML: (s) => s });
      }
      if (ttPolicy) {
        el.innerHTML = ttPolicy.createHTML(markup);
        return true;
      }
    } catch (_) { /* fall through */ }
    return false;
  }

  // ---------------------------------------------------------------------------
  // A family member
  class Member {
    constructor(id) {
      this.id = id;
      this.art = ART[id];
      this.p = PERSONA[id];
      this.queue = [];
      this.act = null;
      this.state = '';
      this.facing = chance(0.5) ? 1 : -1;
      this.tilt = 0;
      this.heldVX = 0;
      this.vx = 0;
      this.vy = 0;
      this.grounded = false;
      this.clinging = false;
      this.platform = null;
      this.platformSince = 0;
      this.entering = true;
      this.expr = null;
      this.exprUntil = 0;
      this.prop = '';
      this.timers = {};
      this.pet = { dir: 0, count: 0, since: 0, cool: 0 };
      this.build();
      measure();
      this.x = rand(this.w, Math.max(this.w + 1, VW - this.w));
      this.y = -rand(30, 280);
      this.minX = this.w / 2;
      this.maxX = VW - this.w / 2;
      this.setState('fall');
    }

    get name() {
      return (settings.names && settings.names[this.id]) || this.art.name;
    }

    build() {
      this.h = Math.round(this.art.height * settings.scale);
      this.w = Math.round((this.h * this.art.vbw) / this.art.vbh);
      const el = div(`char ${this.id}`);
      el.style.zIndex = Z[this.id];
      el.style.setProperty('--sit', (this.art.legs * 0.58).toFixed(1) + 'px');
      this.wrap = div('wrap');
      this.anim = div('anim');
      const skin = skins[this.id];
      if (skin || !setSvg(this.anim, this.art.svg())) {
        el.classList.add('skinned');
        const img = new Image();
        img.draggable = false;
        img.alt = '';
        img.onload = () => {
          const ar = img.naturalWidth / img.naturalHeight || 1;
          this.w = Math.round(this.h * ar);
          this.sizeEl();
        };
        // Fallback (page blocks inline SVG): a static picture with a default face.
        const staticSvg = this.art
          .svg()
          .replace(/(<svg[^>]*>)/, '$1<style>.ev,.mv,.blush,.sweat,.shades,.prop{display:none}.ev-open,.mv-smile{display:inline}</style>');
        img.src = skin || 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(staticSvg);
        this.anim.appendChild(img);
        this.faceEmoji = div('face-emoji');
      } else {
        this.faceEmoji = null;
      }
      this.tag = div('tag');
      this.tag.textContent = this.name;
      this.wrap.appendChild(this.anim);
      el.append(this.wrap, this.tag);
      if (this.faceEmoji) el.appendChild(this.faceEmoji);
      this.el = el;
      this.emoteEl = null;
      this.sayEl = null;
      this.sizeEl();
      this.bindEvents();
      stage.appendChild(el);
      if (this.state) el.classList.add('s-' + this.state);
      el.dataset.prop = this.prop;
      this.applyExpr();
    }

    sizeEl() {
      this.el.style.width = this.w + 'px';
      this.el.style.height = this.h + 'px';
    }

    rebuild() {
      this.el.remove();
      for (const k in this.timers) clearTimeout(this.timers[k]);
      this.build();
    }

    destroy() {
      this.dead = true;
      this.endAct();
      for (const k in this.timers) clearTimeout(this.timers[k]);
      this.el.remove();
    }

    // ----- visual state -----
    setState(s) {
      if (s === this.state) return;
      if (this.state) this.el.classList.remove('s-' + this.state);
      this.state = s;
      this.el.classList.add('s-' + s);
      this.applyExpr();
    }

    baseExpr() {
      if (this.state === 'sleep') return 'sleepy';
      if (this.act && this.act.expr) return this.act.expr;
      return 'neutral';
    }

    applyExpr() {
      const name = this.expr || this.baseExpr();
      const e = EXPR[name] || EXPR.neutral;
      const ds = this.el.dataset;
      ds.eyes = e.e;
      ds.mouth = e.m;
      ds.blush = e.b ? '1' : '';
      ds.sweat = e.s ? '1' : '';
      ds.acc = e.acc || '';
      ds.mood = name === 'happy' || name === 'love' || name === 'excited' || name === 'shy' ? 'happy' : '';
      if (this.faceEmoji) this.faceEmoji.textContent = EXPR_EMOJI[name] || '';
    }

    setExpr(name, ms = 2000) {
      this.expr = name;
      this.exprUntil = now() + ms;
      this.applyExpr();
    }

    setProp(p, ms) {
      this.prop = p || '';
      this.el.dataset.prop = this.prop;
      clearTimeout(this.timers.prop);
      if (p && ms) this.timers.prop = setTimeout(() => this.setProp(''), ms);
    }

    bubble(kind, text, ms) {
      const key = kind + 'El';
      let b = this[key];
      if (!b) {
        b = this[key] = div(kind);
        this.el.appendChild(b);
      }
      b.textContent = text;
      b.classList.remove('show');
      void b.offsetWidth; // restart pop animation
      b.classList.add('show');
      if (kind === 'say') this.sayW = b.offsetWidth;
      clearTimeout(this.timers[kind]);
      this.timers[kind] = setTimeout(() => b.classList.remove('show'), ms);
    }

    emote(sym, ms = 1800) {
      if (sym) this.bubble('emote', sym, ms);
    }

    say(text, ms = 2600) {
      if (text) this.bubble('say', text, ms);
    }

    particles(sym, n = 3) {
      for (let i = 0; i < n; i++) {
        const p = div('particle');
        p.textContent = sym;
        p.style.left = rand(10, 75) + '%';
        p.style.top = rand(-5, 25) + '%';
        this.el.appendChild(p);
        const a = p.animate(
          [
            { transform: 'translate(0,0) scale(.6)', opacity: 0 },
            { transform: `translate(${rand(-8, 8)}px,-12px) scale(1)`, opacity: 1, offset: 0.2 },
            { transform: `translate(${rand(-14, 14)}px,-48px) scale(.9)`, opacity: 0 },
          ],
          { duration: 1100 + i * 150, delay: i * 140, easing: 'ease-out', fill: 'backwards' }
        );
        a.onfinish = () => p.remove();
      }
    }

    hop() {
      if (!this.grounded) return;
      this.anim.animate(
        [
          { transform: 'translateY(0) scale(1,1)' },
          { transform: 'translateY(0) scale(1.08,.9)', offset: 0.15 },
          { transform: 'translateY(-32%) scale(.95,1.06)', offset: 0.45 },
          { transform: 'translateY(0) scale(1.06,.93)', offset: 0.8 },
          { transform: 'translateY(0) scale(1,1)' },
        ],
        { duration: 480, easing: 'ease-out' }
      );
    }

    squash() {
      this.anim.animate(
        [{ transform: 'scale(1.15,.82)' }, { transform: 'scale(.96,1.05)' }, { transform: 'scale(1,1)' }],
        { duration: 260, easing: 'ease-out' }
      );
    }

    shake(ms = 600) {
      this.anim.animate(
        [{ transform: 'translateX(-3%)' }, { transform: 'translateX(3%)' }],
        { duration: 70, iterations: Math.ceil(ms / 70), direction: 'alternate' }
      );
    }

    // ----- actions -----
    isFree() {
      if (this.dead || !this.grounded || this.state === 'held') return false;
      const a = this.act;
      return !a || (!a.locked && (a.name === 'idle' || a.name === 'walk' || a.name === 'sit' || a.name === 'sniff'));
    }

    startAct(spec) {
      this.endAct();
      const a = Object.assign({}, spec);
      const def = ACTIONS[a.name];
      if (!def) return;
      this.act = a;
      def.start(this, a);
      this.applyExpr();
    }

    endAct() {
      const a = this.act;
      if (!a) return;
      this.act = null;
      const def = ACTIONS[a.name];
      if (def && def.end) def.end(this, a);
    }

    finishAct() {
      this.endAct();
      this.next();
    }

    // Queue a sequence of actions, interrupting what they're doing.
    order(seq, comeDown) {
      this.queue = seq.slice();
      if (this.state === 'held') return;
      if (this.clinging) return this.letGo();
      if (!this.grounded) return;
      if (comeDown && this.platform) return this.hopDown();
      this.endAct();
      this.next();
    }

    next() {
      if (this.dead) return;
      if (this.clinging && !this.queue.length) {
        return this.startAct({ name: 'climb', phase: 'hold', t: rand(1.5, 3.5) });
      }
      if (!this.grounded) return;
      if (this.queue.length) return this.startAct(this.queue.shift());
      if (now() - activity.last > 120000) {
        activity.dozing = true;
        return this.startAct({ name: 'sleep' });
      }

      const acts = Object.assign({}, this.p.acts);
      if (this.platform) {
        delete acts.climb;
        delete acts.perch;
        delete acts.run;
        delete acts.follow;
        acts.leave = (now() - this.platformSince) / 1000 > 25 ? 8 : 1.2;
      }
      if (!settings.roam) delete acts.perch;
      const partners = [];
      for (const o of members.values()) {
        if (o !== this && o.isFree() && o.platform === this.platform) partners.push(o);
      }
      if (!partners.length) delete acts.social;
      const kid = members.get('kid');
      if (!kid || !kid.grounded || kid.platform !== this.platform) delete acts.follow;

      const name = weighted(acts);
      switch (name) {
        case 'walk':
          return this.startAct({ name: 'walk' });
        case 'run':
          return this.startAct({ name: 'walk', run: true });
        case 'sneak':
          return this.startAct({ name: 'walk', sneak: true, expr: 'smug' });
        case 'social':
          return this.startAct({ name: 'social', who: pick(partners) });
        case 'follow':
          return this.startAct({ name: 'follow', who: kid });
        case 'leave': {
          const left = chance(0.5);
          return this.startAct({ name: 'walk', x: left ? this.minX - this.w : this.maxX + this.w, offEdge: true });
        }
        default:
          return this.startAct({ name });
      }
    }

    // ----- movement helpers -----
    startCling(side) {
      this.endAct();
      this.clinging = true;
      this.grounded = false;
      this.platform = null;
      this.wallSide = side;
      this.facing = side;
      this.vx = 0;
      this.vy = 0;
      this.thrown = false;
      this.setState('cling');
    }

    letGo() {
      this.clinging = false;
      this.endAct();
      this.vx = -this.wallSide * rand(60, 140);
      this.vy = -80;
      this.setState('fall');
      if (this.id === 'kid' && chance(0.6)) this.say(pick(['Wheee!', 'Cannonball!']), 1400);
      else if (chance(0.3)) this.emote(pick(['😆', '🤸']));
    }

    hopDown() {
      this.endAct();
      this.grounded = false;
      this.platform = null;
      this.vy = -260;
      this.vx = rand(-60, 60);
      this.setState('fall');
    }

    fallOff() {
      this.endAct();
      this.grounded = false;
      this.platform = null;
      this.vy = 0;
      this.setState('fall');
    }

    lookAtCursor() {
      if (activity.px < 0 || now() - activity.lastMove > 2500) return;
      if (Math.abs(activity.px - this.x) < 220 && Math.abs(activity.py - this.y) < 260) {
        const d = Math.sign(activity.px - this.x);
        if (d) this.facing = d;
      }
    }

    updateSurface() {
      if (this.platform) {
        const p = this.platform;
        if (!p.isConnected) return false;
        const r = p.getBoundingClientRect();
        if (r.width < 2 || r.height < 1 || r.top < this.h * 0.5 || r.top > FLOOR - 4) return false;
        if (this.x < r.left - 2 || this.x > r.right + 2) return false;
        this.y = r.top;
        this.minX = Math.max(r.left, 0) + this.w * 0.35;
        this.maxX = Math.min(r.right, VW) - this.w * 0.35;
        if (this.minX > this.maxX) this.minX = this.maxX = (this.minX + this.maxX) / 2;
        return true;
      }
      this.y = FLOOR;
      this.minX = this.w / 2;
      this.maxX = VW - this.w / 2;
      this.x = clamp(this.x, this.minX, this.maxX);
      return true;
    }

    physics(dt) {
      const y0 = this.y;
      this.vy = Math.min(this.vy + G * dt, 2600);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      const half = this.w / 2;
      if (this.x < half || this.x > VW - half) {
        const side = this.x < half ? -1 : 1;
        this.x = side < 0 ? half : VW - half;
        if (this.p.climber && this.thrown && Math.abs(this.vx) > 300 && this.y < FLOOR - 60 && chance(0.6)) {
          this.startCling(side);
          this.setExpr('surprised', 900);
          this.emote('❗', 900);
          return;
        }
        this.vx = -side * Math.abs(this.vx) * 0.45;
      }
      if (!this.entering && this.y < this.h) {
        this.y = this.h;
        if (this.vy < 0) this.vy = -this.vy * 0.3;
      }
      if (this.vy > 0 && settings.roam && !this.entering) {
        const hit = findLanding(this, y0, this.y);
        if (hit) return this.land(hit.el, hit.y);
      }
      if (this.y >= FLOOR) return this.land(null, FLOOR);
      if (this.state !== 'fall') this.setState('fall');
    }

    land(el, top) {
      const impact = this.vy;
      this.y = top;
      if (impact > 800 && !this.bounced) {
        this.bounced = true;
        this.firstImpact = impact;
        this.vy = -impact * 0.28;
        this.vx *= 0.6;
        this.y = top - 0.5;
        return;
      }
      const hardest = Math.max(impact, this.bounced ? this.firstImpact : 0);
      const wasThrown = this.thrown;
      const wasEntering = this.entering;
      this.bounced = false;
      this.thrown = false;
      this.entering = false;
      this.vx = 0;
      this.vy = 0;
      this.grounded = true;
      this.platform = el;
      this.platformSince = now();
      this.setState('idle');
      this.squash();
      if (!wasEntering && (hardest > 1250 || (wasThrown && hardest > 1000))) return this.dizzy();
      if (wasThrown && chance(0.4)) this.emote(pick(['😳', '😅', '✨']));
      this.next();
    }

    dizzy() {
      this.queue.unshift({ name: 'recover' });
      this.setExpr('dizzy', 2400);
      this.emote('💫', 2200);
      this.next();
      const others = [...members.values()].filter((o) => o !== this && o.grounded && !o.dead);
      const o = pick(others);
      if (!o) return;
      later(500, () => {
        if (o.id === 'dog') {
          o.emote('❗');
          if (o.isFree() && o.platform === this.platform) o.startAct({ name: 'follow', who: this, t: 3 });
        } else if (o.id === 'kid' && chance(0.5)) {
          o.setExpr('happy', 1500);
          o.say(pick(['Haha! Again!', 'Whoa, cool!']), 1600);
        } else {
          o.setExpr('surprised', 1500);
          o.say(pick(['You okay?!', 'Yikes!']), 1600);
        }
      });
    }

    update(dt, t) {
      if (this.expr && t > this.exprUntil) {
        this.expr = null;
        this.applyExpr();
      }
      if (this.state === 'held') {
        this.heldVX *= Math.pow(0.02, dt);
        const target = clamp(-this.heldVX * 0.025, -35, 35);
        this.tilt += (target - this.tilt) * Math.min(1, dt * 10);
        return;
      }
      if (this.clinging) {
        this.x = this.wallSide < 0 ? this.w * 0.32 : VW - this.w * 0.32;
        if (this.y < this.h + 4) this.y = this.h + 4;
        if (this.y > FLOOR) {
          this.y = FLOOR;
          this.clinging = false;
          this.grounded = true;
          this.platform = null;
          this.endAct();
        }
      } else if (this.grounded && !this.updateSurface()) {
        this.fallOff();
      }
      if (!this.grounded && !this.clinging) {
        this.physics(dt);
        return;
      }
      if (!this.act) this.next();
      const a = this.act;
      if (a && ACTIONS[a.name].update(this, a, dt, t) && this.act === a) this.finishAct();
    }

    render() {
      const tx = this.x - this.w / 2;
      const ty = this.y - this.h;
      this.el.style.transform = `translate3d(${tx.toFixed(1)}px,${ty.toFixed(1)}px,0)`;
      let tilt = 0;
      if (this.state === 'held') tilt = this.tilt;
      else if (this.thrown && !this.grounded) tilt = clamp(this.vx * 0.03, -25, 25);
      this.wrap.style.transform = `rotate(${tilt.toFixed(1)}deg) scaleX(${this.facing})`;
      this.el.classList.toggle('below', ty < 70);
      this.el.classList.toggle('on-floor', this.grounded && !this.platform);
      if (this.sayEl && this.sayEl.classList.contains('show')) {
        const w = this.sayW || 100;
        const left = this.x - w / 2;
        const dx = clamp(left, 4, Math.max(4, VW - w - 4)) - left;
        this.sayEl.style.setProperty('--dx', dx.toFixed(0) + 'px');
      }
    }

    // ----- cursor interaction -----
    bindEvents() {
      const el = this.el;
      el.addEventListener('pointerdown', (e) => this.onDown(e));
      el.addEventListener('pointermove', (e) => this.onMove(e));
      el.addEventListener('pointerup', (e) => this.onUp(e, false));
      el.addEventListener('pointercancel', (e) => this.onUp(e, true));
      el.addEventListener('lostpointercapture', (e) => this.onUp(e, true));
      el.addEventListener('pointerenter', () => this.onEnter());
      for (const type of ['click', 'mousedown', 'mouseup', 'dblclick', 'contextmenu']) {
        el.addEventListener(type, (e) => e.stopPropagation());
      }
    }

    onEnter() {
      if (this.state === 'held' || this.state === 'sleep' || this.expr) return;
      this.setExpr(this.id === 'dad' ? 'focused' : 'happy', 1200);
    }

    onDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      try {
        this.el.setPointerCapture(e.pointerId);
      } catch (_) { /* ignore */ }
      const t = now();
      this.press = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false, samples: [{ x: e.clientX, y: e.clientY, t }] };
    }

    onMove(e) {
      const pr = this.press;
      if (!pr || e.pointerId !== pr.id) {
        this.trackPetting(e);
        return;
      }
      e.preventDefault();
      const t = now();
      pr.samples.push({ x: e.clientX, y: e.clientY, t });
      while (pr.samples.length > 2 && t - pr.samples[0].t > 90) pr.samples.shift();
      if (!pr.dragging && Math.hypot(e.clientX - pr.x0, e.clientY - pr.y0) > 5) this.startDrag(pr);
      if (pr.dragging) {
        this.x = e.clientX - pr.offX;
        this.y = e.clientY - pr.offY;
        const s0 = pr.samples[0];
        const dtS = (t - s0.t) / 1000;
        if (dtS > 0.005) this.heldVX = (e.clientX - s0.x) / dtS;
      }
    }

    startDrag(pr) {
      pr.dragging = true;
      pr.offX = pr.x0 - this.x;
      pr.offY = pr.y0 - this.y;
      this.endAct();
      this.queue.length = 0;
      this.grounded = false;
      this.clinging = false;
      this.platform = null;
      this.vx = this.vy = 0;
      this.tilt = 0;
      this.heldVX = 0;
      this.setState('held');
      this.el.classList.add('held');
      if (this.id === 'dog') {
        this.setExpr(pick(['happy', 'surprised']), 600000);
        this.emote(pick(['❗', '🐾']));
      } else {
        this.setExpr(pick(['surprised', 'nervous', 'happy']), 600000);
        this.emote(pick(['😳', '❗', '🙌']));
        if (chance(0.35)) this.say(pick(['Whoa!', 'Put me down!', 'I can fly!', 'Hey!']), 1500);
      }
      const watcher = pick([...members.values()].filter((o) => o !== this && o.grounded));
      if (watcher && chance(0.6)) {
        later(300, () => {
          watcher.setExpr('surprised', 1400);
          watcher.emote(watcher.id === 'dog' ? '❗' : pick(['😮', '👀']));
        });
      }
    }

    onUp(e, cancel) {
      const pr = this.press;
      if (!pr || e.pointerId !== pr.id) return;
      this.press = null;
      if (pr.dragging) this.release(pr);
      else if (!cancel) this.onClick();
    }

    release(pr) {
      const s = pr.samples;
      const a = s[0];
      const b = s[s.length - 1];
      const dtS = (b.t - a.t) / 1000;
      let vx = 0;
      let vy = 0;
      if (dtS > 0.005 && now() - b.t < 120) {
        vx = clamp((b.x - a.x) / dtS, -1800, 1800);
        vy = clamp((b.y - a.y) / dtS, -1800, 1800);
      }
      this.el.classList.remove('held');
      this.expr = null;
      this.tilt = 0;
      this.vx = vx;
      this.vy = vy;
      this.thrown = Math.hypot(vx, vy) > 250;
      this.entering = false;
      this.setState('fall');
      // Dropped next to a wall? Climbers grab on.
      const nearWall = this.x < this.w * 0.9 ? -1 : this.x > VW - this.w * 0.9 ? 1 : 0;
      if (nearWall && this.p.climber && this.y < FLOOR - 40 && !this.thrown) {
        this.startCling(nearWall);
        this.y = Math.max(this.y, this.h + 4);
        this.next();
      }
    }

    onClick() {
      const t = now();
      const dbl = t - (this.lastClick || 0) < 330;
      this.lastClick = t;
      if (this.state === 'sleep') {
        this.setExpr('surprised', 1200);
        this.emote('❗');
        this.finishAct();
        return;
      }
      if (dbl) return this.special();
      this.hop();
      this.setExpr(this.id === 'dad' ? pick(['smug', 'focused', 'happy']) : pick(['happy', 'excited', 'surprised']), 1600);
      if (chance(0.55)) this.say(pick(this.p.click), 1800);
      else this.emote(pick(this.p.clickEmote));
      if (this.id === 'dog' && chance(0.3) && this.grounded && !this.platform) {
        later(400, () => this.isFree() && this.startAct({ name: 'chase', t: 4 }));
      }
    }

    special() {
      if (!this.grounded) return;
      switch (this.id) {
        case 'dad':
          this.say('This conversation never happened.', 2200);
          this.startAct({ name: 'walk', sneak: true, expr: 'smug', x: this.x + this.facing * 120 });
          break;
        case 'mom':
          this.say('Hi-yah!', 1400);
          this.startAct({ name: 'train', t: 1.6 });
          break;
        case 'kid':
          this.startAct({ name: 'dance', t: 2.5 });
          break;
        case 'dog':
          this.say('Arf arf!', 1400);
          this.startAct({ name: 'spin', t: 1.5 });
          break;
      }
    }

    trackPetting(e) {
      const t = now();
      if (t < this.pet.cool || this.state === 'held') return;
      const dir = Math.sign(e.movementX || 0);
      if (!dir || Math.abs(e.movementX) < 2) return;
      if (t - this.pet.since > 1300) {
        this.pet.count = 0;
        this.pet.since = t;
      }
      if (dir !== this.pet.dir) {
        this.pet.dir = dir;
        this.pet.count++;
      }
      if (this.pet.count >= 5) {
        this.pet.count = 0;
        this.pet.cool = t + 1800;
        this.petted();
      }
    }

    petted() {
      if (this.state === 'sleep') {
        this.setExpr('content', 2500);
        this.particles('💗', 2);
        return;
      }
      this.setExpr(this.id === 'dad' ? 'shy' : 'love', 2400);
      this.particles(this.id === 'dog' ? '💕' : pick(['💗', '💕', '✨']), 3);
      if (chance(0.4)) {
        const lines = {
          dad: ['...This is nice.', 'Ahem. Thank you.'],
          mom: ['Aww, thank you!', 'Hehe~'],
          kid: ['Hehehe!', 'More head pats!'],
          dog: ['*happy wiggle*', 'Awoo~'],
        };
        this.say(pick(lines[this.id]), 1600);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Actions. start() sets things up; update() returns true when finished.
  function stay(state, opt = {}) {
    return {
      start(m, a) {
        m.setState(a.state || state);
        if (a.t == null) a.t = rand(...(opt.t || [3, 6]));
        if (a.expr == null && opt.expr) a.expr = opt.expr;
        if (opt.prop) m.setProp(opt.prop);
        if (opt.emote && chance(opt.emoteChance == null ? 0.7 : opt.emoteChance)) m.emote(pick(opt.emote), 2000);
        if (opt.say && chance(opt.sayChance || 0.3)) m.say(pick(opt.say));
        a.el = 0;
      },
      update(m, a, dt) {
        a.el += dt;
        if (opt.tick) opt.tick(m, a, dt);
        return a.el >= a.t;
      },
      end(m) {
        if (opt.prop) m.setProp('');
      },
    };
  }

  const ACTIONS = {
    idle: {
      start(m, a) {
        m.setState('idle');
        if (a.t == null) a.t = rand(1.5, 4);
      },
      update(m, a, dt) {
        m.lookAtCursor();
        return (a.t -= dt) <= 0;
      },
    },

    walk: {
      start(m, a) {
        a.speed = (a.run ? 2.1 : a.sneak ? 0.55 : 1) * m.p.speed;
        if (a.x == null) {
          a.x = rand(m.minX, m.maxX);
          if (Math.abs(a.x - m.x) < 40) a.x = clamp(m.x + (chance(0.5) ? -1 : 1) * rand(60, 200), m.minX, m.maxX);
        }
        if (!a.offEdge) a.x = clamp(a.x, m.minX, m.maxX);
        if (a.timeout == null) a.timeout = 14;
        m.setState(a.run ? 'run' : a.sneak ? 'sneak' : 'walk');
      },
      update(m, a, dt) {
        a.timeout -= dt;
        const dx = a.x - m.x;
        if (Math.abs(dx) < 2 || a.timeout <= 0) return true;
        m.facing = Math.sign(dx);
        m.x += Math.sign(dx) * Math.min(Math.abs(dx), a.speed * dt);
        if (!a.offEdge) m.x = clamp(m.x, m.minX, m.maxX);
        else if (m.platform && (m.x < m.minX - m.w * 0.4 || m.x > m.maxX + m.w * 0.4)) m.fallOff();
        return false;
      },
    },

    climb: {
      start(m, a) {
        if (!m.p.climber) {
          a.fail = true;
          return;
        }
        a.side = a.side || (m.x < VW / 2 ? -1 : 1);
        a.phase = a.phase || 'approach';
        a.topY = rand(m.h + 30, Math.max(m.h + 40, FLOOR * 0.6));
        if (a.phase === 'approach') m.setState('walk');
        if (a.phase === 'hold') m.setState('cling');
      },
      update(m, a, dt) {
        if (a.fail) return true;
        if (a.phase === 'approach') {
          const wx = a.side < 0 ? m.minX : m.maxX;
          const dx = wx - m.x;
          if (Math.abs(dx) > 2) {
            m.facing = Math.sign(dx);
            m.x += Math.sign(dx) * Math.min(Math.abs(dx), m.p.speed * 1.2 * dt);
            return false;
          }
          m.startCling(a.side);
          m.act = a; // startCling ended the action; keep this one going
          a.phase = 'up';
          m.setState('climb');
          return false;
        }
        if (a.phase === 'up') {
          m.y -= m.p.climbSpeed * dt;
          if (m.y <= a.topY) {
            m.y = a.topY;
            a.phase = 'hold';
            a.t = rand(2, 5);
            m.setState('cling');
            if (chance(0.45)) m.emote(pick(m.p.climbEmote));
          }
          return false;
        }
        if (a.phase === 'hold') {
          if ((a.t -= dt) > 0) return false;
          if (chance(0.5)) {
            a.phase = 'down';
            m.setState('climb');
            return false;
          }
          m.letGo();
          return false;
        }
        // down
        m.y += m.p.climbSpeed * 1.4 * dt;
        if (m.y >= FLOOR) {
          m.y = FLOOR;
          m.clinging = false;
          m.grounded = true;
          m.platform = null;
          return true;
        }
        return false;
      },
    },

    perch: {
      start(m, a) {
        a.target = findPerch(m);
        if (!a.target) {
          a.fail = true;
          return;
        }
        a.x = clamp(rand(a.target.left, a.target.right), m.minX, m.maxX);
        a.timeout = 9;
        m.setState('walk');
      },
      update(m, a, dt) {
        if (a.fail) return true;
        a.timeout -= dt;
        const el = a.target.el;
        if (!el.isConnected || a.timeout < 0) return true;
        const r = el.getBoundingClientRect();
        if (r.top < 30 || r.top > FLOOR - 40 || FLOOR - r.top > m.p.jump) return true;
        const dx = a.x - m.x;
        if (Math.abs(dx) > 2) {
          m.facing = Math.sign(dx);
          m.x += Math.sign(dx) * Math.min(Math.abs(dx), m.p.speed * 1.3 * dt);
          m.setState('walk');
          return false;
        }
        if (m.x < r.left + 4 || m.x > r.right - 4) return true;
        const h = m.y - r.top;
        m.endAct();
        m.grounded = false;
        m.platform = null;
        m.vx = 0;
        m.vy = -Math.sqrt(2 * G * (h + 28));
        m.setState('fall');
        if (m.id === 'kid' && chance(0.4)) m.say(pick(['Hup!', 'Up we go!']), 1200);
        else if (m.id === 'dog' && chance(0.5)) m.emote('🐾');
        return false;
      },
    },

    social: {
      start(m, a) {
        a.t = 8;
        m.setState('walk');
      },
      update(m, a, dt) {
        const o = a.who;
        if (!o || o.dead || !o.grounded || o.platform !== m.platform || !o.isFree()) return true;
        if ((a.t -= dt) <= 0) return true;
        const gap = (o.w + m.w) / 2 + 2;
        const dx = o.x - m.x;
        if (Math.abs(dx) <= gap + 4) {
          startInteraction(m, o);
          return false;
        }
        const tx = o.x - Math.sign(dx) * gap;
        m.facing = Math.sign(dx);
        m.x += Math.sign(tx - m.x) * Math.min(Math.abs(tx - m.x), m.p.speed * 1.2 * dt);
        m.x = clamp(m.x, m.minX, m.maxX);
        m.setState('walk');
        return false;
      },
    },

    follow: {
      start(m, a) {
        if (a.t == null) a.t = rand(4, 8);
        m.setState('walk');
      },
      update(m, a, dt) {
        const o = a.who;
        if (!o || o.dead || (a.t -= dt) <= 0) return true;
        if (!o.grounded || o.platform !== m.platform) {
          m.setState('idle');
          return false;
        }
        const side = m.x < o.x ? -1 : 1;
        const tx = clamp(o.x + side * (o.w / 2 + m.w / 2 + 4), m.minX, m.maxX);
        const dx = tx - m.x;
        if (Math.abs(dx) < 4) {
          m.setState('idle');
          m.facing = Math.sign(o.x - m.x) || m.facing;
          return false;
        }
        const fast = Math.abs(dx) > 120;
        m.setState(fast ? 'run' : 'walk');
        m.facing = Math.sign(dx);
        m.x += Math.sign(dx) * Math.min(Math.abs(dx), m.p.speed * (fast ? 2 : 1) * dt);
        return false;
      },
    },

    chase: {
      start(m, a) {
        m.setState('run');
        a.expr = 'excited';
        m.emote('🐾');
      },
      update(m, a, dt) {
        if ((a.t -= dt) <= 0 || activity.px < 0) return true;
        const tx = clamp(activity.px, m.minX, m.maxX);
        const dx = tx - m.x;
        if (Math.abs(dx) < 6) {
          m.setState('idle');
          return false;
        }
        m.setState('run');
        m.facing = Math.sign(dx);
        m.x += Math.sign(dx) * Math.min(Math.abs(dx), m.p.speed * 2.3 * dt);
        return false;
      },
    },

    interact: {
      start(m, a) {
        a.el = 0;
        a.si = 0;
        a.locked = true;
        const k = KINDS[a.kind];
        m.setState(k.state ? k.state(m) : 'idle');
        if (k.start) k.start(m, a);
      },
      update(m, a, dt) {
        a.el += dt;
        const k = KINDS[a.kind];
        if (k.tick) k.tick(m, a, dt);
        if (a.role === 0 && a.script) {
          while (a.si < a.script.length && a.el >= a.si * 1.6 + 0.2) {
            const speaker = a.si % 2 === 0 ? m : a.partner;
            if (!speaker.dead) speaker.say(a.script[a.si], 1800);
            a.si++;
          }
        }
        if (a.el >= a.t) {
          if (k.finish) k.finish(m, a);
          return true;
        }
        return false;
      },
    },

    sit: stay('sit', { t: [4, 9] }),
    read: stay('sit', { t: [6, 12], prop: 'paper', expr: 'focused', emote: ['📰', '🤔', '☕'], emoteChance: 0.5 }),
    tinker: stay('tinker', { t: [3, 6], prop: 'wrench', expr: 'focused', emote: ['🔧', '⚙️', '💡'] }),
    train: stay('kick', { t: [2.5, 4], expr: 'focused', emote: ['💪', '🔥'], say: ['Hi-yah!', 'One more set!'] }),
    dance: stay('dance', { t: [3, 5], expr: 'happy', emote: ['🎵', '🎶', '✨'], emoteChance: 0.9 }),
    wave: stay('wave', { t: [1.3, 1.9], expr: 'happy', emote: ['👋'], emoteChance: 1 }),
    spin: stay('spin', { t: [1.2, 2], expr: 'excited', emote: ['🌀', '❗'] }),
    recover: stay('idle', { t: [2, 2.5] }),
    hops: stay('idle', {
      t: [1.6, 2.4],
      expr: 'excited',
      tick(m, a) {
        if (a.el > (a.nextHop || 0)) {
          a.nextHop = a.el + 0.55;
          m.hop();
        }
      },
    }),
    sniff: stay('sniff', {
      t: [2, 4],
      emote: ['👃', '❓'],
      emoteChance: 0.4,
      tick(m, a, dt) {
        m.x += m.facing * 18 * dt;
        if (m.x <= m.minX || m.x >= m.maxX) m.facing *= -1;
        m.x = clamp(m.x, m.minX, m.maxX);
      },
    }),
    nap: stay('sleep', { t: [8, 15], tick: snoreTick }),
    sleep: stay('sleep', { t: [25, 40], tick: snoreTick }),
  };

  function snoreTick(m, a) {
    if (a.el > (a.nextZ || 1)) {
      a.nextZ = a.el + rand(3, 5);
      m.emote('💤', 2200);
    }
  }

  // ---------------------------------------------------------------------------
  // Pair interactions
  const PAIRS = {
    'dad+mom': ['chat', 'chat', 'shy'],
    'dad+kid': ['highfive', 'chat', 'pat'],
    'kid+mom': ['hug', 'chat', 'highfive'],
    'dad+dog': ['pet'],
    'dog+mom': ['pet'],
    'dog+kid': ['play', 'pet'],
  };

  const CONVOS = {
    'dad+mom': [
      ['Busy day?', 'I fixed three gadgets!', 'Impressive.', 'Hehe ♥'],
      ['Dinner plans?', 'Something not on fire.', '...Deal.'],
      ['You look nice today.', 'O-oh! Thank you…'],
      ['Any news from HQ?', 'You tell me, Agent.', 'Classified.', 'Hmph!'],
    ],
    'dad+kid': [
      ['Homework done?', '...Mostly?', 'Pip.'],
      ['Want to learn a spy trick?', 'YES!!', 'Step one: be quiet.', '…'],
      ['Report, junior agent.', 'Everything is awesome!'],
    ],
    'kid+mom': [
      ['Mom! Look at this!', 'Wow, amazing!'],
      ['Can we build a robot?', 'Only a small one.', 'YAY!'],
      ['I\'m hungry…', 'Snacks after this!'],
    ],
    generic: [['Hi!', 'Hello!']],
  };

  const KINDS = {
    chat: { state: () => 'idle', finish: (m) => m.setExpr('happy', 1200) },
    shy: {
      state: () => 'idle',
      start(m) {
        m.setExpr('shy', 2600);
        m.particles('💕', 2);
      },
    },
    highfive: {
      state: (m) => (m.id === 'dog' ? 'idle' : 'highfive'),
      start(m, a) {
        m.setExpr('excited', 2000);
        if (a.role === 0) {
          m.emote('✋', 1400);
          later(500, () => m.particles('✨', 3));
        }
      },
    },
    hug: {
      state: () => 'hug',
      start(m) {
        m.setExpr('love', 2600);
        m.particles('💗', 2);
      },
    },
    pat: {
      state: (m) => (m.id === 'dad' ? 'pat' : 'idle'),
      start(m) {
        if (m.id === 'kid') {
          m.setExpr('shy', 2400);
          m.emote('😊');
        } else m.setExpr('happy', 2400);
      },
    },
    pet: {
      state: (m) => (m.id === 'dog' ? 'idle' : 'pet'),
      start(m) {
        if (m.id === 'dog') {
          m.setExpr('love', 2600);
          m.particles('💕', 3);
        } else {
          m.setExpr('happy', 2600);
          if (chance(0.4)) m.say(pick(['Good boy!', 'Who\'s a good dog?', 'Such a good pup.']), 1800);
        }
      },
    },
    play: {
      state: (m) => (m.id === 'dog' ? 'spin' : 'dance'),
      start(m) {
        m.setExpr('excited', 3000);
        m.emote(m.id === 'dog' ? '🐾' : '✨');
      },
    },
  };

  function startInteraction(a, b) {
    const pair = [a.id, b.id].sort().join('+');
    const kind = pick(PAIRS[pair] || ['chat']);
    let script = null;
    let t = 2.6;
    if (kind === 'chat') {
      script = pick(CONVOS[pair] || CONVOS.generic).map((line) =>
        line.replace(/\bPip\b/g, (members.get('kid') || {}).name || 'Pip')
      );
      t = script.length * 1.6 + 1;
    }
    a.facing = Math.sign(b.x - a.x) || 1;
    b.facing = -a.facing;
    a.startAct({ name: 'interact', kind, partner: b, role: 0, t, script });
    b.startAct({ name: 'interact', kind, partner: a, role: 1, t });
  }

  // ---------------------------------------------------------------------------
  // Page geometry: landing on and jumping onto page elements
  const PERCH_SEL =
    'img,video,canvas,h1,h2,h3,button,input,textarea,select,table,pre,blockquote,nav,header,figure,iframe,[role="button"],[class*="card" i]';

  function findLanding(m, y0, y1) {
    if (y1 < 8 || y0 > FLOOR - 12) return null;
    let list;
    try {
      list = document.elementsFromPoint(m.x, Math.min(y1 + 1, FLOOR - 1));
    } catch (_) {
      return null;
    }
    const minW = Math.min(60, m.w);
    for (let i = 0; i < list.length && i < 14; i++) {
      const el = list[i];
      if (el === host || el === document.documentElement || el === document.body) continue;
      const r = el.getBoundingClientRect();
      if (r.top >= y0 - 0.5 && r.top <= y1 + 1 && r.width >= minW && r.top > m.h * 0.9 && r.top < FLOOR - 12) {
        const cs = getComputedStyle(el);
        if (cs.visibility !== 'hidden' && cs.opacity !== '0') return { el, y: r.top };
      }
    }
    return null;
  }

  function findPerch(m) {
    if (!m.grounded || m.platform) return null;
    const els = document.querySelectorAll(PERCH_SEL);
    const out = [];
    const lim = Math.min(els.length, 400);
    for (let i = 0; i < lim; i++) {
      const el = els[i];
      const r = el.getBoundingClientRect();
      if (r.width < m.w * 1.3 || r.height < 8) continue;
      if (r.top < m.h + 20 || r.top > FLOOR - 50 || FLOOR - r.top > m.p.jump) continue;
      const left = Math.max(r.left, 0) + m.w * 0.6;
      const right = Math.min(r.right, VW) - m.w * 0.6;
      if (right <= left) continue;
      out.push({ el, left, right, top: r.top });
    }
    for (let tries = 0; tries < 5 && out.length; tries++) {
      const i = (Math.random() * out.length) | 0;
      const c = out[i];
      const hit = document.elementFromPoint((c.left + c.right) / 2, c.top + 3);
      if (hit && (hit === c.el || c.el.contains(hit))) return c;
      out.splice(i, 1);
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Group helpers
  function later(ms, fn) {
    setTimeout(() => {
      if (host) fn();
    }, ms);
  }
  function each(fn) {
    for (const m of members.values()) fn(m);
  }
  function who(id, delay, fn) {
    later(delay || 0, () => {
      const m = members.get(id);
      if (m && !m.dead) fn(m);
    });
  }

  function command(cmd) {
    const offs = { dad: -1.5, mom: -0.5, kid: 0.5, dog: 1.5 };
    switch (cmd) {
      case 'gather':
        each((m) =>
          m.order(
            [
              { name: 'walk', x: VW / 2 + offs[m.id] * 62 * settings.scale, run: true },
              { name: 'wave', t: 2 },
            ],
            true
          )
        );
        break;
      case 'party':
        each((m) => {
          m.order([{ name: m.id === 'dog' ? 'spin' : 'dance', t: 6 }], false);
          later(rand(0, 600), () => m.emote(pick(['🎉', '🎵', '🎶', '🥳']), 2000));
        });
        break;
      case 'sleep':
        each((m) => m.order([{ name: 'sleep', t: 30 }], true));
        break;
      case 'wave':
        each((m) => m.order([{ name: m.id === 'dog' ? 'spin' : 'wave', t: 2 }], false));
        who('kid', 300, (m) => m.say('Hiii!', 1600));
        break;
      case 'wake':
        wakeAll();
        break;
    }
  }

  function wakeAll() {
    activity.dozing = false;
    each((m) => {
      if (m.act && (m.act.name === 'sleep' || m.act.name === 'nap')) {
        m.setExpr('surprised', 1200);
        m.emote('❗', 1200);
        m.finishAct();
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Search reactions
  const REACTIONS = [
    {
      w: ['peanut', 'snack', 'food', 'recipe', 'pizza', 'cake', 'cookie', 'burger', 'sushi', 'ice cream', 'dessert', 'restaurant', 'lunch', 'dinner', 'breakfast', 'candy', 'chocolate', 'donut', 'pasta', 'taco', 'ramen', 'bakery', 'pancake'],
      run() {
        each((m) => {
          m.setExpr(m.id === 'dad' ? 'happy' : 'love', 3500);
          m.hop();
        });
        who('kid', 0, (m) => {
          m.say(pick(['Snack time?!', 'I want some!', 'Yum yum yum!']));
          m.emote('🤤');
        });
        who('dog', 200, (m) => {
          m.emote('🍖');
          m.setProp('bone', 6000);
        });
        who('dad', 1600, (m) => m.say('Dinner is decided, then.', 2200));
      },
    },
    {
      w: ['spy', 'spies', 'secret', 'mission', 'agent', 'detective', 'undercover', 'espionage', 'disguise', 'cipher', 'heist', 'mystery', 'gadget'],
      run() {
        who('dad', 0, (m) => {
          m.say('Mission accepted.', 2200);
          m.order([{ name: 'walk', sneak: true, expr: 'smug', x: rand(m.minX, m.maxX) }], false);
        });
        who('kid', 1200, (m) => {
          m.setExpr('excited', 3000);
          m.say('Ooh, a secret mission!');
          m.hop();
        });
        who('mom', 600, (m) => m.emote('🤫'));
        who('dog', 900, (m) => m.emote('🔍'));
      },
    },
    {
      w: ['dog', 'puppy', 'puppies', 'doggo', 'dachshund', 'pup', 'pet', 'pets', 'wiener dog'],
      run() {
        who('dog', 0, (m) => {
          m.setExpr('excited', 3000);
          m.say('Woof woof!');
          m.order([{ name: 'spin', t: 2 }], false);
        });
        who('kid', 500, (m) => {
          m.setExpr('love', 2500);
          m.emote('💕');
        });
      },
    },
    {
      w: ['cat', 'kitten', 'kitty', 'cats'],
      run() {
        who('dog', 0, (m) => {
          m.setExpr('angry', 3000);
          m.say('Grrr…');
          m.shake(800);
        });
        who('kid', 700, (m) => {
          m.setExpr('love', 2500);
          m.emote('😻');
        });
      },
    },
    {
      w: ['homework', 'math', 'exam', 'test', 'quiz', 'study', 'school', 'essay', 'grades', 'algebra', 'calculus', 'report card', 'worksheet'],
      run() {
        who('kid', 0, (m) => {
          m.setExpr('scared', 3200);
          m.emote('😱');
          m.say('N-not homework…');
          m.shake(900);
        });
        who('dad', 1400, (m) => {
          m.setExpr('focused', 2500);
          m.say(`Study hard, ${(members.get('kid') || {}).name || 'kiddo'}.`);
        });
        who('mom', 900, (m) => m.emote('📚'));
      },
    },
    {
      w: ['scary', 'horror', 'ghost', 'zombie', 'monster', 'haunted', 'creepy', 'spider', 'halloween', 'nightmare', 'vampire'],
      run() {
        each((m) => {
          m.setExpr('scared', 3000);
          m.shake(700);
        });
        who('kid', 300, (m) => {
          m.emote('😱');
          const mom = members.get('mom');
          if (mom && mom.grounded && m.grounded && mom.platform === m.platform) {
            m.order([{ name: 'follow', who: mom, t: 4, expr: 'scared' }], false);
          }
        });
        who('dog', 200, (m) => m.say('Woof?!', 1500));
        who('dad', 1200, (m) => m.say('Stay behind me.'));
      },
    },
    {
      w: ['love', 'romance', 'romantic', 'wedding', 'date', 'valentine', 'couple', 'anniversary', 'kiss', 'crush'],
      run() {
        who('dad', 0, (m) => {
          m.setExpr('shy', 3000);
          m.particles('💕', 2);
        });
        who('mom', 200, (m) => {
          m.setExpr('shy', 3000);
          m.particles('💗', 2);
        });
        who('kid', 900, (m) => {
          m.setExpr('smug', 2500);
          m.say('Ooooh~');
        });
        who('dog', 500, (m) => m.emote('💕'));
      },
    },
    {
      w: ['workout', 'gym', 'fitness', 'martial', 'karate', 'boxing', 'exercise', 'yoga', 'kick', 'training', 'marathon', 'running', 'sport', 'sports'],
      run() {
        who('mom', 0, (m) => {
          m.say('Let\'s train!');
          m.order([{ name: 'train', t: 4 }], false);
        });
        who('kid', 600, (m) => {
          m.emote('💪');
          m.order([{ name: 'hops' }], false);
        });
        who('dad', 1000, (m) => m.emote('😅'));
      },
    },
    {
      w: ['cartoon', 'anime', 'movie', 'movies', 'tv', 'game', 'games', 'toy', 'toys', 'netflix', 'video game', 'minecraft', 'comic', 'comics', 'trailer'],
      run() {
        who('kid', 0, (m) => {
          m.setExpr('excited', 3500);
          m.say('Ooh! Can we watch?!');
          m.order([{ name: 'dance', t: 4 }], false);
        });
        who('dog', 700, (m) => m.order([{ name: 'spin', t: 1.5 }], false));
      },
    },
    {
      w: ['rain', 'weather', 'storm', 'snow', 'forecast', 'umbrella', 'sunny', 'hurricane', 'thunder'],
      run(q) {
        const sym = /snow/.test(q) ? '❄️' : /sun/.test(q) ? '☀️' : /storm|thunder|hurricane/.test(q) ? '⛈️' : '☔';
        let d = 0;
        each((m) => later((d += 250), () => m.emote(sym, 2200)));
      },
    },
    {
      w: ['sleep', 'tired', 'nap', 'insomnia', 'bed', 'bedtime', 'yawn', 'pillow'],
      run() {
        let d = 0;
        each((m) =>
          later((d += 300), () => {
            m.setExpr('sleepy', 2500);
            m.emote('🥱');
          })
        );
        who('dog', 1500, (m) => m.order([{ name: 'nap' }], false));
      },
    },
    {
      w: ['money', 'bank', 'tax', 'taxes', 'budget', 'bill', 'bills', 'price', 'rent', 'mortgage', 'loan', 'salary', 'invoice'],
      run() {
        who('dad', 0, (m) => {
          m.setExpr('nervous', 3000);
          m.emote('💸');
          m.say('Ah… expenses.');
        });
        who('mom', 900, (m) => m.emote('🧾'));
      },
    },
    {
      w: ['music', 'song', 'songs', 'dance', 'party', 'concert', 'playlist', 'karaoke', 'guitar', 'piano', 'dj'],
      run() {
        command('party');
      },
    },
    {
      w: ['flower', 'flowers', 'garden', 'gardening', 'plant', 'plants', 'rose', 'tulip', 'bouquet'],
      run() {
        who('mom', 0, (m) => {
          m.setExpr('love', 3000);
          m.emote('🌸');
          m.say('So pretty!');
        });
        who('dog', 600, (m) => m.order([{ name: 'sniff' }], false));
      },
    },
    {
      w: ['robot', 'engineering', 'invention', 'science', 'tools', 'diy', 'repair', 'circuit', '3d print', 'arduino', 'coding', 'programming', 'javascript', 'python'],
      run() {
        who('mom', 0, (m) => {
          m.setExpr('excited', 3000);
          m.say('Ooh, a project!');
          m.order([{ name: 'tinker', t: 4 }], false);
        });
        who('kid', 1000, (m) => m.emote('🤖'));
      },
    },
    {
      w: ['coffee', 'tea', 'espresso', 'latte', 'cafe', 'cappuccino'],
      run() {
        who('dad', 0, (m) => {
          m.setExpr('content', 3000);
          m.emote('☕');
          m.say('Now we\'re talking.');
        });
      },
    },
  ];
  for (const r of REACTIONS) {
    const alts = r.w.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    r.re = new RegExp(`\\b(?:${alts})(?:s|es)?\\b`, 'i');
  }

  function reactDefault() {
    const m = pick([...members.values()].filter((o) => !o.dead && o.state !== 'held'));
    if (!m) return;
    m.setExpr(pick(['focused', 'surprised']), 2200);
    m.emote(pick(['🤔', '🔍', '❓', '👀']));
    if (chance(0.5)) {
      const lines = {
        dad: ['Researching, are we?', 'Gathering intel…'],
        mom: ['Ooh, what\'s that?', 'Interesting!'],
        kid: ['What\'s that mean?', 'Ooh, can I see?'],
        dog: ['*head tilt*'],
      };
      m.say(pick(lines[m.id]), 2200);
    }
  }

  function react(q) {
    if (!settings.reactToSearch || !q || !members.size) return;
    q = String(q).toLowerCase().trim().slice(0, 200);
    if (!q || q === lastQuery) return;
    lastQuery = q;
    const hit = REACTIONS.find((r) => r.re.test(q));
    later(500, () => (hit ? hit.run(q) : reactDefault()));
  }

  function getSearchQuery(href) {
    let u;
    try {
      u = new URL(href);
    } catch (_) {
      return null;
    }
    const h = u.hostname;
    const p = u.searchParams;
    const path = u.pathname;
    if (/(^|\.)google\./.test(h) && path.startsWith('/search')) return p.get('q');
    if (/(^|\.)bing\.com$/.test(h) && path.startsWith('/search')) return p.get('q');
    if (/(^|\.)duckduckgo\.com$/.test(h)) return p.get('q');
    if (/(^|\.)youtube\.com$/.test(h) && path.startsWith('/results')) return p.get('search_query');
    if (/search\.yahoo\.com$/.test(h)) return p.get('p');
    if (/(^|\.)ecosia\.org$/.test(h) || /search\.brave\.com$/.test(h)) return p.get('q');
    if (/(^|\.)wikipedia\.org$/.test(h)) {
      if (p.get('search')) return p.get('search');
      if (path.startsWith('/wiki/')) {
        try {
          return decodeURIComponent(path.slice(6)).replace(/_/g, ' ');
        } catch (_) {
          return null;
        }
      }
    }
    if (/search/i.test(path)) return p.get('q') || p.get('query') || p.get('search') || p.get('k');
    return null;
  }

  function isSearchField(el) {
    if (!el || (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) return false;
    if (el.type === 'password') return false;
    const name = (el.name || '').toLowerCase();
    const label = ((el.getAttribute('aria-label') || '') + ' ' + (el.placeholder || '')).toLowerCase();
    const role = el.getAttribute('role');
    return (
      el.type === 'search' ||
      role === 'searchbox' ||
      /^(q|query|search|search_query|p|k|keyword|keywords|searchterm)$/.test(name) ||
      /search/.test(label)
    );
  }

  // ---------------------------------------------------------------------------
  // Work emotes (we only count keystrokes; nothing typed is ever read or stored)
  const WORK = {
    dad: { emotes: ['☕', '👍', '📈', '🕶️'], lines: ['Good work, agent.', 'Efficient.', 'Keep it up.'] },
    mom: { emotes: ['💪', '🌟', '🔧'], lines: ['You got this!', 'Nice typing!', 'Power through!'] },
    kid: { emotes: ['✨', '📝', '🤩'], lines: ['So many words!', 'You type so fast!', 'Can I help?'] },
    dog: { emotes: ['🐾', '😊', '🦴'], lines: ['Woof!', '*happy panting*'] },
  };

  function cheer() {
    const free = [...members.values()].filter((m) => m.grounded || m.clinging);
    const m = pick(free);
    if (!m) return;
    const w = WORK[m.id];
    m.setExpr(pick(['happy', 'excited', 'focused']), 2000);
    if (chance(0.55)) m.emote(pick(w.emotes), 2200);
    else m.say(pick(w.lines), 2200);
    if (chance(0.5)) m.hop();
    const o = pick(free.filter((x) => x !== m));
    if (o && chance(0.3)) later(900, () => o.emote(pick(WORK[o.id].emotes), 2000));
  }

  function onKey(e) {
    noteActivity();
    if (!host || !members.size) return;
    const t = now();
    if (e.key === 'Enter') {
      const target = e.composedPath ? e.composedPath()[0] : e.target;
      if (isSearchField(target)) react(target.value);
    }
    if (!settings.workEmotes) return;
    activity.keys.push(t);
    while (activity.keys.length && t - activity.keys[0] > 10000) activity.keys.shift();
    if (activity.keys.length >= 18 && t - activity.lastWork > 20000) {
      activity.lastWork = t;
      activity.keys.length = 0;
      cheer();
    }
  }

  function noteActivity() {
    activity.last = now();
    if (activity.dozing) wakeAll();
  }

  function onPointerMove(e) {
    const t = now();
    const dt = (t - activity.lastMove) / 1000;
    const speed = activity.px >= 0 && dt > 0 ? Math.hypot(e.clientX - activity.px, e.clientY - activity.py) / dt : 0;
    activity.px = e.clientX;
    activity.py = e.clientY;
    activity.lastMove = t;
    noteActivity();
    // The dog sometimes chases a fast-moving cursor near the floor.
    const dog = members.get('dog');
    if (dog && speed > 1400 && e.clientY > FLOOR - 140 && t - activity.lastChase > 15000 && dog.isFree() && !dog.platform && chance(0.08)) {
      activity.lastChase = t;
      dog.startAct({ name: 'chase', t: 4 });
    }
  }

  // ---------------------------------------------------------------------------
  // Mounting, settings, main loop
  function mount() {
    if (host) return;
    host = document.createElement('covert-crew-stage');
    host.style.cssText =
      'all:initial!important;position:fixed!important;inset:0!important;width:0!important;height:0!important;' +
      'z-index:2147483646!important;pointer-events:none!important;display:block!important;';
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = CC.css;
    stage = div('stage');
    root.append(style, stage);
    document.documentElement.appendChild(host);
    measure();
    lastFrame = now();
    raf = requestAnimationFrame(loop);
  }

  function teardown() {
    cancelAnimationFrame(raf);
    raf = 0;
    for (const m of members.values()) m.destroy();
    members.clear();
    if (host) host.remove();
    host = null;
    stage = null;
  }

  function apply() {
    const allowed = settings.enabled && !settings.disabledSites.includes(location.hostname);
    if (!allowed) return teardown();
    mount();
    for (const id of IDS) {
      const want = settings.members[id] !== false;
      const m = members.get(id);
      if (want && !m) members.set(id, new Member(id));
      else if (!want && m) {
        m.destroy();
        members.delete(id);
      }
    }
  }

  function loop(t) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0, (t - lastFrame) / 1000));
    lastFrame = t;
    for (const m of members.values()) {
      m.update(dt, t);
      m.render();
    }
    if (t - lastHousekeep > 1000) housekeeping(t);
  }

  function housekeeping(t) {
    lastHousekeep = t;
    measure();
    if (host && !host.isConnected) document.documentElement.appendChild(host);
    if (stage) stage.classList.toggle('hidden', !!document.fullscreenElement);
    if (location.href !== lastHref) {
      lastHref = location.href;
      react(getSearchQuery(lastHref));
    }
  }

  function loadAll() {
    return new Promise((resolve) => {
      if (!chromeApi) return resolve({});
      try {
        chromeApi.storage.local.get(['settings', 'skins'], (r) => resolve(r || {}));
      } catch (_) {
        resolve({});
      }
    });
  }

  async function init() {
    const r = await loadAll();
    settings = CC.mergeSettings(r.settings);
    skins = r.skins || {};
    apply();

    window.addEventListener('resize', measure, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true, capture: true });
    window.addEventListener('keydown', onKey, { passive: true, capture: true });
    window.addEventListener('scroll', noteActivity, { passive: true, capture: true });
    window.addEventListener('wheel', noteActivity, { passive: true, capture: true });
    document.addEventListener(
      'submit',
      (e) => {
        const form = e.target;
        if (!form || !form.querySelectorAll) return;
        for (const el of form.querySelectorAll('input,textarea')) {
          if (isSearchField(el) && el.value) return react(el.value);
        }
      },
      true
    );

    // React to a search that brought us to this page.
    const q = getSearchQuery(location.href);
    if (q) setTimeout(() => react(q), 2200);

    if (chromeApi) {
      chromeApi.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        let restyle = false;
        if (changes.settings) {
          const prev = settings;
          settings = CC.mergeSettings(changes.settings.newValue);
          restyle = prev.scale !== settings.scale || JSON.stringify(prev.names) !== JSON.stringify(settings.names);
        }
        if (changes.skins) {
          skins = changes.skins.newValue || {};
          restyle = true;
        }
        if (restyle) for (const m of members.values()) m.rebuild();
        apply();
      });
      chromeApi.runtime.onMessage.addListener((msg, _sender, reply) => {
        if (!msg || msg.type !== 'covert-crew') return;
        if (msg.cmd === 'ping') reply({ ok: true, count: members.size });
        else {
          if (host) command(msg.cmd);
          reply({ ok: !!host });
        }
      });
    }
  }

  // Exposed for the demo page.
  CC.command = command;
  CC.react = react;
  CC.members = members;

  init();
})();
