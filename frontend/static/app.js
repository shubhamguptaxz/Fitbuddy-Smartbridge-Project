/* ═══════════════════════════════════════════════════════
   FitBuddy — Home Workout App Logic
   ═══════════════════════════════════════════════════════ */

const API_BASE = '';

// ── STATE ────────────────────────────────────────────────
const state = {
  currentGoal: 'weight_loss',
  currentLevel: 'intermediate',
  currentDays: 4,
  currentNutrGoal: 'weight_loss',
  currentFocus: 'full_body',
  currentUserId: null,
  lastPlan: null,
  currentPlanDayIndex: 0,

  // Workout player state
  workout: {
    exercises: [],
    index: 0,
    timerValue: 0,
    timerMax: 30,
    interval: null,
    isRunning: false,
    startTime: null,
    totalExercises: 0,
  },
  stats: {
    streak: parseInt(localStorage.getItem('fb_streak') || '0'),
    totalWorkouts: parseInt(localStorage.getItem('fb_total') || '0'),
    totalCal: parseInt(localStorage.getItem('fb_cal') || '0'),
  }
};

// ── EXERCISE DATABASE ─────────────────────────────────────
const EXERCISE_DB = {
  full_body: [
    { name: 'Burpees',          emoji: '🔥', sets: 3, reps: '12',  rest: '45s', level: 'intermediate', focus: 'Full Body', tip: 'Jump explosively and land softly.' },
    { name: 'Mountain Climbers',emoji: '⛰️', sets: 3, reps: '20',  rest: '30s', level: 'beginner',     focus: 'Core · Cardio', tip: 'Keep hips level and core tight.' },
    { name: 'Jump Squats',      emoji: '🦵', sets: 4, reps: '15',  rest: '40s', level: 'intermediate', focus: 'Legs · Glutes', tip: 'Push through heels when jumping.' },
    { name: 'Push-Up to Row',   emoji: '💪', sets: 3, reps: '10',  rest: '45s', level: 'advanced',     focus: 'Chest · Back', tip: 'Use a water bottle as a weight.' },
    { name: 'High Knees',       emoji: '🏃', sets: 4, reps: '30s', rest: '20s', level: 'beginner',     focus: 'Cardio', tip: 'Drive knees to hip height.' },
    { name: 'Bear Crawl',       emoji: '🐻', sets: 3, reps: '20s', rest: '30s', level: 'intermediate', focus: 'Core · Shoulders', tip: 'Keep knees 2 inches off the floor.' },
    { name: 'Lateral Shuffle',  emoji: '↔️', sets: 3, reps: '30s', rest: '20s', level: 'beginner',     focus: 'Legs · Cardio', tip: 'Stay low and light on your feet.' },
    { name: 'Plank to Downdog', emoji: '🧘', sets: 3, reps: '10',  rest: '30s', level: 'intermediate', focus: 'Core · Shoulders', tip: 'Flow smoothly between positions.' },
    { name: 'Star Jumps',       emoji: '⭐', sets: 4, reps: '20',  rest: '30s', level: 'beginner',     focus: 'Full Body', tip: 'Arms and legs simultaneously.' },
    { name: 'Inchworm Walkout', emoji: '🐛', sets: 3, reps: '8',   rest: '40s', level: 'intermediate', focus: 'Core · Arms', tip: 'Keep legs as straight as possible.' },
    { name: 'Tuck Jumps',       emoji: '🦘', sets: 3, reps: '12',  rest: '45s', level: 'advanced',     focus: 'Full Body · Power', tip: 'Bring knees to chest at peak.' },
    { name: 'Standing Oblique', emoji: '🔄', sets: 3, reps: '15',  rest: '30s', level: 'beginner',     focus: 'Core · Obliques', tip: 'Feel the crunch in your side.' },
  ],
  abs: [
    { name: 'Crunches',         emoji: '💛', sets: 4, reps: '20',  rest: '30s', level: 'beginner',     focus: 'Abs', tip: 'Don\'t pull your neck; use core.' },
    { name: 'Plank',            emoji: '🪵', sets: 3, reps: '45s', rest: '30s', level: 'beginner',     focus: 'Core', tip: 'Squeeze glutes and keep body straight.' },
    { name: 'Bicycle Crunches', emoji: '🚴', sets: 3, reps: '20',  rest: '30s', level: 'beginner',     focus: 'Obliques', tip: 'Slow and controlled wins.' },
    { name: 'Leg Raises',       emoji: '🦵', sets: 3, reps: '15',  rest: '35s', level: 'intermediate', focus: 'Lower Abs', tip: 'Don\'t arch your lower back.' },
    { name: 'Russian Twists',   emoji: '🌀', sets: 4, reps: '20',  rest: '30s', level: 'intermediate', focus: 'Obliques', tip: 'Lean back 45° for best effect.' },
    { name: 'V-Sits',           emoji: 'Ⓥ',  sets: 3, reps: '12',  rest: '40s', level: 'advanced',     focus: 'Core', tip: 'Balance on your tailbone.' },
    { name: 'Flutter Kicks',    emoji: '🦋', sets: 3, reps: '30s', rest: '30s', level: 'intermediate', focus: 'Lower Abs', tip: 'Tiny, rapid kicks just off the floor.' },
    { name: 'Dead Bug',         emoji: '🐛', sets: 3, reps: '10',  rest: '35s', level: 'beginner',     focus: 'Core Stability', tip: 'Lower back stays flat on floor.' },
  ],
  chest: [
    { name: 'Push-Ups',         emoji: '💪', sets: 4, reps: '15',  rest: '40s', level: 'beginner',     focus: 'Chest · Triceps', tip: 'Body forms a straight line.' },
    { name: 'Wide Push-Ups',    emoji: '↔️', sets: 3, reps: '12',  rest: '40s', level: 'beginner',     focus: 'Outer Chest', tip: 'Hands wider than shoulder-width.' },
    { name: 'Diamond Push-Ups', emoji: '💎', sets: 3, reps: '10',  rest: '45s', level: 'intermediate', focus: 'Inner Chest', tip: 'Thumbs and forefingers touch.' },
    { name: 'Incline Push-Ups', emoji: '📐', sets: 3, reps: '15',  rest: '35s', level: 'beginner',     focus: 'Lower Chest', tip: 'Use a chair or low table.' },
    { name: 'Decline Push-Ups', emoji: '⬇️', sets: 3, reps: '12',  rest: '40s', level: 'intermediate', focus: 'Upper Chest', tip: 'Feet elevated on a surface.' },
    { name: 'Plyometric Push',  emoji: '🚀', sets: 3, reps: '10',  rest: '50s', level: 'advanced',     focus: 'Explosive Chest', tip: 'Push hard enough to lift off.' },
    { name: 'Archer Push-Ups',  emoji: '🏹', sets: 3, reps: '8',   rest: '45s', level: 'advanced',     focus: 'Unilateral Chest', tip: 'Shift weight from side to side.' },
  ],
  arms: [
    { name: 'Chair Dips',       emoji: '🪑', sets: 3, reps: '15',  rest: '45s', level: 'beginner',     focus: 'Triceps', tip: 'Keep elbows close to body.' },
    { name: 'Close-Grip Push',  emoji: '👏', sets: 3, reps: '12',  rest: '40s', level: 'beginner',     focus: 'Triceps', tip: 'Hands directly under shoulders.' },
    { name: 'Arm Circles',      emoji: '🔄', sets: 3, reps: '30s', rest: '20s', level: 'beginner',     focus: 'Shoulders', tip: 'Both forward and backward.' },
    { name: 'Plank Shoulder Tap',emoji:'🤝', sets: 3, reps: '20',  rest: '30s', level: 'intermediate', focus: 'Shoulders · Core', tip: 'Minimize hip rotation.' },
    { name: 'Pike Push-Ups',    emoji: '🔺', sets: 3, reps: '10',  rest: '40s', level: 'intermediate', focus: 'Shoulders', tip: 'Form an inverted V shape.' },
    { name: 'Tricep Extensions', emoji:'💫', sets: 3, reps: '15',  rest: '35s', level: 'beginner',     focus: 'Triceps', tip: 'Use a water bottle for resistance.' },
  ],
  legs: [
    { name: 'Squats',           emoji: '🦵', sets: 4, reps: '20',  rest: '40s', level: 'beginner',     focus: 'Quads · Glutes', tip: 'Knees behind toes, chest up.' },
    { name: 'Lunges',           emoji: '🏃', sets: 3, reps: '12',  rest: '40s', level: 'beginner',     focus: 'Quads · Glutes', tip: 'Front knee stays over ankle.' },
    { name: 'Glute Bridges',    emoji: '🌉', sets: 4, reps: '20',  rest: '30s', level: 'beginner',     focus: 'Glutes · Hamstrings', tip: 'Squeeze glutes at the top.' },
    { name: 'Calf Raises',      emoji: '⬆️', sets: 3, reps: '25',  rest: '25s', level: 'beginner',     focus: 'Calves', tip: 'Full range — heel to toe.' },
    { name: 'Side Lunges',      emoji: '↔️', sets: 3, reps: '12',  rest: '40s', level: 'intermediate', focus: 'Inner Thighs', tip: 'Push off completely with heel.' },
    { name: 'Wall Sit',         emoji: '🧱', sets: 3, reps: '45s', rest: '45s', level: 'intermediate', focus: 'Quads', tip: 'Thighs parallel to floor.' },
    { name: 'Pistol Squat Assist',emoji:'🔫',sets: 3, reps: '8',  rest: '50s', level: 'advanced',     focus: 'Single Leg', tip: 'Hold a support if needed.' },
    { name: 'Jump Lunges',      emoji: '🦘', sets: 3, reps: '12',  rest: '45s', level: 'advanced',     focus: 'Explosive Legs', tip: 'Switch legs in the air.' },
    { name: 'Sumo Squats',      emoji: '🏋️', sets: 4, reps: '18',  rest: '35s', level: 'beginner',     focus: 'Inner Thighs · Glutes', tip: 'Wide stance, toes out 45°.' },
  ],
  back: [
    { name: 'Superman Hold',    emoji: '🦸', sets: 3, reps: '12',  rest: '35s', level: 'beginner',     focus: 'Lower Back', tip: 'Squeeze shoulder blades at top.' },
    { name: 'Reverse Snow Angel',emoji:'👼', sets: 3, reps: '15',  rest: '30s', level: 'beginner',     focus: 'Upper Back', tip: 'Lie face down, keep arms straight.' },
    { name: 'Bird Dog',         emoji: '🐦', sets: 3, reps: '12',  rest: '30s', level: 'beginner',     focus: 'Core · Back', tip: 'Extend opposite arm and leg.' },
    { name: 'Doorframe Row',    emoji: '🚪', sets: 3, reps: '12',  rest: '40s', level: 'intermediate', focus: 'Mid Back', tip: 'Lean back and pull yourself up.' },
    { name: 'Cobra Stretch',    emoji: '🐍', sets: 3, reps: '30s', rest: '20s', level: 'beginner',     focus: 'Spine Mobility', tip: 'Gently arch and breathe.' },
    { name: 'Prone Y-T-W',      emoji: '✈️', sets: 3, reps: '10',  rest: '35s', level: 'intermediate', focus: 'Upper Back · Rotator Cuff', tip: 'Thumbs up on each position.' },
  ]
};

