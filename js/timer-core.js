/* Pure timer model: seconds in plans, monotonic milliseconds while running. */
(function (root) {
  'use strict';
  const integer = (value, fallback, min, max) => Number.isFinite(Number(value))
    ? Math.min(max, Math.max(min, Math.round(Number(value)))) : fallback;
  function settings(input = {}) {
    return {
      mode: ['guided', 'interval', 'emom'].includes(input.mode) ? input.mode : 'guided',
      order: input.order === 'circuit' ? 'circuit' : 'sets',
      work: integer(input.work, 40, 1, 3600), rest: integer(input.rest, 20, 0, 600),
      prepare: integer(input.prepare, 10, 0, 120), rounds: integer(input.rounds, 3, 1, 30),
      sound: input.sound !== false, voice: input.voice === true, awake: input.awake !== false
    };
  }
  function buildPlan(items, input) {
    const s = settings(input);
    const normalized = items.filter(x => x && typeof x.id === 'string').slice(0, 149).map(x => ({
      id: x.id, sets: integer(x.sets, 1, 1, 30),
      amount: integer(x.amount, 10, 1, 999), unit: ['sek', 'min'].includes(x.unit) ? x.unit : 'reps'
    }));
    const work = [];
    const add = (item, set, sets) => work.push({
      kind: 'work', id: item.id, set, sets,
      reps: item.unit === 'reps' ? item.amount : null,
      duration: s.mode === 'emom' ? 60 : s.mode === 'interval' ? s.work :
        item.unit === 'reps' ? null : item.amount * (item.unit === 'min' ? 60 : 1)
    });
    if (s.mode !== 'guided' || s.order === 'circuit') {
      const rounds = s.mode === 'guided' ? Math.max(0, ...normalized.map(x => x.sets)) : s.rounds;
      for (let n = 1; n <= rounds; n++) normalized.forEach(item => {
        if (s.mode !== 'guided' || n <= item.sets) add(item, n, s.mode === 'guided' ? item.sets : rounds);
      });
    } else normalized.forEach(item => { for (let n = 1; n <= item.sets; n++) add(item, n, item.sets); });
    const plan = [];
    if (work.length && s.prepare) plan.push({kind: 'prepare', duration: s.prepare, id: work[0].id});
    work.forEach((phase, i) => {
      plan.push(phase);
      if (i < work.length - 1 && s.mode !== 'emom' && s.rest) plan.push({kind: 'rest', duration: s.rest, id: work[i + 1].id});
    });
    return plan;
  }
  class Session {
    constructor(plan, mode, now = () => performance.now()) {
      this.plan = plan.map(x => ({...x})); this.mode = mode; this.now = now;
      this.index = 0; this.status = 'idle'; this.elapsed = 0; this.total = 0;
      this.results = []; this.reps = 0; this.emomRest = false; this.last = 0;
    }
    get phase() { return this.plan[this.index] || null; }
    get remaining() { return this.phase?.duration == null ? null : Math.max(0, this.phase.duration * 1000 - this.elapsed); }
    start() { if (this.status !== 'done' && this.phase) { this.status = 'running'; this.last = this.now(); } }
    tick() {
      if (this.status !== 'running') return;
      const now = this.now(), delta = Math.max(0, now - this.last); this.last = now;
      this.elapsed += delta; this.total += delta;
      // Keep fractional overrun across ordinary delayed frames. Manual sets never expire.
      while (this.phase?.duration != null && this.elapsed >= this.phase.duration * 1000) {
        const overrun = this.elapsed - this.phase.duration * 1000;
        this.advance(this.emomRest ? null : 'elapsed');
        if (this.status === 'done') { this.total -= overrun; break; }
        this.elapsed = overrun;
      }
    }
    pause() { this.tick(); if (this.status === 'running') this.status = 'paused'; }
    advance(outcome) {
      if (!this.phase) return;
      if (this.phase.kind === 'work' && !this.emomRest) this.results.push({
        id: this.phase.id, set: this.phase.set, outcome, reps: this.reps,
        seconds: Math.min(this.elapsed / 1000, this.phase.duration ?? Infinity)
      });
      this.index++; this.elapsed = 0; this.reps = 0; this.emomRest = false;
      if (!this.phase) this.status = 'done';
    }
    complete() {
      if (this.status !== 'running') return;
      const before = this.index; this.tick();
      if (this.status !== 'running' || before !== this.index || this.phase.kind !== 'work' || this.emomRest) return;
      if (this.mode === 'emom') {
        this.results.push({id: this.phase.id, set: this.phase.set, outcome: 'confirmed', reps: this.reps, seconds: this.elapsed / 1000});
        this.emomRest = true;
      } else this.advance('confirmed');
    }
    skip() {
      if (this.status !== 'running') return;
      const before = this.index; this.tick();
      if (this.status === 'running' && before === this.index) this.advance('skipped');
    }
    addRest(seconds = 15) {
      if (!this.phase || this.phase.kind !== 'rest' || !['running', 'paused'].includes(this.status)) return;
      const before = this.index; this.tick();
      if (before === this.index && this.phase?.kind === 'rest') this.phase.duration += seconds;
    }
    count(delta) { if (this.status === 'running' && this.phase?.kind === 'work' && !this.emomRest) this.reps = Math.max(0, Math.min(9999, this.reps + delta)); }
    stop() {
      this.pause();
      if (this.status !== 'done' && this.phase?.kind === 'work' && !this.emomRest && (this.elapsed > 0 || this.reps > 0)) {
        this.results.push({id: this.phase.id, set: this.phase.set, outcome: 'stopped', reps: this.reps, seconds: this.elapsed / 1000});
      }
      this.status = 'done';
    }
  }
  const api = {settings, buildPlan, Session};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.FlexTimerCore = api;
})(globalThis);
