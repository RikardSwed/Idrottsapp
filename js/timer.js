/* Guided workouts are independent of the existing program and workout storage. */
(function () {
  'use strict';
  const Core = globalThis.FlexTimerCore;
  const t = (sv, en) => state.language === 'en' ? en : state.language === 'sv' ? sv : sv + ' · ' + en;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const name = id => { const e = data.find(x => x.id === id); return e ? t(e.sv, e.en) : t('Övning', 'Exercise'); };
  const clock = milliseconds => { const sec = Math.max(0, Math.ceil(milliseconds / 1000)); return String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0'); };
  function read(store, key) { try { return JSON.parse(store.getItem(key)); } catch (_) { return null; } }
  function write(store, key, value) { try { value == null ? store.removeItem(key) : store.setItem(key, JSON.stringify(value)); } catch (_) { /* The timer also works without storage. */ } }
  let options = Core.settings(read(localStorage, 'flex-timer-settings') || {});
  let context = null, session = null, stage = 'setup', lastPhase = '', lastSecond = -1;
  let audio = null, wakeLock = null, wakePending = false, opener = null, finishAsked = false;
  let message = '', lastSave = 0, readyIndex = 0;
  const dialog = document.createElement('dialog');
  dialog.id = 'timerDialog'; dialog.className = 'timer-dialog'; dialog.setAttribute('aria-labelledby', 'timerTitle');
  document.body.append(dialog);
  const resumeButton = document.createElement('button');
  resumeButton.className = 'timer-resume'; resumeButton.hidden = true;
  document.body.append(resumeButton);
  const q = selector => dialog.querySelector(selector);
  const button = (action, label, cls = '') => '<button type="button" class="' + cls + '" data-timer-action="' + action + '">' + label + '</button>';
  function field(key, label, value, min, max) {
    return '<label class="timer-field"><span>' + label + '</span><input name="' + key + '" type="number" inputmode="numeric" min="' + min + '" max="' + max + '" step="1" required value="' + value + '"></label>';
  }
  function check(key, label) { return '<label class="timer-check"><input name="' + key + '" type="checkbox" ' + (options[key] ? 'checked' : '') + '><span>' + label + '</span></label>'; }
  function shell(content) {
    dialog.innerHTML = '<header class="timer-header"><div><p class="eyebrow">FLEX / ' + t('TRÄNINGSTIMER','WORKOUT TIMER') + '</p><h2 id="timerTitle">' + esc(context?.title || t('Ditt tempo','Your pace')) + '</h2></div>' + button('close', '×', 'timer-close') + '</header><div id="timerBody">' + content + '</div>';
    q('[data-timer-action="close"]').setAttribute('aria-label', t('Stäng och pausa','Close and pause'));
  }
  function open() {
    opener = document.activeElement;
    if (!dialog.open) dialog.showModal();
    document.body.classList.add('timer-open');
    dialog.scrollTop = 0;
    q('[data-timer-action="close"]')?.focus();
  }
  function hide() {
    if (session?.status === 'running') pause(t('Pausad när timern stängdes.','Paused when the timer was closed.'));
    dialog.close(); document.body.classList.remove('timer-open');
    opener?.focus?.(); updateResume();
  }
  function updateResume() {
    resumeButton.hidden = !session || session.status === 'done' || dialog.open;
    resumeButton.textContent = t('◷ Fortsätt passet','◷ Resume workout');
  }
  function choose(source) {
    if (session && session.status !== 'done') { renderRun(); open(); return; }
    context = source; session = null; stage = 'ready'; readyIndex = 0; message = ''; renderReady(); open();
  }
  function sourceFromKey(key) {
    if (key.startsWith('exercise:')) {
      const id = key.slice(9), exercise = data.find(e => e.id === id);
      if (!exercise) return null;
      const hold = ['plank','core-bear-hover','yoga-child','yoga-warrior2'].includes(id);
      return {title: name(id), single: true, items: [{id, sets: 3, amount: hold ? 30 : 10, unit: hold ? 'sek' : 'reps'}]};
    }
    const p = trainingPrograms().find(x => x.key === key);
    return p ? {title: p.name, single: false, items: p.exercises.filter(x => data.some(e => e.id === x.id)).map(x => ({...x}))} : null;
  }
  function launch(key) { const source = sourceFromKey(key); if (source) choose(source); }
  function artwork(id) {
    const exercise = data.find(e => e.id === id);
    return '<div class="timer-art" data-timer-swipe>' + (exercise?.image ? '<img draggable="false" src="' + esc(exercise.image) + '" alt="' + esc(name(id)) + '">' : '<div class="timer-art-empty">' + esc(name(id)) + '</div>') + '</div>';
  }
  function arrows() {
    return '<div class="timer-navigation">' + button('previous','‹ ' + t('Föregående','Previous')) + '<span>' + t('Svep bilden','Swipe the image') + '</span>' + button('next',t('Nästa','Next') + ' ›') + '</div>';
  }
  function renderReady() {
    stage = 'ready';
    const item = context.items[readyIndex];
    if (!item) return;
    const work = Core.buildPlan([item],options).find(p => p.kind === 'work');
    shell('<div class="timer-focus"><p class="timer-focus-label">' + t('REDO NÄR DU ÄR','READY WHEN YOU ARE') + '</p>' + artwork(item.id) +
      '<h3 class="timer-focus-name">' + esc(name(item.id)) + '</h3><div class="timer-clock">' + clock((work?.duration || 0)*1000) + '</div><p class="timer-clock-label">' + (work?.reps ? work.reps + ' reps' : t('Tid per set','Time per set')) + '</p>' +
      button('start',t('▶ Starta','▶ Start'),'timer-primary') + arrows() +
      '<div class="timer-tools">' + button('settings','⚙ ' + t('Inställningar','Settings')) + '</div></div>');
    q('[data-timer-action="previous"]').disabled = readyIndex === 0;
    q('[data-timer-action="next"]').disabled = readyIndex >= context.items.length-1;
    dialog.scrollTop = 0;
  }
  function renderSetup() {
    stage = 'setup'; finishAsked = false;
    const single = context.single, first = context.items[0];
    const modeOptions = [['guided',t('Följ set och reps','Follow sets and reps')],['interval',t('Intervaller / HIIT','Intervals / HIIT')],['emom',t('EMOM / varje minut','EMOM / every minute')]];
    shell('<form id="timerSetup"><p class="timer-intro">' + t('En sak i taget. Flex håller reda på nästa steg.','One thing at a time. Flex keeps track of what comes next.') + '</p>' +
      '<div class="timer-presets">' + button('guided',t('Program / reps','Routine / reps')) + button('tabata','20 / 10') + button('hiit','40 / 20') + button('emom','EMOM') + '</div>' +
      '<label class="timer-field"><span>' + t('Träningsläge','Workout mode') + '</span><select name="mode">' + modeOptions.map(([key,label]) => '<option value="' + key + '" ' + (key === options.mode ? 'selected' : '') + '>' + label + '</option>').join('') + '</select></label>' +
      '<p id="timerModeHelp" class="timer-hint"></p><div class="timer-fields">' +
      field('prepare',t('Förberedelse (s)','Get ready (s)'),options.prepare,0,120) +
      '<div data-setting="rest">' + field('rest',t('Vila mellan set (s)','Rest between sets (s)'),options.rest,0,600) + '</div>' +
      '<div data-setting="work">' + field('work',t('Arbete (s)','Work (s)'),options.work,1,3600) + '</div>' +
      '<div data-setting="rounds">' + field('rounds',t('Varv genom övningarna','Rounds through exercises'),options.rounds,1,30) + '</div>' +
      (single ? '<div data-setting="single">' + field('sets',t('Antal set','Number of sets'),first.sets || 1,1,30) + '</div><div data-setting="target">' + field('amount',t('Mål per set','Target per set'),first.amount,1,999) + '<label class="timer-field"><span>' + t('Enhet','Unit') + '</span><select name="unit"><option value="reps" ' + (first.unit === 'reps' ? 'selected' : '') + '>Reps</option><option value="sek" ' + (first.unit === 'sek' ? 'selected' : '') + '>' + t('Sekunder','Seconds') + '</option><option value="min" ' + (first.unit === 'min' ? 'selected' : '') + '>' + t('Minuter','Minutes') + '</option></select></label></div>' : '') +
      '</div><label class="timer-field" data-setting="order"><span>' + t('Ordning','Order') + '</span><select name="order"><option value="sets" ' + (options.order === 'sets' ? 'selected' : '') + '>' + t('Alla set av en övning först','All sets of one exercise first') + '</option><option value="circuit" ' + (options.order === 'circuit' ? 'selected' : '') + '>' + t('Cirkel: en övning i taget','Circuit: one exercise at a time') + '</option></select></label>' +
      '<div class="timer-checks">' + check('sound',t('Ljudsignaler','Sound cues')) + check('voice',t('Läs upp nästa moment','Announce the next phase')) + check('awake',t('Håll skärmen vaken','Keep screen awake')) + '</div>' +
      button('test',t('Prova ljud och röst','Test sound and voice'),'timer-secondary') +
      '<p class="timer-hint">' + t('Timern pausas när du lämnar appen eller låser skärmen. Repetitioner räknas manuellt; anpassa intensiteten efter övningen.','The timer pauses when you leave the app or lock the screen. Repetitions are counted manually; match the intensity to the exercise.') + '</p>' +
      '<section class="timer-preview"><h3>' + t('Ditt upplägg','Your plan') + '</h3><p id="timerEstimate"></p><ol>' + context.items.map(x => '<li><span>' + esc(name(x.id)) + '</span><b>' + esc((x.sets || 1) + ' × ' + x.amount + ' ' + (x.unit === 'sek' ? 's' : x.unit)) + '</b></li>').join('') + '</ol></section>' +
      '<button class="timer-primary" type="submit">' + t('Klart','Done') + '</button></form>');
    updateSetup();
  }
  function readForm() {
    const form = q('#timerSetup'); if (!form) return;
    const values = Object.fromEntries([...form.elements].filter(el => el.name).map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value]));
    options = Core.settings({...values, sound: !!values.sound, voice: !!values.voice, awake: !!values.awake});
    if (context.single) context.items[0] = {...context.items[0], sets: Number(values.sets) || 1, amount: Number(values.amount) || 10, unit: values.unit || 'reps'};
  }
  function updateSetup() {
    readForm();
    const visibility = {rest: options.mode !== 'emom',work: options.mode === 'interval',rounds: options.mode !== 'guided',single: options.mode === 'guided',target: options.mode !== 'interval',order: options.mode === 'guided' && !context.single};
    Object.entries(visibility).forEach(([key,visible]) => { const el = q('[data-setting="' + key + '"]'); if (el) { el.hidden = !visible; el.querySelectorAll('input,select').forEach(i => i.disabled = !visible); } });
    q('#timerModeHelp').textContent = options.mode === 'guided' ? t('Tidsmål räknas ner. Vid repetitionsmål räknas tiden upp tills du trycker Set klart.','Timed targets count down. For rep targets, time counts up until you tap Set done.') : options.mode === 'emom' ? t('Ett moment per minut. Tryck Set klart när du är klar och vila resten av minuten. Varje nytt varv börjar med första övningen.','One phase per minute. Tap Set done when finished and rest for the remainder. Each new round starts with the first exercise.') : t('Samma arbetstid för alla övningar. Vila mellan momenten. Antal varv ersätter programmets set.','The same work time for every exercise. Rest between phases. Rounds replace the routine’s sets.');
    const plan = Core.buildPlan(context.items,options), seconds = plan.reduce((n,p) => n + (p.duration || 0),0), manual = plan.filter(p => p.duration == null).length;
    q('#timerEstimate').textContent = plan.filter(p => p.kind === 'work').length + ' ' + t('arbetsmoment','work phases') + ' · ' + clock(seconds * 1000) + (manual ? ' + ' + t('tid för repetitionsset','time for rep sets') : ' ' + t('totalt','total'));
    if (context.single) { const x = context.items[0]; q('.timer-preview li b').textContent = (x.sets || 1) + ' × ' + x.amount + ' ' + x.unit; }
  }
  function sound(frequency = 700) {
    if (!options.sound || !audio || audio.state !== 'running') return;
    try { const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.09,audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime + .16); oscillator.start(); oscillator.stop(audio.currentTime + .17); } catch (_) {}
  }
  function unlockAudio() {
    if (!options.sound) return;
    try { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) { audio ||= new Audio(); audio.resume().catch(() => {}); } } catch (_) {}
  }
  function speak(sv,en) {
    if (!options.voice || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(state.language === 'en' ? en : sv);
    utterance.lang = state.language === 'en' ? 'en-US' : 'sv-SE'; window.speechSynthesis.speak(utterance);
  }
  async function holdScreen() {
    if (!options.awake || session?.status !== 'running' || document.hidden || wakeLock || wakePending || !navigator.wakeLock) return;
    wakePending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (session?.status !== 'running' || document.hidden || !options.awake) { await lock.release(); return; }
      wakeLock = lock;
      lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; paintWake(); });
    } catch (_) {} finally { wakePending = false; paintWake(); }
  }
  function releaseScreen() { const lock = wakeLock; wakeLock = null; if (lock) lock.release().catch(() => {}); paintWake(); }
  function paintWake() { const el = q('#timerWake'); if (el) el.textContent = wakeLock ? t('Skärmen hålls vaken','Screen stays awake') : t('Håll appen öppen. Skärmlås pausar passet.','Keep the app open. Screen lock pauses the workout.'); }
  function start() {
    const form = q('#timerSetup'); if (form && !form.reportValidity()) return;
    readForm(); const plan = Core.buildPlan(context.items,options); if (!plan.length) return;
    write(localStorage,'flex-timer-settings',options);
    session = new Core.Session(plan,options.mode); if (readyIndex > 0) session.index = plan.findIndex(p => p.kind === 'work' && p.id === context.items[readyIndex].id); session.start(); stage = 'run'; lastPhase = ''; lastSecond = -1; message = ''; finishAsked = false;
    unlockAudio(); holdScreen(); renderRun(); announce(); save();
  }
  function phaseLabel() { return session.emomRest || session.phase?.kind === 'rest' ? t('VILA','REST') : session.phase?.kind === 'prepare' ? t('GÖR DIG REDO','GET READY') : t('DIN TUR','YOUR TURN'); }
  function nextWork() { return session.plan.slice(session.index + 1).find(x => x.kind === 'work'); }
  function renderRun() {
    if (!session) return;
    if (session.status === 'done') { renderSummary(); return; }
    stage = 'run';
    const p = session.phase, rest = p.kind === 'rest' || session.emomRest, active = p.kind === 'work' && !session.emomRest;
    const preview = session.emomRest ? nextWork() : p.kind !== 'work' ? session.plan.slice(session.index).find(x => x.kind === 'work') : p;
    const shown = preview || p;
    shell('<div class="timer-focus timer-running ' + (rest ? 'is-rest' : '') + '"><p class="timer-focus-label" id="timerPhase" role="status"></p>' +
      artwork(shown.id) + '<h3 class="timer-focus-name">' + esc(name(shown.id)) + '</h3>' +
      '<div class="timer-clock" id="timerClock" role="timer" aria-live="off"></div><p class="timer-clock-label">' + (rest ? t('Vila kvar','Rest remaining') : p.kind === 'prepare' ? t('Startar om','Starting in') : (p.reps ? p.reps + ' reps · ' : '') + t('Set','Set') + ' ' + p.set + ' / ' + p.sets) + '</p>' +
      button('pause',t('Pausa','Pause'),'timer-primary') +
      (active ? button('done',t('✓ Set klart','✓ Set done'),'timer-done') : '') + arrows() +
      '<details class="timer-more"><summary>••• ' + t('Mer','More') + '</summary><div class="timer-more-content">' +
      (active ? '<div class="timer-rep-counter"><span>' + t('Räkna reps','Count reps') + '</span><div>' + button('minus','−') + '<output id="timerReps">' + session.reps + '</output>' + button('plus','+ 1') + '</div></div>' : '') +
      '<div class="timer-checks">' + check('sound',t('Ljudsignaler','Sound cues')) + check('voice',t('Röst','Voice')) + check('awake',t('Håll skärmen vaken','Keep screen awake')) + '</div><div class="timer-small-actions">' + (p.kind === 'rest' ? button('rest',t('+15 s vila','+15 s rest')) : '') + button('skip',t('Hoppa över moment','Skip phase')) + button('finish',t('Avsluta pass','End workout')) + '</div><p id="timerWake" class="timer-hint"></p></div></details>' +
      '<p id="timerMessage" class="timer-hint" role="status">' + esc(message) + '</p>' +
      '<div id="timerEndConfirm" class="timer-end-confirm" hidden><p>' + t('Avsluta passet här?','End the workout here?') + '</p>' + button('end-now',t('Ja, avsluta','Yes, end')) + button('cancel-end',t('Fortsätt passet','Keep workout')) + '</div></div>');
    dialog.scrollTop = 0; paint(); paintWake();
    q('[data-timer-action="previous"]').disabled = !session.previousExerciseIndex();
  }
  function paint() {
    if (stage !== 'run' || !session.phase) return;
    const paused = session.status === 'paused', rest = session.emomRest || session.phase.kind === 'rest';
    q('#timerClock').textContent = clock(session.remaining ?? session.elapsed);
    q('#timerPhase').textContent = paused ? t('PAUSAD','PAUSED') : rest ? (nextWork() ? t('NÄSTA ÖVNING','NEXT EXERCISE') : t('SISTA VILAN','FINAL REST')) : session.phase.kind === 'prepare' ? t('GÖR DIG REDO','GET READY') : t('DAGS NU','YOUR TURN');
    if (q('#timerReps')) q('#timerReps').textContent = session.reps;
    q('[data-timer-action="pause"]').textContent = paused ? t('▶ Fortsätt','▶ Resume') : t('Ⅱ Pausa','Ⅱ Pause');
    ['done','skip','plus','minus'].forEach(a => { const el = q('[data-timer-action="' + a + '"]'); if (el) el.disabled = paused; });
    if (q('[data-timer-action="minus"]')) q('[data-timer-action="minus"]').setAttribute('aria-label',t('Ta bort en repetition','Remove one repetition'));
  }
  function announce() {
    if (!session.phase || session.status !== 'running') return;
    const p = session.phase, e = data.find(x => x.id === p.id), key = session.index + ':' + session.emomRest;
    if (key === lastPhase) return; lastPhase = key; lastSecond = -1;
    sound(session.emomRest || p.kind === 'rest' ? 480 : 900);
    if (session.emomRest || p.kind === 'rest') speak('Vila','Rest');
    else if (p.kind === 'prepare') speak('Gör dig redo','Get ready');
    else speak(e?.sv || 'Börja', e?.en || 'Start');
  }
  function pause(reason = '') {
    if (!session) return;
    session.pause(); message = reason; window.speechSynthesis?.cancel(); releaseScreen(); save();
    if (dialog.open) renderRun(); updateResume();
  }
  function save() {
    if (!session || session.status === 'done') { write(sessionStorage,'flex-timer-session',null); return; }
    write(sessionStorage,'flex-timer-session',{version:1,context,options,plan:session.plan,index:session.index,elapsed:session.elapsed,total:session.total,results:session.results,reps:session.reps,emomRest:session.emomRest});
  }
  function restore() {
    const saved = read(sessionStorage,'flex-timer-session'); if (!saved) return;
    try {
      if (saved.version !== 1 || !Array.isArray(saved.plan) || !saved.plan.length || saved.plan.length > 9000 || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= saved.plan.length) throw Error();
      if (!saved.plan.every(p => p && ['work','rest','prepare'].includes(p.kind) && data.some(e => e.id === p.id) && (p.duration === null || Number.isFinite(p.duration) && p.duration >= 0 && p.duration <= 100000))) throw Error();
      if (![saved.elapsed,saved.total,saved.reps].every(x => Number.isFinite(x) && x >= 0) || !Array.isArray(saved.results) || !saved.context || !Array.isArray(saved.context.items)) throw Error();
      if (!saved.results.every(r => r && typeof r.id === 'string' && ['confirmed','elapsed','skipped','stopped'].includes(r.outcome) && Number.isFinite(r.reps) && r.reps >= 0 && Number.isFinite(r.seconds) && r.seconds >= 0)) throw Error();
      if (!saved.context.items.every(x => x && typeof x.id === 'string' && data.some(e => e.id === x.id))) throw Error();
      context = saved.context; options = Core.settings(saved.options); session = new Core.Session(saved.plan,options.mode);
      Object.assign(session,{index:saved.index,elapsed:saved.elapsed,total:saved.total,reps:saved.reps,results:saved.results,emomRest:!!saved.emomRest,status:'paused'});
      message = t('Passet återställdes i pausat läge.','Your workout was restored paused.'); updateResume();
    } catch (_) { write(sessionStorage,'flex-timer-session',null); }
  }
  function renderSummary() {
    stage = 'summary'; releaseScreen(); window.speechSynthesis?.cancel(); save(); updateResume();
    const done = session.results.filter(r => ['confirmed','elapsed'].includes(r.outcome)), skipped = session.results.filter(r => r.outcome === 'skipped').length;
    shell('<div class="timer-summary"><span class="timer-summary-mark">✓</span><h3>' + t('Passet är avslutat','Workout ended') + '</h3><p>' + clock(session.total) + ' · ' + done.length + ' ' + t('avslutade arbetsmoment','finished work phases') + '</p><p>' + skipped + ' ' + t('överhoppade moment','skipped phases') + '</p><p>' + session.results.reduce((n,r) => n + r.reps,0) + ' ' + t('manuellt räknade repetitioner','manually counted repetitions') + '</p><p class="timer-hint">' + t('Avslutad tid betyder inte att repetitionsmålet är uppnått. Spara dina faktiska resultat i Min träning.','Elapsed time does not mean the rep target was reached. Save your actual results in My training.') + '</p>' + button('again',t('Nytt pass med samma upplägg','New workout with this plan'),'timer-primary') + button('training',t('Öppna Min träning','Open My training'),'timer-secondary') + '</div>');
  }
  dialog.addEventListener('submit', event => { event.preventDefault(); if (event.target.id === 'timerSetup') { readForm(); write(localStorage,'flex-timer-settings',options); renderReady(); } });
  dialog.addEventListener('change', event => { if (stage === 'setup') updateSetup(); else if (stage === 'run' && ['sound','voice','awake'].includes(event.target.name)) { options[event.target.name] = event.target.checked; if (!options.voice) window.speechSynthesis?.cancel(); if (options.awake) holdScreen(); else releaseScreen(); unlockAudio(); write(localStorage,'flex-timer-settings',options); save(); } });
  dialog.addEventListener('input', event => { if (stage === 'setup' && event.target.type === 'number') updateSetup(); });
  dialog.addEventListener('cancel', event => { event.preventDefault(); hide(); });
  dialog.addEventListener('keydown', event => { if (event.key === 'Escape') event.stopPropagation(); });
  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-timer-action]')?.dataset.timerAction;
    if (!action) return;
    if (action === 'close') { hide(); return; }
    if (action === 'settings') { renderSetup(); return; }
    if (action === 'start') { start(); return; }
    if (action === 'next' || action === 'previous') { navigateExercise(action === 'next' ? 1 : -1); return; }
    if (['guided','tabata','hiit','emom'].includes(action)) {
      readForm(); options.mode = action === 'guided' ? 'guided' : action === 'emom' ? 'emom' : 'interval';
      if (action === 'tabata') Object.assign(options,{work:20,rest:10,rounds:8});
      if (action === 'hiit') Object.assign(options,{work:40,rest:20,rounds:3});
      renderSetup(); return;
    }
    if (action === 'test') { readForm(); unlockAudio(); setTimeout(() => sound(),100); speak('Gör dig redo. Nästa övning.','Get ready. Next exercise.'); return; }
    if (action === 'again') { session = null; readyIndex = 0; renderReady(); return; }
    if (action === 'training') { hide(); session = null; updateResume(); closeModal(); goTo('training'); return; }
    if (!session) return;
    if (action === 'pause') {
      if (session.status === 'running') pause();
      else if (session.status === 'paused') { session.start(); message = ''; finishAsked = false; unlockAudio(); holdScreen(); renderRun(); lastPhase = ''; announce(); }
    }
    if (action === 'plus' || action === 'minus') { session.count(action === 'plus' ? 1 : -1); paint(); }
    if (action === 'done' || action === 'skip') { action === 'done' ? session.complete() : session.skip(); renderRun(); announce(); }
    if (action === 'rest') { session.addRest(); paint(); }
    if (action === 'finish') { pause(); if (session.status !== 'done') { finishAsked = true; q('#timerEndConfirm').hidden = false; q('[data-timer-action="end-now"]').focus(); } }
    if (action === 'cancel-end') { finishAsked = false; renderRun(); }
    if (action === 'end-now' && finishAsked) { session.stop(); renderSummary(); }
    save();
  });
  function navigateExercise(direction) {
    if (stage === 'ready') {
      readyIndex = Math.max(0,Math.min(context.items.length-1,readyIndex+direction)); renderReady(); return;
    }
    if (stage !== 'run' || finishAsked) return;
    session.navigateExercise(direction); message = ''; lastPhase = ''; renderRun(); announce(); save();
  }
  let touchStart = null;
  dialog.addEventListener('pointerdown',event => {
    if (!event.target.closest('[data-timer-swipe]') || !event.isPrimary) return;
    touchStart = {x:event.clientX,y:event.clientY,id:event.pointerId};
    event.target.closest('[data-timer-swipe]').setPointerCapture(event.pointerId);
  });
  dialog.addEventListener('pointerup',event => {
    if (!touchStart || touchStart.id !== event.pointerId) return;
    const dx = event.clientX-touchStart.x, dy = event.clientY-touchStart.y; touchStart = null;
    if (Math.abs(dx)>65 && Math.abs(dx)>Math.abs(dy)*1.5) navigateExercise(dx>0 ? 1 : -1);
  });
  dialog.addEventListener('pointercancel',()=>{touchStart=null;});
  resumeButton.onclick = () => { renderRun(); open(); updateResume(); };
  document.addEventListener('click', event => {
    const entry = event.target.closest('[data-timer-source]'); if (entry) { event.preventDefault(); launch(entry.dataset.timerSource); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && session?.status === 'running') pause(t('Pausad eftersom appen lämnades eller skärmen låstes.','Paused because the app was left or the screen was locked.')); });
  window.addEventListener('pagehide', () => { if (session?.status === 'running') pause(); save(); });
  setInterval(() => {
    if (!session || session.status !== 'running') return;
    const before = session.index; session.tick();
    if (session.status === 'done') { sound(1100); renderSummary(); return; }
    if (before !== session.index) { message = ''; renderRun(); announce(); } else if (dialog.open) paint();
    const second = session.remaining == null ? -1 : Math.ceil(session.remaining / 1000);
    if (second >= 1 && second <= 3 && second !== lastSecond) sound(600);
    lastSecond = second;
    if (Date.now() - lastSave > 1000) { lastSave = Date.now(); save(); }
  },100);
  // Direct hooks use stable exercise/program ids, including after dynamic re-renders.
  function addEntries() {
    document.querySelectorAll('[data-add-current-to-program]').forEach(anchor => {
      if (anchor.parentElement.querySelector('[data-timer-source]') || anchor.closest('#detailContent')?.querySelector('.back-to-base')) return;
      const entry = document.createElement('button'); entry.className = 'detail-timer-action'; entry.dataset.timerSource = 'exercise:' + anchor.dataset.addCurrentToProgram;
      entry.textContent = t('◷ Träna med timer','◷ Train with timer'); anchor.before(entry);
    });
    document.querySelectorAll('.preset-card').forEach(card => {
      const id = card.querySelector('[data-use-preset]')?.dataset.usePreset; if (!id || card.querySelector('[data-timer-source]')) return;
      const entry = document.createElement('button'); entry.className = 'program-timer-action'; entry.dataset.timerSource = 'preset:' + id; entry.textContent = t('◷ Starta med timer','◷ Start with timer'); card.append(entry);
    });
    document.querySelectorAll('#programList .program-card').forEach(card => {
      if (card.querySelector('[data-timer-source]')) return;
      const entry = document.createElement('button'); entry.className = 'program-timer-action'; entry.dataset.timerSource = 'own:' + card.dataset.programId; entry.textContent = t('◷ Starta med timer','◷ Start with timer'); card.append(entry);
    });
  }
  const observer = new MutationObserver(addEntries);
  ['#detailContent','#programList'].forEach(selector => observer.observe(document.querySelector(selector),{childList:true,subtree:true}));
  languageMenu.addEventListener('click', () => {
    document.querySelectorAll('[data-timer-source]').forEach(el => { el.textContent = el.classList.contains('detail-timer-action') ? t('◷ Träna med timer','◷ Train with timer') : t('◷ Starta med timer','◷ Start with timer'); });
    updateResume();
  });
  document.querySelector('.feature-library > span').textContent = data.length;
  addEntries(); restore();
})();