const LEVELS_MAP = { beginner: '🌱 Beginner', intermediate: '⚡ Intermediate', advanced: '🔥 Advanced' };
const GOALS_MAP  = { weight_loss: '🔥 Lose Weight', muscle_gain: '💪 Build Muscle', general_wellness: '🌿 Stay Fit' };
const FOCUS_MAP  = { full_body: 'Full Body', abs: 'ABS', chest: 'Chest', arms: 'Arms', legs: 'Legs', back: 'Back' };

// ── HELPERS ──────────────────────────────────────────────
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// ── TOAST ────────────────────────────────────────────────
function showToast(msg, type = 'info', dur = 3500) {
  const c = $('#toast-container');
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span>${msg}</span><button class="toast-dismiss" onclick="this.parentElement.remove()">✕</button>`;
  c.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, dur);
}

// ── SCREEN NAVIGATION ─────────────────────────────────────
function showScreen(id) {
  const current = document.querySelector('.screen.active');
  const next    = document.getElementById(id);
  if (!next || next === current) return;

  const workoutScreens = ['screen-workout', 'screen-complete'];
  const showNav = !workoutScreens.includes(id);
  $('#bottom-nav').style.display = showNav ? 'flex' : 'none';

  if (current) {
    current.classList.remove('active');
    current.style.display = 'none';
  }
  next.style.display = 'flex';
  requestAnimationFrame(() => {
    next.classList.add('active');
    next.scrollTop = 0;
  });
}

// ── BOTTOM NAV ────────────────────────────────────────────
function navTo(dest) {
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const clicked = document.querySelector(`[data-nav="${dest}"]`);
  if (clicked) clicked.classList.add('active');

  switch(dest) {
    case 'home':         showScreen('screen-home');      break;
    case 'workout-list': selectFocus('full_body');       break;
    case 'plan':         showScreen('screen-plan');      break;
    case 'nutrition':    showScreen('screen-nutrition'); break;
    case 'profile':      showScreen('screen-profile');  break;
  }
}

// ── HOME STATS ────────────────────────────────────────────
function updateHomeStats() {
  const s = state.stats;
  $('#streak-count').textContent    = s.streak;
  $('#total-workouts').textContent  = s.totalWorkouts;
  $('#total-cal').textContent       = s.totalCal;
}

// ── GOAL / LEVEL / DAYS SELECTION ─────────────────────────
function selectGoal(goal) {
  state.currentGoal = goal;
  $$('[data-goal]').forEach(c => c.classList.remove('active'));
  document.querySelectorAll(`[data-goal="${goal}"]`).forEach(c => c.classList.add('active'));
}

function selectNutrGoal(goal) {
  state.currentNutrGoal = goal;
  $$('[data-nutr-goal]').forEach(c => c.classList.remove('active'));
  document.querySelectorAll(`[data-nutr-goal="${goal}"]`).forEach(c => c.classList.add('active'));
}

function selectLevel(level) {
  state.currentLevel = level;
  $$('[data-level]').forEach(c => c.classList.remove('active'));
  document.querySelectorAll(`[data-level="${level}"]`).forEach(c => c.classList.add('active'));
  // If navigating to exercise list from level card on home
  if (document.getElementById('screen-exercise-list').classList.contains('active')) {
    filterExercises('all');
  }
}

function selectDays(days) {
  state.currentDays = days;
  $$('.day-pick').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-day="${days}"]`)?.classList.add('active');
}

