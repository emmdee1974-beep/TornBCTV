(() => {
  'use strict';

  if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;

  const synth = window.speechSynthesis;
  const chapterConfigs = {
    'part-1': { label: 'Wind + distant thunder', ambience: 'wind' },
    'part-2': { label: 'Armory workshop hum', ambience: 'armory' },
    'part-3': { label: 'Rain + distant thunder', ambience: 'rain' },
    'part-4': { label: 'Ocean wind', ambience: 'ocean' }
  };

  const profiles = {
    Narrator:      { pitch: 0.84, rate: 0.84, volume: 1.00, voiceSlot: 0 },
    'Young Man':   { pitch: 1.06, rate: 1.00, volume: 1.00, voiceSlot: 1 },
    Mikhail:       { pitch: 0.72, rate: 0.88, volume: 1.00, voiceSlot: 2 },
    LoneBlackBear: { pitch: 0.68, rate: 0.86, volume: 1.00, voiceSlot: 3 },
    Lexi:          { pitch: 1.18, rate: 1.00, volume: 1.00, voiceSlot: 4 },
    DirtyJoe:      { pitch: 0.90, rate: 1.02, volume: 1.00, voiceSlot: 5 },
    Zeph1r:        { pitch: 0.82, rate: 0.96, volume: 1.00, voiceSlot: 6 },
    'Older Maker': { pitch: 0.78, rate: 0.90, volume: 1.00, voiceSlot: 7 }
  };

  let voices = [];
  let activePlayer = null;

  function narratorVoiceScore(v) {
    const name = (v.name || '').toLowerCase();
    const lang = (v.lang || '').toLowerCase();
    let score = 0;
    if (/en-gb|en_uk|en-uk/.test(lang)) score += 60;
    else if (/^en/.test(lang)) score += 20;
    if (/daniel|george|ryan|arthur|oliver|edward|male/.test(name)) score += 35;
    if (/natural|neural|enhanced|premium|online/.test(name)) score += 45;
    if (/microsoft|google|apple/.test(name)) score += 10;
    if (/zira|samantha|victoria|karen|female/.test(name)) score -= 20;
    return score;
  }

  function refreshVoices() {
    voices = synth.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang || ''));
    if (!voices.length) voices = synth.getVoices();
    voices.sort((a,b) => narratorVoiceScore(b) - narratorVoiceScore(a));
  }
  refreshVoices();
  synth.addEventListener?.('voiceschanged', refreshVoices);
  window.addEventListener('beforeunload', () => synth.cancel());

  function quoteSpeaker(quote, chapterId) {
    const q = quote.trim().toLowerCase();
    if (chapterId === 'part-1') {
      if (q.includes("we're better without them") || q.includes('you dreaming of thunder') || q.includes('they were called guns') || q.includes('i built millions') || q.includes('you learned the sound of thunder')) return 'Mikhail';
      if (q.includes('you built one') || q === 'hey!' || q.includes("i'm cool, man")) return 'Young Man';
      if (q.includes('drop it, punk') || q.includes('make my day') || q.includes('you can make more')) return 'Lexi';
      if (q.includes('do what she says')) return 'LoneBlackBear';
      if (q.includes('found him') || q.includes('we tried building one') || q.includes("you're one of us now")) return 'DirtyJoe';
    }
    if (chapterId === 'part-2' && q.includes("you're all dead")) return 'LoneBlackBear';
    if (chapterId === 'part-3') {
      if (q.includes('you know the plan') || q.includes('get down!') || q.includes('hands on your heads')) return 'LoneBlackBear';
      if (q.includes('that stupid')) return 'Zeph1r';
      if (q.includes("i'm happy you made it back") || q.includes('you left the old you behind') || q.includes("the man who didn't take a life")) return 'Mikhail';
      if (q.includes("we're all here") || q.includes("i'm still the same") || q.includes('i only did what had to be done')) return 'Young Man';
    }
    if (chapterId === 'part-4') {
      if (q.includes('was it worth it') || q.includes("you came lookin' for the crimson") || q.includes('you better know what crimson really means') || q.includes("if you're gonna wake the ghosts")) return 'Older Maker';
    }
    return 'Narrator';
  }

  function splitParagraph(text, chapterId, paragraph) {
    const parts = text.split(/("[^"]+")/g).filter(Boolean);
    return parts.map(part => {
      const quoted = /^".*"$/.test(part.trim());
      const clean = quoted ? part.trim().slice(1, -1) : part;
      return {
        text: clean.trim(),
        speaker: quoted ? quoteSpeaker(clean, chapterId) : 'Narrator',
        paragraph
      };
    }).filter(x => x.text);
  }

  function chooseVoice(speaker) {
    if (!voices.length) return null;
    const p = profiles[speaker] || profiles.Narrator;
    if (speaker === 'Narrator') return voices[0] || null;
    const preferred = {
      Mikhail: /pavel|yuri|dmitri|russian|male/i,
      LoneBlackBear: /david|mark|george|guy|male/i,
      Lexi: /zira|samantha|victoria|karen|female/i,
      DirtyJoe: /mark|david|guy|male/i,
      Zeph1r: /george|daniel|male/i,
      'Young Man': /alex|ryan|guy|male/i,
      'Older Maker': /david|george|daniel|male/i
    }[speaker];
    const match = preferred && voices.find(v => preferred.test(v.name));
    return match || voices[p.voiceSlot % voices.length];
  }

  function makeNoise(ctx) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    return src;
  }

  class Ambience {
    constructor(type) {
      this.type = type;
      this.ctx = null;
      this.nodes = [];
      this.timers = [];
    }

    async start() {
      if (this.ctx) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      this.ctx = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      const master = ctx.createGain();
      master.gain.value = 0.32;
      master.connect(ctx.destination);
      this.nodes.push(master);

      if (this.type === 'armory') this.armory(ctx, master);
      else if (this.type === 'rain') this.rain(ctx, master);
      else if (this.type === 'ocean') this.ocean(ctx, master);
      else this.wind(ctx, master);
    }

    noiseBed(ctx, master, filterType, freq, gainValue) {
      const src = makeNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.value = gainValue;
      src.connect(filter).connect(gain).connect(master);
      src.start();
      this.nodes.push(src, filter, gain);
      return gain;
    }

    wind(ctx, master) {
      const gain = this.noiseBed(ctx, master, 'lowpass', 850, 0.045);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.08;
      lfoGain.gain.value = 0.018;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      this.nodes.push(lfo, lfoGain);
      this.scheduleThunder(ctx, master, 15000, 36000);
    }

    armory(ctx, master) {
      this.noiseBed(ctx, master, 'lowpass', 650, 0.012);
      const hum = ctx.createOscillator();
      const humGain = ctx.createGain();
      hum.type = 'sine';
      hum.frequency.value = 58;
      humGain.gain.value = 0.008;
      hum.connect(humGain).connect(master);
      hum.start();
      this.nodes.push(hum, humGain);
      const tick = () => {
        if (!this.ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = 700 + Math.random() * 900;
        g.gain.setValueAtTime(0.018, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035);
        osc.connect(g).connect(master);
        osc.start(); osc.stop(ctx.currentTime + 0.04);
        this.timers.push(setTimeout(tick, 4500 + Math.random() * 8500));
      };
      this.timers.push(setTimeout(tick, 3500));
    }

    rain(ctx, master) {
      this.noiseBed(ctx, master, 'highpass', 1200, 0.055);
      this.noiseBed(ctx, master, 'bandpass', 3800, 0.022);
      this.scheduleThunder(ctx, master, 11000, 26000);
    }

    ocean(ctx, master) {
      const gain = this.noiseBed(ctx, master, 'lowpass', 520, 0.038);
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 0.020;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();
      this.nodes.push(lfo, lfoGain);
      this.noiseBed(ctx, master, 'bandpass', 1200, 0.009);
    }

    scheduleThunder(ctx, master, minMs, maxMs) {
      const thunder = () => {
        if (!this.ctx) return;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(72, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(28, ctx.currentTime + 2.2);
        filter.type = 'lowpass'; filter.frequency.value = 180;
        g.gain.setValueAtTime(0.0001, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.055, ctx.currentTime + 0.08);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);
        osc.connect(filter).connect(g).connect(master);
        osc.start(); osc.stop(ctx.currentTime + 2.6);
        const next = minMs + Math.random() * (maxMs - minMs);
        this.timers.push(setTimeout(thunder, next));
      };
      this.timers.push(setTimeout(thunder, 7000 + Math.random() * 7000));
    }

    stop() {
      this.timers.forEach(clearTimeout);
      this.timers = [];
      if (this.ctx) {
        this.ctx.close().catch(() => {});
        this.ctx = null;
      }
      this.nodes = [];
    }
  }

  function dramaticPauseFor(text, paragraph, nextParagraph) {
    const t = (text || '').trim();
    if (/^THUNDER[.!]?$/i.test(t)) return 900;
    if (/^Mistake[.!]?$/i.test(t)) return 700;
    if (/…$/.test(t)) return 550;
    if (/[!?]["']?$/.test(t)) return 360;
    if (nextParagraph && nextParagraph !== paragraph) return 520;
    return 150;
  }

  class ChapterPlayer {
    constructor(section) {
      this.section = section;
      this.id = section.id;
      this.config = chapterConfigs[this.id];
      this.article = section.querySelector('.fullStoryText');
      this.paragraphs = [...this.article.querySelectorAll('p')];
      this.segments = this.paragraphs.flatMap(p => splitParagraph(p.textContent, this.id, p));
      this.index = 0;
      this.state = 'stopped';
      this.ambience = null;
      this.currentParagraph = null;
      this.buildControls();
    }

    buildControls() {
      const box = document.createElement('div');
      box.className = 'audioDramaBar';
      box.innerHTML = `
        <div class="audioDramaTitle"><span class="audioPulse" aria-hidden="true"></span><div><strong>Audio drama</strong><small>${this.config.label}</small></div></div>
        <div class="audioDramaControls">
          <button type="button" class="audioPlay">▶ Listen</button>
          <button type="button" class="audioPause" disabled>⏸ Pause</button>
          <button type="button" class="audioStop" disabled>■ Stop</button>
          <label>Voices <select class="audioMode"><option value="narrator" selected>Cinematic Narrator</option><option value="cast">Full Cast (experimental)</option></select></label>
          <label>Speed <select class="audioSpeed"><option value="0.85">0.85×</option><option value="1" selected>1×</option><option value="1.15">1.15×</option><option value="1.3">1.3×</option></select></label>
          <label class="audioCheck"><input type="checkbox" class="audioAmbience" checked> Atmosphere</label>
        </div>
        <div class="audioStatus" role="status" aria-live="polite">Ready to read this chapter.</div>`;
      this.section.querySelector('.sectionHead').insertAdjacentElement('afterend', box);
      this.box = box;
      this.playBtn = box.querySelector('.audioPlay');
      this.pauseBtn = box.querySelector('.audioPause');
      this.stopBtn = box.querySelector('.audioStop');
      this.mode = box.querySelector('.audioMode');
      this.speed = box.querySelector('.audioSpeed');
      this.ambienceCheck = box.querySelector('.audioAmbience');
      this.status = box.querySelector('.audioStatus');
      this.playBtn.addEventListener('click', () => this.play());
      this.pauseBtn.addEventListener('click', () => this.togglePause());
      this.stopBtn.addEventListener('click', () => this.stop());
      this.ambienceCheck.addEventListener('change', () => {
        if (this.state !== 'stopped') {
          if (this.ambienceCheck.checked) this.startAmbience(); else this.stopAmbience();
        }
      });
    }

    async startAmbience() {
      this.stopAmbience();
      this.ambience = new Ambience(this.config.ambience);
      try { await this.ambience.start(); } catch (_) { this.ambience = null; }
    }
    stopAmbience() { if (this.ambience) this.ambience.stop(); this.ambience = null; }

    play() {
      if (activePlayer && activePlayer !== this) activePlayer.stop();
      activePlayer = this;
      if (this.state === 'paused') {
        synth.resume();
        this.state = 'playing';
        this.pauseBtn.textContent = '⏸ Pause';
        this.status.textContent = 'Reading resumed.';
        return;
      }
      if (this.state === 'playing') return;
      refreshVoices();
      this.index = 0;
      this.state = 'playing';
      this.playBtn.disabled = true;
      this.pauseBtn.disabled = false;
      this.stopBtn.disabled = false;
      this.box.classList.add('isPlaying');
      if (this.ambienceCheck.checked) this.startAmbience();
      this.status.textContent = this.mode.value === 'cast' ? 'Full Cast reading started.' : 'Narrator reading started.';
      synth.cancel();
      this.speakNext();
    }

    togglePause() {
      if (this.state === 'playing') {
        synth.pause();
        this.state = 'paused';
        this.pauseBtn.textContent = '▶ Resume';
        this.status.textContent = 'Reading paused.';
      } else if (this.state === 'paused') {
        synth.resume();
        this.state = 'playing';
        this.pauseBtn.textContent = '⏸ Pause';
        this.status.textContent = 'Reading resumed.';
      }
    }

    speakNext() {
      if (this.state !== 'playing') return;
      if (this.index >= this.segments.length) {
        this.finish();
        return;
      }
      const seg = this.segments[this.index];
      const speaker = this.mode.value === 'cast' ? seg.speaker : 'Narrator';
      const profile = profiles[speaker] || profiles.Narrator;
      const u = new SpeechSynthesisUtterance(seg.text);
      const voice = chooseVoice(speaker);
      if (voice) u.voice = voice;
      const speed = parseFloat(this.speed.value) || 1;
      u.rate = Math.max(0.6, Math.min(1.6, profile.rate * speed));
      u.pitch = profile.pitch;
      u.volume = profile.volume;
      u.onstart = () => {
        this.highlight(seg.paragraph);
        this.status.textContent = speaker === 'Narrator' ? 'Narrator' : `Voice: ${speaker}`;
      };
      u.onend = () => {
        if (this.state !== 'playing') return;
        const next = this.segments[this.index + 1];
        const pause = dramaticPauseFor(seg.text, seg.paragraph, next && next.paragraph);
        this.index += 1;
        window.setTimeout(() => { if (this.state === 'playing') this.speakNext(); }, pause);
      };
      u.onerror = (e) => {
        if (e.error === 'canceled' || e.error === 'interrupted') return;
        this.index += 1;
        this.speakNext();
      };
      synth.speak(u);
    }

    highlight(p) {
      if (this.currentParagraph && this.currentParagraph !== p) this.currentParagraph.classList.remove('isSpeaking');
      this.currentParagraph = p;
      p.classList.add('isSpeaking');
      const r = p.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight - 50) p.scrollIntoView({behavior:'smooth', block:'center'});
    }

    stop() {
      synth.cancel();
      this.state = 'stopped';
      this.index = 0;
      this.stopAmbience();
      if (this.currentParagraph) this.currentParagraph.classList.remove('isSpeaking');
      this.currentParagraph = null;
      this.playBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this.pauseBtn.textContent = '⏸ Pause';
      this.stopBtn.disabled = true;
      this.box.classList.remove('isPlaying');
      this.status.textContent = 'Ready to read this chapter.';
      if (activePlayer === this) activePlayer = null;
    }

    finish() {
      synth.cancel();
      this.state = 'stopped';
      this.stopAmbience();
      if (this.currentParagraph) this.currentParagraph.classList.remove('isSpeaking');
      this.currentParagraph = null;
      this.playBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this.stopBtn.disabled = true;
      this.box.classList.remove('isPlaying');
      this.status.textContent = 'Chapter finished.';
      if (activePlayer === this) activePlayer = null;
    }
  }

  Object.keys(chapterConfigs).forEach(id => {
    const section = document.getElementById(id);
    if (section?.querySelector('.fullStoryText')) new ChapterPlayer(section);
  });
})();
