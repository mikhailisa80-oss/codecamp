(() => {
'use strict';
const COURSE = window.CODECAMP_COURSE;
const LEGACY_KEY = 'codecAppStateV2';
const ACCOUNTS_KEY = 'codecAppAccountsV1';
const SESSION_KEY = 'codecAppSessionV1';
let activeUser = null;
const TOTAL_UNITS = COURSE.reduce((n, c) => n + c.units.length, 0);
const defaultState = { points: 0, unlockedChapters: 1, completedUnits: [], correct: 0, answers: [], name: '', lastDay: '', streak: 0 };
let state = { ...defaultState };
let activeChapter = 0, activeUnit = 0, questionIndex = 0, answered = false, selectedAnswer = null;
const $ = id => document.getElementById(id);
const unitKey = (c, u) => `${c + 1}-${u + 1}`;
const isDone = (c, u) => state.completedUnits.includes(unitKey(c, u));
const chapterDone = c => COURSE[c].units.every((_, u) => isDone(c, u));
const totalDone = () => state.completedUnits.length;
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function stateKey(email = activeUser?.email) { return `codecAppStateV2:user:${encodeURIComponent(email || '')}`; }
function save() { if (!activeUser) return; localStorage.setItem(stateKey(), JSON.stringify(state)); render(); }
function normalizeState(value) {
  const next = { ...defaultState, ...(value && typeof value === 'object' ? value : {}) };
  if (!Array.isArray(next.completedUnits)) next.completedUnits = [];
  if (!Array.isArray(next.answers)) next.answers = [];
  next.points = Math.max(0, Number(next.points) || 0);
  next.unlockedChapters = Math.min(COURSE.length, Math.max(1, Number(next.unlockedChapters) || 1));
  return next;
}
function loadStateForUser(email) {
  const key = stateKey(email);
  let saved = localStorage.getItem(key);
  if (!saved) {
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) { saved = legacy; localStorage.setItem(key, legacy); localStorage.removeItem(LEGACY_KEY); }
  }
  try { state = normalizeState(saved ? JSON.parse(saved) : defaultState); } catch { state = { ...defaultState }; }
}
function go(id) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === id));
  document.querySelectorAll('nav [data-go]').forEach(el => el.classList.toggle('selected', el.dataset.go === id));
  window.scrollTo({top:0, behavior:'smooth'});
  if (id === 'home' || id === 'profile' || id === 'extras') render();
}
document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => go(button.dataset.go)));
function canOpenUnit(c, u) {
  if (c >= state.unlockedChapters) return false;
  return u === 0 || isDone(c, u - 1);
}
function render() {
  $('points').textContent = state.points;
  $('doneCount').textContent = `${totalDone()}/${TOTAL_UNITS}`;
  $('chapterCount').textContent = `${COURSE.filter((_, i) => chapterDone(i)).length}/12`;
  $('profilePoints').textContent = `${state.points} CP`;
  $('profileDone').textContent = `${totalDone()}/${TOTAL_UNITS}`;
  $('correctCount').textContent = state.correct;
  $('accountEmail').textContent = activeUser?.email || '—';
  $('displayName').value = state.name;
  const completedChapters = COURSE.filter((_, i) => chapterDone(i)).length;
  $('courseProgress').style.width = `${Math.round(totalDone() / TOTAL_UNITS * 100)}%`;
  $('courseProgressLabel').textContent = `${totalDone()} daripada ${TOTAL_UNITS} Unit selesai`;
  $('chapterList').innerHTML = COURSE.map((chapter, ci) => {
    const unlocked = ci < state.unlockedChapters;
    const previousDone = ci === 0 || chapterDone(ci - 1);
    const done = chapterDone(ci);
    const completedCount = chapter.units.filter((_, ui) => isDone(ci, ui)).length;
    let action = '';
    if (unlocked) action = `<span class="tag ${done?'done':''}">${done?'SELESAI':`${completedCount}/6 UNIT`}</span>`;
    else if (!previousDone) action = '<span class="tag locked">SELESAIKAN BAB SEBELUMNYA</span>';
    else action = `<button class="unlock-btn" data-unlock="${ci}" ${state.points < 20 ? 'disabled' : ''}>Buka · 20 CP</button>`;
    return `<article class="chapter-card ${unlocked?'unlocked':'locked-card'}">
      <button class="chapter-heading" data-expand="${ci}" aria-expanded="${ci===activeChapter?'true':'false'}">
        <span class="chapter-number">${done?'✓':unlocked?ci+1:'🔒'}</span>
        <span class="chapter-info"><b>Bab ${ci+1}: ${escapeHtml(chapter.title)}</b><small>${escapeHtml(chapter.level)} · ${completedCount}/6 Unit selesai</small><small>${escapeHtml(chapter.description)}</small></span>
        <span class="chapter-arrow">${ci===activeChapter?'⌄':'›'}</span>
      </button>
      <div class="chapter-units" ${ci===activeChapter && unlocked?'':'hidden'}>
        ${chapter.units.map((unit, ui) => {
          const unitUnlocked = canOpenUnit(ci, ui), unitDone = isDone(ci, ui);
          return `<div class="unit-row"><span class="unit-mark">${unitDone?'✓':unitUnlocked?'●':'🔒'}</span><span class="unit-info"><b>Unit ${ui+1}: ${escapeHtml(unit.title)}</b><small>${escapeHtml(unit.sub)}</small></span><span class="unit-reward">${unitDone?'Selesai':'+20 CP'}</span><button class="unit-btn" data-unit="${ci}" data-index="${ui}" ${unitUnlocked?'':'disabled'}>${unitDone?'Ulang kaji':unitUnlocked?'Mula':'Terkunci'}</button></div>`;
        }).join('')}
      </div>
      ${!unlocked ? action : ''}
      ${unlocked ? action : ''}
    </article>`;
  }).join('');
  $('achievement').textContent = completedChapters ? `🏅 ${completedChapters} Bab berjaya diselesaikan. Teruskan perjalanan!` : 'Selesaikan keenam-enam Unit dalam Bab 1 untuk melengkapkan Bab pertama.';
  $('profileChapters').textContent = `${completedChapters}/12`;
  $('streak').textContent = `${state.streak} hari`;
}
$('chapterList').addEventListener('click', event => {
  const expand = event.target.closest('[data-expand]');
  if (expand) {
    const ci = Number(expand.dataset.expand);
    if (ci >= state.unlockedChapters) return;
    activeChapter = ci;
    render();
    return;
  }
  const unlock = event.target.closest('[data-unlock]');
  if (unlock) {
    const ci = Number(unlock.dataset.unlock);
    if (ci !== state.unlockedChapters || ci === 0 || !chapterDone(ci - 1)) return;
    if (state.points < 20) { alert('Point tidak mencukupi. Selesaikan Unit yang belum dibuat untuk memperoleh 20 CP.'); return; }
    state.points -= 20;
    state.unlockedChapters = ci + 1;
    activeChapter = ci;
    save();
    alert(`Bab ${ci+1} berjaya dibuka! 20 CP telah digunakan.`);
    return;
  }
  const unit = event.target.closest('[data-unit]');
  if (unit) openUnit(Number(unit.dataset.unit), Number(unit.dataset.index));
});
function openUnit(c, u) {
  if (!canOpenUnit(c, u)) return;
  activeChapter = c; activeUnit = u;
  const chapter = COURSE[c], lesson = chapter.units[u];
  $('lessonContent').innerHTML = `<span class="eyebrow">BAB ${c+1} · UNIT ${u+1} · ${escapeHtml(chapter.level.toUpperCase())}</span><h1>${escapeHtml(lesson.title)}</h1><p class="lesson-sub">${escapeHtml(lesson.sub)}</p><div class="lesson-explanation">${escapeHtml(lesson.body)}</div><h3>Contoh kod</h3><pre>${escapeHtml(lesson.code)}</pre><h3>Hasil / penerangan contoh</h3><pre>${escapeHtml(lesson.output)}</pre><div class="reward-note">🎯 Selesaikan latihan Unit ini untuk memperoleh <b>20 CP</b>. Ganjaran hanya diberi sekali bagi setiap Unit.</div><button class="primary" id="startQuiz">Saya faham — mula latihan</button>`;
  $('startQuiz').addEventListener('click', () => { questionIndex = 0; answered = false; selectedAnswer = null; showQuestion(); go('quiz'); });
  go('learn');
}
function showQuestion() {
  const lesson = COURSE[activeChapter].units[activeUnit], question = lesson.questions[questionIndex];
  answered = false; selectedAnswer = null;
  $('quizContent').innerHTML = `<span class="eyebrow">BAB ${activeChapter+1} · UNIT ${activeUnit+1} · SOALAN ${questionIndex+1}/2</span><div class="quiz-progress"><span style="width:${(questionIndex+1)/2*100}%"></span></div><h2>${escapeHtml(question.prompt)}</h2>${question.choices.map((choice, i) => `<button class="answer" data-answer="${i}">${String.fromCharCode(65+i)}. ${escapeHtml(choice)}</button>`).join('')}<div id="feedback"></div>`;
  $('quizContent').querySelectorAll('[data-answer]').forEach(button => button.addEventListener('click', () => answer(Number(button.dataset.answer))));
}
function answer(choiceIndex) {
  if (answered) return;
  const question = COURSE[activeChapter].units[activeUnit].questions[questionIndex];
  answered = true; selectedAnswer = choiceIndex;
  const correct = choiceIndex === question.answer;
  if (correct) state.correct++;
  state.answers.push({unit:unitKey(activeChapter,activeUnit), question:questionIndex, correct});
  $('quizContent').querySelectorAll('[data-answer]').forEach((button, i) => {
    button.disabled = true;
    if (i === question.answer) button.classList.add('answer-correct');
    else if (i === choiceIndex) button.classList.add('answer-wrong');
  });
  $('feedback').innerHTML = `<div class="feedback ${correct?'correct':'wrong'}"><b>${correct?'Betul! Bagus!':'Belum tepat — tak apa, belajar daripada jawapan.'}</b><p>${correct?'Jawapan kamu tepat.':`Jawapan yang betul: <b>${escapeHtml(question.choices[question.answer])}</b>.`}</p><p>${escapeHtml(question.why)}</p></div><button class="primary" id="nextQuestion">${questionIndex === 1 ? 'Selesaikan Unit' : 'Soalan seterusnya'}</button>`;
  $('nextQuestion').addEventListener('click', () => {
    if (questionIndex === 0) { questionIndex = 1; showQuestion(); }
    else completeUnit();
  });
  if (activeUser) localStorage.setItem(stateKey(), JSON.stringify(state));
}
function completeUnit() {
  const key = unitKey(activeChapter,activeUnit);
  const alreadyDone = state.completedUnits.includes(key);
  if (!alreadyDone) {
    state.completedUnits.push(key);
    state.points += 20;
  }
  const completedChapterNow = chapterDone(activeChapter);
  const nextUnit = activeUnit < 5 ? `Unit ${activeUnit+2}` : completedChapterNow ? 'Bab seterusnya' : 'Unit seterusnya';
  $('completeContent').innerHTML = `<div class="completion-icon">${alreadyDone?'📘':'🎉'}</div><h1>${alreadyDone?'Unit diulang kaji!':'Unit selesai!'}</h1><p>${alreadyDone?'Unit ini sudah pernah diselesaikan, jadi point tidak diberikan kali kedua.':'Tahniah! Kamu memperoleh 20 Code Points.'}</p><div class="completion-points">${alreadyDone?'0':' +20'} CP</div><p>${completedChapterNow?`Kamu sudah menyelesaikan semua 6 Unit Bab ${activeChapter+1}.`:`Kemajuan Bab ${activeChapter+1}: ${COURSE[activeChapter].units.filter((_,i)=>isDone(activeChapter,i)).length}/6 Unit.`}</p><button class="primary" id="backToCourse">Kembali ke laluan pembelajaran</button>`;
  save();
  go('complete');
  $('backToCourse').addEventListener('click', () => { activeChapter = Math.min(activeChapter + (completedChapterNow ? 1 : 0), COURSE.length-1); go('home'); });
}
$('runCode').addEventListener('click', () => {
  const code = $('code').value.trim();
  const match = code.match(/^print\((['"])(.*?)\1\)$/s);
  $('output').textContent = match ? match[2] : 'Playground prototaip ini hanya memaparkan contoh print("teks"). Ia belum menjalankan Python sebenar.';
});
$('saveName').addEventListener('click', () => { state.name = $('displayName').value.trim().slice(0,30); save(); alert('Nama disimpan pada peranti ini.'); });
function updateStreak() {
  const today = new Date(); const todayKey = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
  if (state.lastDay !== todayKey) {
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    const yesterdayKey = `${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
    state.streak = state.lastDay === yesterdayKey ? state.streak + 1 : 1;
    state.lastDay = todayKey;
    if (activeUser) localStorage.setItem(stateKey(), JSON.stringify(state));
  }
}

// Prototaip akaun setempat: bukan sistem pengesahan server.
function readAccounts() {
  try { const data = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]'); return Array.isArray(data) ? data : []; }
  catch { return []; }
}
function showAuthMessage(message, isError = true) {
  $('authMessage').textContent = message;
  $('authMessage').classList.toggle('error', isError);
}
function setAuthMode(mode) {
  const signup = mode === 'signup';
  $('authTitle').textContent = signup ? 'Cipta akaun CODECAMP' : 'Selamat kembali!';
  $('authIntro').textContent = signup ? 'Daftar akaun untuk mula perjalanan coding kamu.' : 'Log masuk untuk sambung pembelajaran CODECAMP.';
  $('authNameWrap').hidden = !signup;
  $('authConfirmWrap').hidden = !signup;
  $('authPassword').autocomplete = signup ? 'new-password' : 'current-password';
  $('authSubmit').textContent = signup ? 'Create Account' : 'Log In';
  $('loginTab').classList.toggle('active', !signup);
  $('signupTab').classList.toggle('active', signup);
  $('authName').required = signup;
  $('authConfirm').required = signup;
  $('authConfirm').value = '';
  $('authPassword').value = '';
  showAuthMessage('');
}
function enterApp(user) {
  activeUser = { email: user.email, name: user.name || '' };
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }));
  loadStateForUser(user.email);
  if (!state.name && user.name) state.name = user.name;
  document.body.classList.remove('auth-locked');
  $('authGate').hidden = true;
  updateStreak();
  render();
  go('home');
}
function logout() {
  activeUser = null;
  localStorage.removeItem(SESSION_KEY);
  state = { ...defaultState };
  document.body.classList.add('auth-locked');
  $('authGate').hidden = false;
  $('authForm').reset();
  setAuthMode('login');
  showAuthMessage('Kamu sudah log out.', false);
}
function toHex(buffer) { return Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join(''); }
async function hashPassword(password, salt) {
  if (!window.crypto?.subtle) throw new Error('Pelayar ini tidak menyokong penyimpanan kata laluan prototaip. Buka laman menggunakan HTTPS di GitHub Pages.');
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}
function makeSalt() {
  const bytes = new Uint8Array(16); crypto.getRandomValues(bytes); return toHex(bytes);
}
$('loginTab').addEventListener('click', () => setAuthMode('login'));
$('signupTab').addEventListener('click', () => setAuthMode('signup'));
$('authForm').addEventListener('submit', async event => {
  event.preventDefault();
  const signup = !$('authConfirmWrap').hidden;
  const email = $('authEmail').value.trim().toLowerCase();
  const password = $('authPassword').value;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAuthMessage('Masukkan alamat e-mel yang sah.'); return; }
  if (password.length < 8) { showAuthMessage('Kata laluan perlu sekurang-kurangnya 8 aksara.'); return; }
  const accounts = readAccounts();
  try {
    if (signup) {
      const name = $('authName').value.trim().slice(0, 30);
      if (!name) { showAuthMessage('Masukkan nama paparan.'); return; }
      if (accounts.some(account => account.email === email)) { showAuthMessage('E-mel ini sudah mempunyai akaun. Cuba Log In.'); return; }
      if (password !== $('authConfirm').value) { showAuthMessage('Kata laluan tidak sama.'); return; }
      const salt = makeSalt();
      const passwordHash = await hashPassword(password, salt);
      const user = { email, name, salt, passwordHash, createdAt: new Date().toISOString() };
      accounts.push(user); localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      enterApp(user);
    } else {
      const user = accounts.find(account => account.email === email);
      if (!user) { showAuthMessage('Akaun tidak dijumpai. Pilih Sign Up untuk mendaftar.'); return; }
      const passwordHash = await hashPassword(password, user.salt);
      if (passwordHash !== user.passwordHash) { showAuthMessage('E-mel atau kata laluan tidak betul.'); return; }
      enterApp(user);
    }
  } catch (error) { showAuthMessage(error.message || 'Ada masalah. Cuba sekali lagi.'); }
});
$('logoutButton').addEventListener('click', () => { if (confirm('Log out daripada CODECAMP?')) logout(); });

// Sambung sesi yang masih aktif pada peranti ini.
try {
  const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
  const user = session?.email ? readAccounts().find(account => account.email === session.email) : null;
  if (user) enterApp(user);
  else { localStorage.removeItem(SESSION_KEY); setAuthMode('login'); }
} catch { localStorage.removeItem(SESSION_KEY); setAuthMode('login'); }
})();