// ── FOCUS AREA ────────────────────────────────────────────
function selectFocus(focus) {
  state.currentFocus = focus;
  const focusName = FOCUS_MAP[focus] || focus;
  $('#exercise-list-title').textContent = focusName;
  const exercises = EXERCISE_DB[focus] || [];
  $('#exercise-list-badge').textContent = `${exercises.length} exercises`;
  renderExerciseList(exercises, 'all');
  showScreen('screen-exercise-list');
}

function showAllFocus() { selectFocus('full_body'); }

function filterExercises(levelFilter) {
  $$('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === levelFilter));
  const exercises = EXERCISE_DB[state.currentFocus] || [];
  const filtered = levelFilter === 'all' ? exercises : exercises.filter(e => e.level === levelFilter);
  renderExerciseList(filtered, levelFilter);
}

function renderExerciseList(exercises, levelFilter) {
  const container = $('#exercise-list-container');
  if (!exercises.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text3)">No exercises found for this level.</div>`;
    return;
  }
  container.innerHTML = exercises.map((ex, i) => `
    <div class="ex-list-item" data-index="${i}" onclick="viewExercise(${i})">
      <div class="ex-list-emoji">${ex.emoji}</div>
      <div class="ex-list-info">
        <div class="ex-list-name">${ex.name}</div>
        <div class="ex-list-meta">${ex.focus} · ${ex.sets} sets · ${ex.reps} reps</div>
        <div class="ex-list-meta">${ex.tip.slice(0, 40)}...</div>
      </div>
      <div class="ex-list-right">
        <div class="ex-list-sets">${ex.sets}×${ex.reps}</div>
        <div class="ex-level-dot">${LEVELS_MAP[ex.level]?.split(' ')[0] || '⚡'}</div>
      </div>
    </div>
  `).join('');
}

function viewExercise(index) {
  // Toggle selection for starting the workout
  const items = $$('.ex-list-item');
  items[index]?.classList.toggle('selected');
}

function startWorkout() {
  const selected = $$('.ex-list-item.selected');
  let exercises;
  if (selected.length > 0) {
    const allEx = EXERCISE_DB[state.currentFocus] || [];
    exercises = [...selected].map(el => allEx[parseInt(el.dataset.index)]);
  } else {
    exercises = EXERCISE_DB[state.currentFocus] || [];
  }
  if (!exercises.length) { showToast('No exercises to start!', 'warning'); return; }
  launchWorkoutPlayer(exercises);
}

// ── WORKOUT PLAYER ────────────────────────────────────────
function launchWorkoutPlayer(exercises) {
  const w = state.workout;
  w.exercises = exercises;
  w.index = 0;
  w.isRunning = false;
  w.startTime = Date.now();
  w.totalExercises = exercises.length;
  clearInterval(w.interval);
  w.interval = null;

  showScreen('screen-workout');
  renderExercise(0);
}

function renderExercise(index) {
  const w = state.workout;
  const ex = w.exercises[index];
  if (!ex) return;

  // Parse reps to seconds for timer
  const isTime = ex.reps.includes('s');
  const secs = isTime ? parseInt(ex.reps) : 30;
  w.timerMax = secs;
  w.timerValue = secs;
  w.isRunning = false;

  // Update header
  $('#workout-ex-label').textContent = `Exercise ${index + 1} / ${w.exercises.length}`;
  const pct = (index / w.exercises.length) * 100;
  $('#workout-progress-bar').style.width = pct + '%';

  // Update exercise display
  $('#exercise-emoji').textContent    = ex.emoji;
  $('#exercise-level-tag').textContent = LEVELS_MAP[ex.level] || ex.level;
  $('#ex-name').textContent           = ex.name;
  $('#ex-focus-tag').textContent      = ex.focus;
  $('#ex-sets').textContent           = ex.sets;
  $('#ex-reps').textContent           = isTime ? ex.reps : ex.reps;
  $('#ex-rest').textContent           = ex.rest;
  $('#ex-tip-box').textContent        = ex.tip;

  const label = isTime ? 'secs' : 'reps';
  $('#btn-start-stop').textContent = '▶ Start';
  updateTimerDisplay(secs, label);
}

function updateTimerDisplay(val, label = 'secs') {
  $('#timer-count').textContent = String(val).padStart(2, '0');
  $('#timer-label').textContent = label;
  const w = state.workout;
  const offset = 326.7 * (1 - val / w.timerMax);
  $('#timer-circle').style.strokeDashoffset = offset;
}

function toggleTimer() {
  const w = state.workout;
  if (w.isRunning) {
    clearInterval(w.interval);
    w.isRunning = false;
    $('#btn-start-stop').textContent = '▶ Resume';
  } else {
    w.isRunning = true;
    $('#btn-start-stop').textContent = '⏸ Pause';
    w.interval = setInterval(() => {
      w.timerValue--;
      updateTimerDisplay(Math.max(0, w.timerValue));
      if (w.timerValue <= 0) {
        clearInterval(w.interval);
        w.isRunning = false;
        $('#btn-start-stop').textContent = '✅ Done!';
        showToast('Set complete! Rest and continue.', 'success', 2000);
      }
    }, 1000);
  }
}

function nextExercise() {
  clearInterval(state.workout.interval);
  state.workout.isRunning = false;
  const next = state.workout.index + 1;
  if (next >= state.workout.exercises.length) {
    finishWorkout();
  } else {
    state.workout.index = next;
    renderExercise(next);
  }
}

function prevExercise() {
  clearInterval(state.workout.interval);
  state.workout.isRunning = false;
  const prev = Math.max(0, state.workout.index - 1);
  state.workout.index = prev;
  renderExercise(prev);
}

function finishWorkout() {
  clearInterval(state.workout.interval);
  const elapsed = Math.round((Date.now() - state.workout.startTime) / 1000);
  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const calBurned = Math.round(state.workout.exercises.length * 12 + elapsed * 0.15);

  // Update stats
  state.stats.totalWorkouts++;
  state.stats.totalCal += calBurned;
  state.stats.streak++;
  localStorage.setItem('fb_streak', state.stats.streak);
  localStorage.setItem('fb_total', state.stats.totalWorkouts);
  localStorage.setItem('fb_cal', state.stats.totalCal);
  updateHomeStats();

  // Show completion screen
  $('#cs-duration').textContent  = `${mins}:${String(secs).padStart(2,'0')}`;
  $('#cs-exercises').textContent = state.workout.exercises.length;
  $('#cs-kcal').textContent      = calBurned;
  const msgs = [
    '"Every rep you do today makes you stronger tomorrow!"',
    '"Pain is temporary. Pride is forever."',
    '"You didn\'t come this far to only come this far."',
    '"The only bad workout is the one that didn\'t happen."',
  ];
  $('#complete-motivate').textContent = msgs[Math.floor(Math.random() * msgs.length)];
  showScreen('screen-complete');
}

function restartWorkout() {
  launchWorkoutPlayer(state.workout.exercises);
}

function confirmExitWorkout() {
  clearInterval(state.workout.interval);
  showScreen('screen-home');
  $('#bottom-nav').style.display = 'flex';
}

// ── 4-WEEK PLAN ───────────────────────────────────────────
function showWeekPlan() {
  showScreen('screen-profile');
  showToast('Fill in your profile to get your 4-week plan!', 'info');
}

// ── GENERATE PLAN (AI) ────────────────────────────────────
async function generatePlan() {
  const name   = $('#user-name').value.trim();
  const age    = parseInt($('#user-age').value);
  const weight = parseFloat($('#user-weight').value);

  if (!name || !age || !weight) {
    showToast('Please fill in all details.', 'warning'); return;
  }

  const btn  = $('#btn-generate');
  const spin = $('#btn-spinner');
  const txt  = $('#btn-text');
  btn.disabled = true;
  spin.style.display = 'inline-block';
  txt.textContent = 'Generating...';

  showScreen('screen-plan');
  $('#plan-loading').style.display = 'flex';
  $('#plan-content').style.display = 'none';

  // Animate loading bar
  let pct = 0;
  const loadingTips = ['Analyzing your profile...', 'Building your schedule...', 'Optimizing for your goal...', 'Adding workout details...', 'Almost done...'];
  let tipIdx = 0;
  const barFill = $('#loading-bar-fill');
  const tipEl   = $('#loading-tip');
  const barInterval = setInterval(() => {
    pct = Math.min(pct + 2, 92);
    barFill.style.width = pct + '%';
    if (pct % 18 === 0) tipEl.textContent = loadingTips[tipIdx++ % loadingTips.length];
  }, 200);

  try {
    const res = await fetch(`${API_BASE}/api/generate-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        age,
        weight,
        goal: state.currentGoal,
        intensity: state.currentLevel === 'beginner' ? 'low' : state.currentLevel === 'advanced' ? 'high' : 'medium'
      })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Error'); }

    const data = await res.json();
    state.currentUserId = data.user_id;
    state.lastPlan = data.plan;

    clearInterval(barInterval);
    barFill.style.width = '100%';
    await new Promise(r => setTimeout(r, 400));

    renderPlan(data.plan, name);
    $('#plan-loading').style.display = 'none';
    $('#plan-content').style.display = 'block';
    showToast(`🎉 Plan ready! Your ID: ${state.currentUserId}`, 'success', 5000);

    // Pre-fill other panels
    if ($('#feedback-user-id')) $('#feedback-user-id').value = state.currentUserId;
    if ($('#nutrition-user-id')) $('#nutrition-user-id').value = state.currentUserId;

  } catch(err) {
    clearInterval(barInterval);
    $('#plan-loading').style.display = 'none';
    showScreen('screen-profile');
    showToast(`Error: ${err.message}`, 'error', 6000);
  } finally {
    btn.disabled = false;
    spin.style.display = 'none';
    txt.textContent = '🚀 Generate My Plan';
  }
}

// ── RENDER PLAN ───────────────────────────────────────────
function renderPlan(plan, name) {
  // Summary card
  $('#plan-title').textContent = plan.plan_title || 'Your Personalized Plan';
  $('#plan-goal-summary').textContent = plan.goal_summary || '';
  $(`#plan-meta-goal`).textContent = GOALS_MAP[state.currentGoal] || state.currentGoal;
  $(`#plan-meta-level`).textContent = LEVELS_MAP[state.currentLevel] || state.currentLevel;
  $(`#plan-meta-uid`).textContent   = `👤 ID: ${state.currentUserId}`;
  $('#plan-user-badge').textContent  = name || 'You';

  // Weekly overview
  $('#weekly-overview').innerHTML = `📝 <em>"${plan.weekly_overview || ''}"</em>`;

  // Day tabs
  const days = plan.days || [];
  state.currentPlanDayIndex = 0;
  const tabsHtml = days.map((day, i) => {
    const parts = (day.day || '').split(' - ');
    const dayNum = parts[0]?.replace('Day ', '') || (i + 1);
    const dayName = parts[1]?.slice(0, 3) || ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] || '';
    return `
      <div class="day-tab ${i === 0 ? 'active' : ''}" onclick="showPlanDay(${i})">
        <div class="day-num">${dayNum}</div>
        <div class="day-short">${dayName}</div>
      </div>`;
  }).join('');
  $('#day-tabs').innerHTML = tabsHtml;

  // Initial day
  renderPlanDay(days, 0);

  // Weekly tips
  if (plan.weekly_tips?.length) {
    $('#weekly-tips-section').innerHTML = `
      <div class="wts-title">💡 Pro Tips for This Week</div>
      ${plan.weekly_tips.map((tip, i) => `
        <div class="wts-tip">
          <div class="wts-num">${i + 1}</div>
          <div class="wts-text">${tip}</div>
        </div>
      `).join('')}
    `;
  } else {
    $('#weekly-tips-section').innerHTML = '';
  }
}

function showPlanDay(index) {
  state.currentPlanDayIndex = index;
  $$('.day-tab').forEach((t, i) => t.classList.toggle('active', i === index));
  const days = state.lastPlan?.days || [];
  renderPlanDay(days, index);
}

function renderPlanDay(days, index) {
  const day = days[index];
  if (!day) return;

  const exerciseEmojis = ['💪','🏃','⚡','🔥','🎯','⭐','🌀'];
  const exHtml = (day.exercises || []).map((ex, i) => `
    <div class="dd-exercise-item">
      <div class="dd-ex-emoji">${exerciseEmojis[i % exerciseEmojis.length]}</div>
      <div class="dd-ex-info">
        <div class="dd-ex-name">${ex.name}</div>
        <div class="dd-ex-meta">${ex.sets} sets · ${ex.reps} · Rest: ${ex.rest}</div>
        ${ex.tips ? `<div class="dd-ex-tip">💡 ${ex.tips}</div>` : ''}
      </div>
    </div>
  `).join('');

  $('#day-detail-card').innerHTML = `
    <div class="day-detail-header">
      <div>
        <div class="dd-title">${day.day || `Day ${index + 1}`}</div>
        <div class="dd-duration">⏱ ${day.duration_minutes || 30} minutes</div>
      </div>
      <div class="dd-focus">${day.focus || ''}</div>
    </div>
    <div class="day-detail-body">
      <div class="dd-section-title">🔥 Warm-Up</div>
      <div class="dd-warmup-text">${day.warmup || 'Light stretching for 5 minutes.'}</div>

      <div class="dd-section-title">💪 Exercises</div>
      ${exHtml}

      <div class="dd-section-title">❄️ Cool-Down</div>
      <div class="dd-warmup-text">${day.cooldown || 'Static stretching for 5 minutes.'}</div>

      ${day.motivational_note ? `<div class="dd-motivate">"${day.motivational_note}"</div>` : ''}
    </div>
  `;
}

function startPlanWorkout() {
  // Convert today's plan exercises to workout format
  const day = state.lastPlan?.days?.[state.currentPlanDayIndex];
  if (!day?.exercises?.length) {
    showToast('No exercises found for today!', 'warning'); return;
  }
  const emojis = ['💪','🏃','⚡','🔥','🎯','⭐','🌀'];
  const exercises = day.exercises.map((ex, i) => ({
    name:  ex.name,
    emoji: emojis[i % emojis.length],
    sets:  ex.sets,
    reps:  ex.reps,
    rest:  ex.rest,
    level: state.currentLevel,
    focus: day.focus || 'Full Body',
    tip:   ex.tips || 'Focus on form over speed.',
  }));
  launchWorkoutPlayer(exercises);
}

// ── UPDATE PLAN ────────────────────────────────────────────
async function updatePlan() {
  const userId   = parseInt($('#feedback-user-id').value);
  const feedback = $('#feedback-text').value.trim();
  if (!userId)   { showToast('Enter your User ID.', 'warning'); return; }
  if (!feedback) { showToast('Describe what to change.', 'warning'); return; }

  const btn = $('#btn-update');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Updating...';

  showScreen('screen-plan');
  $('#plan-loading').style.display = 'flex';
  $('#plan-content').style.display = 'none';

  const barFill = $('#loading-bar-fill');
  let pct = 0;
  const barInt = setInterval(() => { pct = Math.min(pct + 3, 90); barFill.style.width = pct + '%'; }, 200);

  try {
    const res = await fetch(`${API_BASE}/api/update-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, feedback })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Error'); }
    const data = await res.json();
    state.lastPlan = data.plan;
    state.currentUserId = userId;

    clearInterval(barInt);
    barFill.style.width = '100%';
    await new Promise(r => setTimeout(r, 400));

    renderPlan(data.plan, 'Your Updated');
    $('#plan-loading').style.display = 'none';
    $('#plan-content').style.display = 'block';
    showToast('✅ Plan updated with your feedback!', 'success');

  } catch(err) {
    clearInterval(barInt);
    $('#plan-loading').style.display = 'none';
    showScreen('screen-feedback');
    showToast(`Error: ${err.message}`, 'error', 6000);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✏️ Update My Plan';
  }
}

function applyChip(text) {
  const ta = $('#feedback-text');
  if (ta) { ta.value = text; ta.focus(); }
}

// ── NUTRITION TIP ──────────────────────────────────────────
async function getNutritionTip() {
  const goalSelect = state.currentNutrGoal;
  const userIdInput = $('#nutrition-user-id').value.trim();
  if (!goalSelect) { showToast('Please select a goal.', 'warning'); return; }

  const userId = userIdInput ? parseInt(userIdInput) : (state.currentUserId || 1);
  const btn = $('#btn-nutrition');
  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Getting Plan...';

  $('#nutrition-loading').style.display = 'block';
  $('#nutrition-result').style.display  = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/nutrition-tip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, goal: goalSelect })
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.detail || 'Error'); }
    const data = await res.json();
    renderNutritionResult(data.nutrition);
    $('#nutrition-loading').style.display = 'none';
    $('#nutrition-result').style.display  = 'block';
    showToast('🥗 Nutrition plan ready!', 'success');
  } catch(err) {
    $('#nutrition-loading').style.display = 'none';
    showToast(`Error: ${err.message}`, 'error', 6000);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '🥗 Get Nutrition Plan';
  }
}

function renderNutritionResult(n) {
  const container = $('#nutrition-result');
  container.innerHTML = `
    <div class="nutrition-result-card">
      <div class="nr-header">
        <div class="nr-title">🥗 ${n.tip_title || 'Your Nutrition Plan'}</div>
        <div class="nr-tip-text">${n.tip || ''}</div>
      </div>
      <div class="nr-body">
        <div class="nr-grid">
          <div class="nr-food-section">
            <h4 class="include">✅ Include</h4>
            <ul>${(n.foods_to_include || []).map(f => `<li>${f}</li>`).join('')}</ul>
          </div>
          <div class="nr-food-section">
            <h4 class="avoid">❌ Avoid</h4>
            <ul>${(n.foods_to_avoid || []).map(f => `<li>${f}</li>`).join('')}</ul>
          </div>
        </div>
        <div class="nr-advice-grid">
          <div class="nr-advice-card">
            <h4>💧 Hydration</h4>
            <p>${n.hydration_advice || ''}</p>
          </div>
          <div class="nr-advice-card">
            <h4>🛌 Recovery</h4>
            <p>${n.recovery_advice || ''}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateHomeStats();
  selectGoal('weight_loss');
  selectNutrGoal('weight_loss');
  selectLevel('intermediate');
  selectDays(4);

  // Load stats from today
  const today = new Date().toDateString();
  const lastDay = localStorage.getItem('fb_lastday');
  if (lastDay !== today) {
    localStorage.setItem('fb_lastday', today);
    // streak stays, but reset daily flag
  }
});
