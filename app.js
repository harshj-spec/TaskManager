/**
 * TaskFlow — Full Application Core Logic
 * Tasks, Dynamic Urgency Engine, Upgraded Dark Mode,
 * Feature Suggestions Analyzer, Support Help Center, and Auth Profiles
 */

(function () {
  'use strict';

  // --- Storage Constants ---
  const STORAGE_TASKS_KEY = 'taskflow_pro_tasks_v3';
  const STORAGE_SETTINGS_KEY = 'taskflow_pro_settings_v3';
  const STORAGE_ACCOUNTS_KEY = 'taskflow_registered_accounts_v1';
  const STORAGE_SESSION_KEY = 'taskflow_active_session_v1';
  const STORAGE_SUGGESTIONS_KEY = 'taskflow_user_suggestions_v2';
  const STORAGE_PROBLEMS_KEY = 'taskflow_support_problems_v1';

  // --- Initial Sample Tasks ---
  function getSampleTasks() {
    const today = getTodayDateString();
    const dayAfter = getOffsetDateString(2);

    return [
      {
        id: 'task_sample_urgent_1',
        title: 'Review Client Contract & Sign NDA',
        description: 'Urgent legal sign-off required before product deployment.',
        category: 'Work',
        priority: 'urgent',
        isDaily: false,
        dailyTime: '',
        dueDate: today,
        dueTime: '17:00',
        completedDates: [],
        schedules: [
          { id: 'sch_1_1', date: today, time: '17:00', completed: false, completedAt: null }
        ],
        subtasks: [
          { id: 'sub_1_1', title: 'Check indemnity clause', done: true },
          { id: 'sub_1_2', title: 'Consult with legal counsel', done: false },
          { id: 'sub_1_3', title: 'Electronically sign PDF', done: false }
        ],
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_sample_daily_1',
        title: 'Morning Focus & Deep Work Session',
        description: '90-minute uninterrupted deep work block for top priority items.',
        category: 'Routine',
        priority: 'high',
        isDaily: true,
        dailyTime: '10:00',
        dueDate: today,
        dueTime: '10:00',
        completedDates: [],
        schedules: [],
        subtasks: [
          { id: 'sub_d1_1', title: 'Close Slack and email notifications', done: false },
          { id: 'sub_d1_2', title: 'Focus on primary code deliverable', done: false }
        ],
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_sample_multi_1',
        title: 'Bi-Weekly Executive Stakeholder Sync',
        description: 'Scheduled on multiple dates with distinct agenda times.',
        category: 'Work',
        priority: 'high',
        isDaily: false,
        dailyTime: '',
        dueDate: today,
        dueTime: '14:30',
        completedDates: [],
        schedules: [
          { id: 'sch_m_1', date: today, time: '14:30', completed: false, completedAt: null },
          { id: 'sch_m_2', date: dayAfter, time: '11:00', completed: false, completedAt: null }
        ],
        subtasks: [
          { id: 'sub_m_1', title: 'Prepare slide deck numbers', done: true },
          { id: 'sub_m_2', title: 'Send invitation link', done: true }
        ],
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      },
      {
        id: 'task_sample_completed_1',
        title: 'Sprint Planning & Goal Alignment',
        description: 'Finalized user stories and milestones for current cycle.',
        category: 'Work',
        priority: 'medium',
        isDaily: false,
        dailyTime: '',
        dueDate: today,
        dueTime: '11:00',
        completedDates: [],
        schedules: [
          { id: 'sch_c_1', date: today, time: '11:00', completed: true, completedAt: new Date().toISOString() }
        ],
        subtasks: [
          { id: 'sub_c_1', title: 'Estimate story points', done: true },
          { id: 'sub_c_2', title: 'Assign team leads', done: true }
        ],
        completed: true,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    ];
  }

  // --- Global Application State ---
  let state = {
    currentPage: 'tasks', // 'tasks' | 'improve' | 'support' | 'privacy'
    tasks: [],
    activeTab: 'urgency', // 'urgency' | 'today' | 'daily' | 'all'
    selectedDate: getTodayDateString(),
    searchQuery: '',
    filterCategory: 'ALL',
    completedSectionCollapsed: false,
    soundEnabled: true,
    darkMode: false,
    currentUser: null, // { email, createdAt }
    accounts: [], // [{ email, password, createdAt }]
    editingTaskId: null,
    modalSubtasks: [],
    modalSchedules: []
  };

  // --- Web Audio Synthesizer ---
  const soundSynth = {
    ctx: null,
    init() {
      if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
    },
    playComplete() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 -> E5 -> G5 -> C6
        notes.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          gain.gain.setValueAtTime(0.12, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);

          osc.connect(gain);
          gain.connect(this.ctx.destination);

          osc.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.3);
        });
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    },
    playUncheck() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    },
    playSubtask() {
      if (!state.soundEnabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(750, now);
        osc.frequency.setValueAtTime(950, now + 0.04);

        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.1);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    }
  };

  // --- Confetti Particle System ---
  const particleCelebration = {
    canvas: null,
    ctx: null,
    particles: [],
    isRunning: false,

    init() {
      this.canvas = document.getElementById('celebrationCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    },

    resize() {
      if (!this.canvas) return;
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    },

    burst(x, y) {
      this.init();
      if (!this.ctx) return;

      const colors = ['#2563eb', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
      const total = 40;

      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 * i) / total + (Math.random() - 0.5);
        const speed = Math.random() * 7 + 3;
        this.particles.push({
          x: x || window.innerWidth / 2,
          y: y || window.innerHeight / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2.5,
          size: Math.random() * 6 + 3,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          alpha: 1,
          decay: Math.random() * 0.02 + 0.015
        });
      }

      if (!this.isRunning) {
        this.isRunning = true;
        this.loop();
      }
    },

    loop() {
      if (!this.isRunning) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          this.particles.splice(i, 1);
          continue;
        }

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.globalAlpha = p.alpha;
        this.ctx.fillStyle = p.color;
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        this.ctx.restore();
      }

      if (this.particles.length > 0) {
        requestAnimationFrame(() => this.loop());
      } else {
        this.isRunning = false;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // --- Date Utility Helpers ---
  function getTodayDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function getOffsetDateString(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    if (h === undefined || m === undefined) return timeStr;
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${ampm}`;
  }

  function formatDateFriendly(dateStr) {
    if (!dateStr) return '';
    const today = getTodayDateString();
    const tomorrow = getOffsetDateString(1);
    const yesterday = getOffsetDateString(-1);

    if (dateStr === today) return 'Today';
    if (dateStr === tomorrow) return 'Tomorrow';
    if (dateStr === yesterday) return 'Yesterday';

    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const obj = new Date(y, m - 1, d);
    return obj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // --- Dynamic Urgency Calculation Engine ---
  function calculateTaskUrgency(task, targetDateStr = null, targetTimeStr = null) {
    const now = new Date();
    let dueDateStr = targetDateStr;
    let dueTimeStr = targetTimeStr;

    if (!dueDateStr) {
      if (task.isDaily) {
        dueDateStr = state.selectedDate || getTodayDateString();
        dueTimeStr = task.dailyTime || '23:59';
      } else if (task.schedules && task.schedules.length > 0) {
        const upcoming = task.schedules
          .filter(s => !s.completed)
          .sort((a, b) => (a.date + ' ' + (a.time || '23:59')).localeCompare(b.date + ' ' + (b.time || '23:59')))[0];

        if (upcoming) {
          dueDateStr = upcoming.date;
          dueTimeStr = upcoming.time || '23:59';
        } else {
          dueDateStr = task.schedules[0].date;
          dueTimeStr = task.schedules[0].time || '23:59';
        }
      } else {
        dueDateStr = task.dueDate || (task.createdAt ? task.createdAt.split('T')[0] : getTodayDateString());
        dueTimeStr = task.dueTime || '23:59';
      }
    }

    if (!dueTimeStr) {
      dueTimeStr = '23:59';
    }

    const [y, mo, d] = dueDateStr.split('-').map(Number);
    const [h, mi] = dueTimeStr.split(':').map(Number);
    const targetDateObj = new Date(y, mo - 1, d, h || 23, mi || 59, 0, 0);

    const diffMs = targetDateObj.getTime() - now.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    const basePriorityWeight = {
      urgent: 80,
      high: 50,
      medium: 20,
      low: 0
    }[task.priority || 'medium'] || 20;

    let urgencyLevel = 'normal';
    let urgencyBadgeText = '';
    let urgencyScore = 0;
    let borderClass = 'urgency-border-normal';

    if (diffHours < 0) {
      const overdueHours = Math.abs(diffHours);
      urgencyLevel = 'overdue';
      borderClass = 'urgency-border-overdue';

      if (overdueHours < 1) {
        urgencyBadgeText = `🚨 OVERDUE by ${Math.max(1, Math.round(overdueHours * 60))}m`;
      } else if (overdueHours < 24) {
        urgencyBadgeText = `🚨 OVERDUE by ${Math.round(overdueHours)}h`;
      } else {
        const days = Math.round(overdueHours / 24);
        urgencyBadgeText = `🚨 OVERDUE by ${days} day${days > 1 ? 's' : ''}`;
      }

      urgencyScore = 10000 + Math.min(overdueHours * 20, 2000) + basePriorityWeight;
    } else if (diffHours <= 6) {
      urgencyLevel = 'critical';
      borderClass = 'urgency-border-critical';
      const mins = Math.max(1, Math.round(diffHours * 60));
      urgencyBadgeText = mins < 60 ? `🔥 Due in ${mins}m` : `🔥 Due in ${Math.round(diffHours)}h (${formatTime(dueTimeStr)})`;
      urgencyScore = 6000 + (6 - diffHours) * 200 + basePriorityWeight;
    } else if (diffHours <= 24) {
      urgencyLevel = 'high';
      borderClass = 'urgency-border-high';
      urgencyBadgeText = `⚡ Due today (${formatTime(dueTimeStr)})`;
      urgencyScore = 3000 + (24 - diffHours) * 50 + basePriorityWeight;
    } else if (diffHours <= 48) {
      urgencyLevel = 'medium';
      borderClass = 'urgency-border-medium';
      urgencyBadgeText = `⏳ Due tomorrow (${formatTime(dueTimeStr)})`;
      urgencyScore = 1500 + (48 - diffHours) * 20 + basePriorityWeight;
    } else if (diffHours <= 168) {
      urgencyLevel = 'normal';
      borderClass = 'urgency-border-normal';
      const daysLeft = Math.ceil(diffHours / 24);
      urgencyBadgeText = `📅 In ${daysLeft} days`;
      urgencyScore = 500 + (168 - diffHours) * 2 + basePriorityWeight;
    } else {
      urgencyLevel = 'normal';
      borderClass = 'urgency-border-normal';
      urgencyBadgeText = `📅 ${formatDateFriendly(dueDateStr)}`;
      urgencyScore = 100 + basePriorityWeight;
    }

    return {
      urgencyLevel,
      urgencyScore,
      urgencyBadgeText,
      borderClass,
      dueDateStr,
      dueTimeStr,
      diffHours
    };
  }

  // --- Streak Calculator for Daily Tasks ---
  function calculateStreak(task) {
    if (!task.isDaily || !Array.isArray(task.completedDates) || task.completedDates.length === 0) return 0;
    const completedSet = new Set(task.completedDates);
    let streak = 0;
    const d = new Date();
    const today = getTodayDateString();

    if (!completedSet.has(today)) {
      d.setDate(d.getDate() - 1);
    }

    while (true) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;

      if (completedSet.has(key)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  // --- Data Loading & Storage (Per-User Isolation) ---
  function loadData() {
    try {
      const storedSettings = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        state.soundEnabled = parsed.soundEnabled ?? true;
        state.darkMode = parsed.darkMode ?? false;
      } else {
        state.darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      const storedAccounts = localStorage.getItem(STORAGE_ACCOUNTS_KEY);
      state.accounts = storedAccounts ? JSON.parse(storedAccounts) : [];

      // Check sessionStorage (standard session) then localStorage (if "Remember Me" was enabled)
      const storedSession = sessionStorage.getItem(STORAGE_SESSION_KEY) || localStorage.getItem(STORAGE_SESSION_KEY);
      state.currentUser = storedSession ? JSON.parse(storedSession) : null;

      // Only load tasks if a user is authenticated
      if (state.currentUser && state.currentUser.email) {
        const userEmailKey = 'taskflow_tasks_' + state.currentUser.email.toLowerCase();
        const storedTasks = localStorage.getItem(userEmailKey);
        state.tasks = storedTasks ? JSON.parse(storedTasks) : [];
      } else {
        state.tasks = [];
      }
    } catch (err) {
      console.error('Storage load error:', err);
      state.tasks = [];
      state.accounts = [];
      state.currentUser = null;
    }
  }

  function saveData() {
    try {
      if (state.currentUser && state.currentUser.email) {
        const userEmailKey = 'taskflow_tasks_' + state.currentUser.email.toLowerCase();
        localStorage.setItem(userEmailKey, JSON.stringify(state.tasks));

        // Preserve session in whichever storage it was saved into
        if (localStorage.getItem(STORAGE_SESSION_KEY)) {
          localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.currentUser));
        } else if (sessionStorage.getItem(STORAGE_SESSION_KEY)) {
          sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.currentUser));
        }
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
        sessionStorage.removeItem(STORAGE_SESSION_KEY);
      }
      localStorage.setItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(state.accounts));
      localStorage.setItem(
        STORAGE_SETTINGS_KEY,
        JSON.stringify({
          soundEnabled: state.soundEnabled,
          darkMode: state.darkMode
        })
      );
    } catch (err) {
      console.error('Storage save error:', err);
    }
  }

  // --- Toast Notifications ---
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    const colorClass =
      type === 'success'
        ? 'bg-emerald-600 text-white border-emerald-500'
        : type === 'warning'
        ? 'bg-amber-600 text-white border-amber-500'
        : 'bg-slate-900 text-white border-slate-700';

    toast.className = `toast-item px-4 py-3 rounded-2xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition-all ${colorClass}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : 'ℹ️'}</span>
      <span>${escapeHtml(msg)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(8px)';
      setTimeout(() => toast.remove(), 250);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- SPA Page Router ---
  function navigateToPage(pageName) {
    state.currentPage = pageName;

    const pages = {
      tasks: document.getElementById('viewPageTasks'),
      improve: document.getElementById('viewPageImprove'),
      support: document.getElementById('viewPageSupport'),
      privacy: document.getElementById('viewPagePrivacy')
    };

    Object.keys(pages).forEach(key => {
      if (pages[key]) {
        pages[key].classList.toggle('hidden', key !== pageName);
      }
    });

    // Update active nav links
    document.querySelectorAll('.nav-page-btn').forEach(btn => {
      const match =
        (btn.id === 'navLinkTasks' && pageName === 'tasks') ||
        (btn.id === 'navLinkImprove' && pageName === 'improve') ||
        (btn.id === 'navLinkSupport' && pageName === 'support') ||
        (btn.id === 'navLinkPrivacy' && pageName === 'privacy') ||
        btn.dataset.page === pageName;

      btn.classList.toggle('active', match);
    });

    if (pageName === 'tasks') {
      renderAll();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- Upgraded Dark Mode Engine ---
  function applyTheme() {
    const sun = document.getElementById('iconSun');
    const moon = document.getElementById('iconMoon');

    if (state.darkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
      sun?.classList.remove('hidden');
      moon?.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
      sun?.classList.add('hidden');
      moon?.classList.remove('hidden');
    }

    const soundOn = document.getElementById('iconSoundOn');
    const soundOff = document.getElementById('iconSoundOff');
    if (state.soundEnabled) {
      soundOn?.classList.remove('hidden');
      soundOff?.classList.add('hidden');
    } else {
      soundOn?.classList.add('hidden');
      soundOff?.classList.remove('hidden');
    }

    // Update user avatar & name
    const userAvatar = document.getElementById('headerUserAvatar');
    const userName = document.getElementById('headerUserName');
    if (state.currentUser && state.currentUser.email) {
      const namePart = state.currentUser.email.split('@')[0];
      if (userAvatar) userAvatar.textContent = namePart.charAt(0).toUpperCase();
      if (userName) userName.textContent = namePart;
    } else {
      if (userAvatar) userAvatar.textContent = '👤';
      if (userName) userName.textContent = 'Log In / Sign Up';
    }
  }

  function updateAuthUI() {
    const lockScreen = document.getElementById('authLockScreen');
    const dashboard = document.getElementById('authTasksDashboard');
    const userAvatar = document.getElementById('headerUserAvatar');
    const userName = document.getElementById('headerUserName');

    if (state.currentUser && state.currentUser.email) {
      lockScreen?.classList.add('hidden');
      dashboard?.classList.remove('hidden');

      const namePart = state.currentUser.email.split('@')[0];
      if (userAvatar) userAvatar.textContent = namePart.charAt(0).toUpperCase();
      if (userName) userName.textContent = namePart;
    } else {
      lockScreen?.classList.remove('hidden');
      dashboard?.classList.add('hidden');

      if (userAvatar) userAvatar.textContent = '👤';
      if (userName) userName.textContent = 'Log In / Sign Up';
    }
  }

  function updateLiveClock() {
    const el = document.getElementById('headerLiveClock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // --- PAGE 1: TASK DASHBOARD RENDERING ---
  function renderAll() {
    updateLiveClock();
    updateAuthUI();
    applyTheme();

    if (state.currentPage !== 'tasks') return;

    // If not logged in, block all task rendering
    if (!state.currentUser) {
      return;
    }

    // Update view mode tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (state.activeTab === 'urgency') document.getElementById('tabUrgency')?.classList.add('active');
    else if (state.activeTab === 'today') document.getElementById('tabToday')?.classList.add('active');
    else if (state.activeTab === 'daily') document.getElementById('tabDailyRoutines')?.classList.add('active');
    else if (state.activeTab === 'all') document.getElementById('tabAllTasks')?.classList.add('active');

    const pendingContainer = document.getElementById('pendingTasksContainer');
    const completedContainer = document.getElementById('completedTasksContainer');
    const emptyPending = document.getElementById('emptyPendingState');
    const emptyCompleted = document.getElementById('emptyCompletedState');
    const badgePending = document.getElementById('badgePendingCount');
    const badgeCompleted = document.getElementById('badgeCompletedCount');
    const clearCompletedBtn = document.getElementById('btnClearCompleted');

    const metricOverdue = document.getElementById('metricOverdueCount');
    const metricDueToday = document.getElementById('metricDueTodayCount');
    const metricTotalPending = document.getElementById('metricTotalPendingCount');
    const metricCompleted = document.getElementById('metricCompletedCount');
    const metricCompletionRatio = document.getElementById('metricCompletionRatio');
    const metricProgressBar = document.getElementById('metricProgressBar');

    let pendingList = [];
    let completedList = [];
    let overdueCount = 0;
    let dueTodayCount = 0;
    const todayStr = getTodayDateString();

    state.tasks.forEach(task => {
      // 1. Search filter
      if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        const matchTitle = task.title.toLowerCase().includes(q);
        const matchDesc = task.description && task.description.toLowerCase().includes(q);
        const matchSub = task.subtasks && task.subtasks.some(st => st.title.toLowerCase().includes(q));
        if (!matchTitle && !matchDesc && !matchSub) return;
      }

      // 2. Category filter
      if (state.filterCategory !== 'ALL' && task.category !== state.filterCategory) {
        return;
      }

      // 3. Tab filter
      if (task.isDaily) {
        const isDoneToday = Array.isArray(task.completedDates) && task.completedDates.includes(state.selectedDate);
        const urgency = calculateTaskUrgency(task, state.selectedDate, task.dailyTime);

        const item = {
          task,
          scheduleId: null,
          targetDate: state.selectedDate,
          targetTime: task.dailyTime || '',
          isCompleted: isDoneToday,
          urgency
        };

        if (isDoneToday) {
          completedList.push(item);
        } else {
          pendingList.push(item);
          if (urgency.urgencyLevel === 'overdue') overdueCount++;
          if (item.targetDate === todayStr) dueTodayCount++;
        }
      } else if (task.schedules && task.schedules.length > 0) {
        if (state.activeTab === 'daily') return;

        task.schedules.forEach(sch => {
          if (state.activeTab === 'today' && sch.date !== todayStr) return;

          const urgency = calculateTaskUrgency(task, sch.date, sch.time);
          const item = {
            task,
            scheduleId: sch.id,
            targetDate: sch.date,
            targetTime: sch.time || '',
            isCompleted: !!sch.completed,
            urgency
          };

          if (sch.completed) {
            completedList.push(item);
          } else {
            pendingList.push(item);
            if (urgency.urgencyLevel === 'overdue') overdueCount++;
            if (sch.date === todayStr) dueTodayCount++;
          }
        });
      } else {
        if (state.activeTab === 'daily') return;
        if (state.activeTab === 'today' && task.dueDate !== todayStr) return;

        const urgency = calculateTaskUrgency(task, task.dueDate, task.dueTime);
        const item = {
          task,
          scheduleId: null,
          targetDate: task.dueDate || todayStr,
          targetTime: task.dueTime || '',
          isCompleted: !!task.completed,
          urgency
        };

        if (task.completed) {
          completedList.push(item);
        } else {
          pendingList.push(item);
          if (urgency.urgencyLevel === 'overdue') overdueCount++;
          if (item.targetDate === todayStr) dueTodayCount++;
        }
      }
    });

    // 4. SORT STRICTLY BY DYNAMIC URGENCY
    pendingList.sort((a, b) => b.urgency.urgencyScore - a.urgency.urgencyScore);

    // Update KPI Metrics
    const totalCount = pendingList.length + completedList.length;
    const completedCount = completedList.length;
    const percent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

    if (metricOverdue) metricOverdue.textContent = overdueCount;
    if (metricDueToday) metricDueToday.textContent = dueTodayCount;
    if (metricTotalPending) metricTotalPending.textContent = pendingList.length;
    if (metricCompleted) metricCompleted.textContent = completedCount;
    if (metricCompletionRatio) metricCompletionRatio.textContent = `${percent}%`;
    if (metricProgressBar) metricProgressBar.style.width = `${percent}%`;

    if (badgePending) badgePending.textContent = pendingList.length;
    if (badgeCompleted) badgeCompleted.textContent = completedList.length;

    if (clearCompletedBtn) {
      clearCompletedBtn.classList.toggle('hidden', completedList.length === 0);
    }

    // Render Cards
    pendingContainer.innerHTML = '';
    if (pendingList.length === 0) {
      emptyPending.classList.remove('hidden');
    } else {
      emptyPending.classList.add('hidden');
      pendingList.forEach(item => {
        pendingContainer.appendChild(createTaskCard(item, false));
      });
    }

    completedContainer.innerHTML = '';
    if (completedList.length === 0) {
      emptyCompleted.classList.remove('hidden');
    } else {
      emptyCompleted.classList.add('hidden');
      completedList.forEach(item => {
        completedContainer.appendChild(createTaskCard(item, true));
      });
    }

    completedContainer.classList.toggle('hidden', state.completedSectionCollapsed);
    const chevron = document.getElementById('iconCompletedChevron');
    if (chevron) {
      chevron.style.transform = state.completedSectionCollapsed ? 'rotate(0deg)' : 'rotate(90deg)';
    }
  }

  function createTaskCard(item, isCompleted) {
    const { task, scheduleId, targetDate, targetTime, urgency } = item;
    const card = document.createElement('div');

    card.className = `task-card bg-white dark:bg-[#131c31] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-sm transition-all ${
      isCompleted ? 'opacity-70 bg-slate-50/50 dark:bg-slate-900/40' : urgency.borderClass
    }`;

    const categoryIcons = {
      Work: '💼',
      Personal: '🏡',
      Finance: '💰',
      Health: '💪',
      Study: '📚',
      Routine: '🔁',
      General: '✨'
    };

    const subtasks = task.subtasks || [];
    const totalSub = subtasks.length;
    const doneSub = subtasks.filter(s => s.done).length;
    const subPercent = totalSub === 0 ? 0 : Math.round((doneSub / totalSub) * 100);
    const streak = task.isDaily ? calculateStreak(task) : 0;
    const isMultiSchedule = !task.isDaily && task.schedules && task.schedules.length > 1;

    const badgeColor = {
      overdue: 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border-rose-200 dark:border-rose-900 pulse-overdue',
      critical: 'bg-orange-100 text-orange-700 dark:bg-orange-950/80 dark:text-orange-300 border-orange-200 dark:border-orange-900',
      high: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      normal: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    }[urgency.urgencyLevel];

    card.innerHTML = `
      <div class="flex items-start gap-3.5">
        <div class="pt-0.5">
          <input type="checkbox" ${isCompleted ? 'checked' : ''} 
            title="${isCompleted ? 'Mark as pending' : 'Click to tick as done and move to completed'}" 
            class="task-checkbox card-main-checkbox">
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex flex-wrap items-center gap-1.5">
              ${!isCompleted ? `
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}">
                  ${urgency.urgencyBadgeText}
                </span>
              ` : `
                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  ✓ Done
                </span>
              `}

              <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                ${categoryIcons[task.category] || '✨'} ${task.category || 'General'}
              </span>

              ${task.isDaily ? `
                <span title="Repeats every day" class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                  🔁 Daily Routine
                </span>
                ${streak > 0 ? `<span title="${streak} day streak" class="text-[11px] font-extrabold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300">🔥 ${streak}d</span>` : ''}
              ` : ''}

              ${isMultiSchedule ? `
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  📅 ${task.schedules.length} dates scheduled
                </span>
              ` : ''}

              ${targetTime || targetDate ? `
                <span class="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <span>⏰</span>
                  <span>${formatDateFriendly(targetDate)} ${targetTime ? '@ ' + formatTime(targetTime) : ''}</span>
                </span>
              ` : ''}
            </div>

            <div class="flex items-center gap-1">
              <button title="Edit Task" class="btn-card-edit p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
              </button>
              <button title="Delete Task" class="btn-card-delete p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
              </button>
            </div>
          </div>

          <h3 class="font-bold text-base mt-2 text-slate-900 dark:text-white leading-snug ${isCompleted ? 'completed-title' : ''}">
            ${escapeHtml(task.title)}
          </h3>

          ${task.description ? `
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed ${isCompleted ? 'line-through opacity-70' : ''}">
              ${escapeHtml(task.description)}
            </p>
          ` : ''}

          <div class="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div class="flex items-center justify-between text-xs cursor-pointer trigger-subtask-toggle select-none">
              <div class="flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
                <svg class="w-3.5 h-3.5 text-slate-400 transition-transform transform subtask-chevron ${totalSub > 0 ? 'rotate-90' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                <span>Subtasks (${doneSub}/${totalSub})</span>
              </div>

              ${totalSub > 0 ? `
                <div class="flex items-center gap-2">
                  <div class="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500 rounded-full transition-all duration-300" style="width: ${subPercent}%"></div>
                  </div>
                  <span class="text-[11px] font-bold text-slate-500 dark:text-slate-400">${subPercent}%</span>
                </div>
              ` : `
                <span class="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline">+ Add step</span>
              `}
            </div>

            <div class="subtask-body mt-2.5 space-y-2 ${totalSub === 0 ? 'hidden' : ''}">
              <div class="space-y-1.5">
                ${subtasks.map(st => `
                  <div class="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 group/item text-xs">
                    <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                      <input type="checkbox" data-subtask-id="${st.id}" ${st.done ? 'checked' : ''} class="subtask-checkbox w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600 cursor-pointer">
                      <span class="${st.done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'} break-words">
                        ${escapeHtml(st.title)}
                      </span>
                    </label>
                    <button data-subtask-id="${st.id}" title="Remove subtask" class="btn-remove-subtask opacity-0 group-hover/item:opacity-100 text-slate-400 hover:text-rose-500 p-1 transition">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                `).join('')}
              </div>

              <div class="flex items-center gap-1.5 pt-1">
                <input type="text" placeholder="Add next subtask step..." class="inline-subtask-text flex-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                <button class="btn-inline-add-subtask px-3 py-1.5 text-xs font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition">
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    card.querySelector('.card-main-checkbox').addEventListener('change', (e) => {
      handleToggleTask(task.id, scheduleId, targetDate, e.target.checked, e);
    });

    const triggerToggle = card.querySelector('.trigger-subtask-toggle');
    const subBody = card.querySelector('.subtask-body');
    const chevron = card.querySelector('.subtask-chevron');
    triggerToggle.addEventListener('click', (e) => {
      if (e.target.closest('input') || e.target.closest('button')) return;
      const isHidden = subBody.classList.toggle('hidden');
      if (chevron) {
        chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(90deg)';
      }
    });

    card.querySelectorAll('.subtask-checkbox').forEach(box => {
      box.addEventListener('change', (e) => {
        handleToggleSubtask(task.id, e.target.dataset.subtaskId, e.target.checked);
      });
    });

    card.querySelectorAll('.btn-remove-subtask').forEach(btn => {
      btn.addEventListener('click', () => {
        handleDeleteSubtask(task.id, btn.dataset.subtaskId);
      });
    });

    const inlineInput = card.querySelector('.inline-subtask-text');
    const inlineBtn = card.querySelector('.btn-inline-add-subtask');
    const submitSubtask = () => {
      const val = inlineInput.value.trim();
      if (!val) return;
      handleInlineAddSubtask(task.id, val);
      inlineInput.value = '';
    };

    inlineBtn.addEventListener('click', submitSubtask);
    inlineInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitSubtask();
      }
    });

    card.querySelector('.btn-card-edit').addEventListener('click', () => {
      openTaskModal(task);
    });

    card.querySelector('.btn-card-delete').addEventListener('click', () => {
      if (confirm(`Delete task "${task.title}"?`)) {
        handleDeleteTask(task.id);
      }
    });

    return card;
  }

  function handleToggleTask(taskId, scheduleId, targetDate, isDone, event) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (isDone) {
      soundSynth.playComplete();
      const rect = event?.target?.getBoundingClientRect();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      particleCelebration.burst(x, y);
      showToast(`Completed "${task.title}"! 🎉`, 'success');
    } else {
      soundSynth.playUncheck();
      showToast(`Moved "${task.title}" back to Pending.`, 'info');
    }

    if (task.isDaily) {
      if (!Array.isArray(task.completedDates)) task.completedDates = [];
      if (isDone) {
        if (!task.completedDates.includes(targetDate)) task.completedDates.push(targetDate);
      } else {
        task.completedDates = task.completedDates.filter(d => d !== targetDate);
      }
    } else if (scheduleId && task.schedules) {
      const sch = task.schedules.find(s => s.id === scheduleId);
      if (sch) {
        sch.completed = isDone;
        sch.completedAt = isDone ? new Date().toISOString() : null;
      }
    } else {
      task.completed = isDone;
      task.completedAt = isDone ? new Date().toISOString() : null;
    }

    saveData();
    renderAll();
  }

  function handleToggleSubtask(taskId, subId, isDone) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    const st = task.subtasks.find(s => s.id === subId);
    if (st) {
      st.done = isDone;
      if (isDone) soundSynth.playSubtask();
      saveData();
      renderAll();
    }
  }

  function handleDeleteSubtask(taskId, subId) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task || !task.subtasks) return;
    task.subtasks = task.subtasks.filter(s => s.id !== subId);
    saveData();
    renderAll();
  }

  function handleInlineAddSubtask(taskId, title) {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.subtasks) task.subtasks = [];
    task.subtasks.push({
      id: 'sub_' + Date.now() + Math.random().toString(36).substring(2, 6),
      title: title,
      done: false
    });
    saveData();
    renderAll();
    showToast(`Added subtask to "${task.title}"`, 'info');
  }

  function handleDeleteTask(taskId) {
    state.tasks = state.tasks.filter(t => t.id !== taskId);
    saveData();
    renderAll();
    showToast('Task removed.', 'info');
  }

  // --- PAGE 2: HOW TO IMPROVE TASKFLOW (SIMPLE SUGGESTION BAR) ---
  function handleSubmitSuggestionSimple() {
    const suggestionInput = document.getElementById('inputUserSuggestion');
    const formCard = document.getElementById('cardSuggestionForm');
    const thankYouCard = document.getElementById('cardSuggestionThankYou');

    const suggestion = suggestionInput ? suggestionInput.value.trim() : '';
    if (!suggestion) {
      showToast('Please write your ideas or suggestions before sending.', 'warning');
      suggestionInput?.focus();
      return;
    }

    // Save suggestion locally
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_SUGGESTIONS_KEY) || '[]');
      stored.unshift({
        suggestion,
        user: state.currentUser ? state.currentUser.email : 'Guest',
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_SUGGESTIONS_KEY, JSON.stringify(stored));
    } catch (e) {
      console.warn('Could not save suggestion', e);
    }

    // Show only "Thank you for the suggestion"
    formCard?.classList.add('hidden');
    thankYouCard?.classList.remove('hidden');
    if (suggestionInput) suggestionInput.value = '';

    soundSynth.playComplete();
    showToast('Thank you for the suggestion!', 'success');
  }

  function handleWriteAnotherSuggestion() {
    const formCard = document.getElementById('cardSuggestionForm');
    const thankYouCard = document.getElementById('cardSuggestionThankYou');
    const suggestionInput = document.getElementById('inputUserSuggestion');

    thankYouCard?.classList.add('hidden');
    formCard?.classList.remove('hidden');
    suggestionInput?.focus();
  }

  // --- PAGE 3: SUPPORT & HELP (WHAT IS YOUR PROBLEM?) ---
  function handleSendSupportProblem() {
    const problemInput = document.getElementById('textareaSupportProblem');
    const senderEmailInput = document.getElementById('inputSenderEmail');
    const banner = document.getElementById('supportSuccessBanner');

    const problem = problemInput ? problemInput.value.trim() : '';
    if (!problem) {
      showToast('Please describe what problem you are facing before sending.', 'warning');
      problemInput?.focus();
      return;
    }

    const senderEmail = senderEmailInput?.value.trim() || (state.currentUser ? state.currentUser.email : 'Not provided');
    const targetEmail = 'harshjhahjh2008@gmail.com';
    const subject = encodeURIComponent('TaskFlow Problem Report');
    const body = encodeURIComponent(
      `TaskFlow Problem Report\n` +
      `=========================================\n\n` +
      `What is your problem?\n${problem}\n\n` +
      `=========================================\n` +
      `Sender Contact: ${senderEmail}\n` +
      `Timestamp: ${new Date().toLocaleString()}\n` +
      `Platform: TaskFlow Executive Productivity\n`
    );

    const mailtoUrl = `mailto:${targetEmail}?subject=${subject}&body=${body}`;

    // Record problem locally as backup
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_PROBLEMS_KEY) || '[]');
      stored.unshift({
        problem,
        senderEmail,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem(STORAGE_PROBLEMS_KEY, JSON.stringify(stored));
    } catch (e) {
      console.warn('Could not save problem record', e);
    }

    // Launch email client to send directly to harshjhahjh2008@gmail.com
    window.location.href = mailtoUrl;

    // Show confirmation banner
    if (banner) banner.classList.remove('hidden');
    if (problemInput) problemInput.value = '';

    soundSynth.playComplete();
    showToast('Opening your email client to send to harshjhahjh2008@gmail.com...', 'success');
  }

  // --- MODAL: TASK CREATION & EDITING ---
  function openTaskModal(taskToEdit = null) {
    if (!state.currentUser) {
      showToast('Please create an account or log in first to manage tasks.', 'warning');
      openLoginModal();
      return;
    }

    const modal = document.getElementById('taskModal');
    const heading = document.getElementById('modalHeading');
    const taskIdField = document.getElementById('modalTaskId');
    const titleField = document.getElementById('modalTitleInput');
    const descField = document.getElementById('modalDescInput');
    const catField = document.getElementById('modalCategorySelect');
    const prioField = document.getElementById('modalPrioritySelect');
    const dailyCheck = document.getElementById('modalDailyCheckbox');
    const dailyTimeSection = document.getElementById('modalDailyTimeSection');
    const dailyTimeInput = document.getElementById('modalDailyTimeInput');

    state.editingTaskId = taskToEdit ? taskToEdit.id : null;
    taskIdField.value = state.editingTaskId || '';

    if (taskToEdit) {
      heading.textContent = 'Edit Task';
      titleField.value = taskToEdit.title || '';
      descField.value = taskToEdit.description || '';
      catField.value = taskToEdit.category || 'Work';
      prioField.value = taskToEdit.priority || 'medium';
      dailyCheck.checked = !!taskToEdit.isDaily;
      dailyTimeInput.value = taskToEdit.dailyTime || '';
      dailyTimeSection.classList.toggle('hidden', !taskToEdit.isDaily);

      state.modalSubtasks = (taskToEdit.subtasks || []).map(s => ({ ...s }));

      if (taskToEdit.schedules && taskToEdit.schedules.length > 0) {
        state.modalSchedules = taskToEdit.schedules.map(sch => ({ ...sch }));
      } else {
        state.modalSchedules = [
          {
            id: 'sch_' + Date.now(),
            date: taskToEdit.dueDate || state.selectedDate,
            time: taskToEdit.dueTime || '10:00',
            completed: false
          }
        ];
      }
    } else {
      heading.textContent = 'Create New Task';
      document.getElementById('taskModalForm').reset();
      taskIdField.value = '';
      dailyCheck.checked = false;
      dailyTimeSection.classList.add('hidden');
      state.modalSubtasks = [];
      state.modalSchedules = [
        {
          id: 'sch_' + Date.now(),
          date: state.selectedDate || getTodayDateString(),
          time: '10:00',
          completed: false
        }
      ];
    }

    renderModalSubtasks();
    renderModalSchedules();
    modal.classList.remove('hidden');
    titleField.focus();
  }

  function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
    state.editingTaskId = null;
    state.modalSubtasks = [];
    state.modalSchedules = [];
  }

  function renderModalSubtasks() {
    const list = document.getElementById('modalSubtaskList');
    const countLabel = document.getElementById('modalSubtasksCountLabel');
    if (!list) return;

    countLabel.textContent = `${state.modalSubtasks.length} subtasks`;
    list.innerHTML = '';

    if (state.modalSubtasks.length === 0) {
      list.innerHTML = '<p class="text-[11px] text-slate-400 py-1">No subtasks added yet.</p>';
      return;
    }

    state.modalSubtasks.forEach((st, idx) => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs';
      row.innerHTML = `
        <span class="flex-1 text-slate-700 dark:text-slate-300 break-words font-medium">${escapeHtml(st.title)}</span>
        <button type="button" class="text-slate-400 hover:text-rose-500 p-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        state.modalSubtasks.splice(idx, 1);
        renderModalSubtasks();
      });
      list.appendChild(row);
    });
  }

  function renderModalSchedules() {
    const container = document.getElementById('modalScheduleList');
    const section = document.getElementById('modalScheduleSection');
    const isDaily = document.getElementById('modalDailyCheckbox').checked;

    if (isDaily) {
      section.classList.add('hidden');
      return;
    } else {
      section.classList.remove('hidden');
    }

    container.innerHTML = '';

    state.modalSchedules.forEach((sch, index) => {
      const row = document.createElement('div');
      row.className = 'flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs';
      row.innerHTML = `
        <div class="flex-1">
          <label class="block text-[10px] font-bold text-slate-400 mb-0.5">Date</label>
          <input type="date" value="${sch.date}" class="modal-sch-date w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium">
        </div>
        <div class="w-32">
          <label class="block text-[10px] font-bold text-slate-400 mb-0.5">Custom Time</label>
          <input type="time" value="${sch.time || ''}" class="modal-sch-time w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 font-medium">
        </div>
        ${state.modalSchedules.length > 1 ? `
          <button type="button" title="Remove this date" class="modal-sch-remove self-end mb-1 p-1 text-slate-400 hover:text-rose-500">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
          </button>
        ` : ''}
      `;

      row.querySelector('.modal-sch-date').addEventListener('change', (e) => {
        sch.date = e.target.value;
      });
      row.querySelector('.modal-sch-time').addEventListener('change', (e) => {
        sch.time = e.target.value;
      });

      const removeBtn = row.querySelector('.modal-sch-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          state.modalSchedules.splice(index, 1);
          renderModalSchedules();
        });
      }

      container.appendChild(row);
    });
  }

  function handleSaveTask(e) {
    e.preventDefault();

    const title = document.getElementById('modalTitleInput').value.trim();
    if (!title) return;

    const description = document.getElementById('modalDescInput').value.trim();
    const category = document.getElementById('modalCategorySelect').value;
    const priority = document.getElementById('modalPrioritySelect').value;
    const isDaily = document.getElementById('modalDailyCheckbox').checked;
    const dailyTime = document.getElementById('modalDailyTimeInput').value || '';

    let schedules = [];
    let primaryDueDate = state.selectedDate || getTodayDateString();
    let primaryDueTime = '';

    if (!isDaily) {
      schedules = state.modalSchedules.map(sch => ({
        id: sch.id || 'sch_' + Date.now() + Math.random().toString(36).substring(2, 6),
        date: sch.date || state.selectedDate || getTodayDateString(),
        time: sch.time || '',
        completed: !!sch.completed,
        completedAt: sch.completedAt || null
      }));

      if (schedules.length === 0) {
        schedules = [
          {
            id: 'sch_' + Date.now(),
            date: state.selectedDate || getTodayDateString(),
            time: '10:00',
            completed: false,
            completedAt: null
          }
        ];
      }

      primaryDueDate = schedules[0].date;
      primaryDueTime = schedules[0].time;
    } else {
      primaryDueTime = dailyTime;
    }

    if (state.editingTaskId) {
      const idx = state.tasks.findIndex(t => t.id === state.editingTaskId);
      if (idx !== -1) {
        state.tasks[idx] = {
          ...state.tasks[idx],
          title,
          description,
          category,
          priority,
          isDaily,
          dailyTime,
          dueDate: primaryDueDate,
          dueTime: primaryDueTime,
          schedules,
          subtasks: state.modalSubtasks
        };
        showToast(`Updated "${title}"`, 'success');
      }
    } else {
      const newTask = {
        id: 'task_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        title,
        description,
        category,
        priority,
        isDaily,
        dailyTime,
        dueDate: primaryDueDate,
        dueTime: primaryDueTime,
        completedDates: [],
        schedules,
        subtasks: state.modalSubtasks,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString()
      };
      state.tasks.unshift(newTask);
      showToast(`Created "${title}"`, 'success');
    }

    saveData();
    closeTaskModal();
    renderAll();
  }

  // --- AUTHENTICATION ENGINE (GATE & MODAL UNIFIED) ---
  let authMode = 'signup'; // 'signup' | 'signin'

  function setGateAuthMode(mode) {
    const tabSignUp = document.getElementById('gateTabBtnSignUp');
    const tabSignIn = document.getElementById('gateTabBtnSignIn');
    const formSignUp = document.getElementById('gateFormSignUp');
    const formSignIn = document.getElementById('gateFormSignIn');

    if (mode === 'signin') {
      tabSignIn?.classList.add('bg-white', 'dark:bg-slate-800', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignIn?.classList.remove('text-slate-600', 'dark:text-slate-400');
      tabSignUp?.classList.remove('bg-white', 'dark:bg-slate-800', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignUp?.classList.add('text-slate-600', 'dark:text-slate-400');

      formSignIn?.classList.remove('hidden');
      formSignUp?.classList.add('hidden');
    } else {
      tabSignUp?.classList.add('bg-white', 'dark:bg-slate-800', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignUp?.classList.remove('text-slate-600', 'dark:text-slate-400');
      tabSignIn?.classList.remove('bg-white', 'dark:bg-slate-800', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignIn?.classList.add('text-slate-600', 'dark:text-slate-400');

      formSignUp?.classList.remove('hidden');
      formSignIn?.classList.add('hidden');
    }
  }

  function setAuthMode(mode) {
    authMode = mode;
    const tabSignIn = document.getElementById('tabBtnSignIn');
    const tabSignUp = document.getElementById('tabBtnSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');

    if (mode === 'signup') {
      tabSignUp?.classList.add('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignUp?.classList.remove('text-slate-600', 'dark:text-slate-400');
      tabSignIn?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignIn?.classList.add('text-slate-600', 'dark:text-slate-400');

      formSignUp?.classList.remove('hidden');
      formSignIn?.classList.add('hidden');
    } else {
      tabSignIn?.classList.add('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignIn?.classList.remove('text-slate-600', 'dark:text-slate-400');
      tabSignUp?.classList.remove('bg-white', 'dark:bg-slate-900', 'text-blue-600', 'dark:text-blue-400', 'shadow-sm');
      tabSignUp?.classList.add('text-slate-600', 'dark:text-slate-400');

      formSignIn?.classList.remove('hidden');
      formSignUp?.classList.add('hidden');
    }
  }

  function openLoginModal() {
    const modal = document.getElementById('loginModal');
    const tabsContainer = document.getElementById('authTabsContainer');
    const formSection = document.getElementById('authFormSection');
    const loggedInSection = document.getElementById('authLoggedInSection');
    const heading = document.getElementById('authModalHeading');
    const subheading = document.getElementById('authModalSubheading');

    if (state.currentUser && state.currentUser.email) {
      // User is logged in -> show account info card
      tabsContainer?.classList.add('hidden');
      formSection?.classList.add('hidden');
      loggedInSection?.classList.remove('hidden');

      if (heading) heading.textContent = 'My Account';
      if (subheading) subheading.textContent = 'Manage your session or sign out';

      const avatar = document.getElementById('activeProfileAvatar');
      const emailText = document.getElementById('activeProfileEmail');
      if (avatar) avatar.textContent = state.currentUser.email.charAt(0).toUpperCase();
      if (emailText) emailText.textContent = state.currentUser.email;
    } else {
      // User is not logged in -> show tabs & form
      tabsContainer?.classList.remove('hidden');
      formSection?.classList.remove('hidden');
      loggedInSection?.classList.add('hidden');

      if (heading) heading.textContent = 'Account Access';
      if (subheading) subheading.textContent = 'Sign in or create an account with your email and password';

      setAuthMode('signup');
    }

    modal?.classList.remove('hidden');
  }

  function closeLoginModal() {
    document.getElementById('loginModal')?.classList.add('hidden');
  }

  function executeSignUp(email, password, confirmPassword, rememberMe = false) {
    if (!email || !password || !confirmPassword) {
      showToast('Please fill in all registration fields.', 'warning');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast('Please enter a valid email address.', 'warning');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'warning');
      return;
    }

    if (password !== confirmPassword) {
      showToast('Passwords do not match. Please verify.', 'warning');
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const existing = state.accounts.find(a => a.email.toLowerCase() === normalizedEmail);
    if (existing) {
      showToast('An account with this email already exists. Please log in.', 'warning');
      setGateAuthMode('signin');
      setAuthMode('signin');
      const gateLoginEmail = document.getElementById('gateInputLoginEmail');
      if (gateLoginEmail) gateLoginEmail.value = normalizedEmail;
      const modalLoginEmail = document.getElementById('inputLoginEmail');
      if (modalLoginEmail) modalLoginEmail.value = normalizedEmail;
      return;
    }

    const newAccount = {
      email: normalizedEmail,
      password,
      createdAt: new Date().toISOString()
    };

    state.accounts.push(newAccount);
    state.currentUser = { email: newAccount.email, createdAt: newAccount.createdAt };

    // Remember Me session handling
    if (rememberMe) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.currentUser));
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
    } else {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.currentUser));
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }

    // Load tasks for this new user (empty initial task list)
    const userEmailKey = 'taskflow_tasks_' + normalizedEmail;
    const existingTasks = localStorage.getItem(userEmailKey);
    state.tasks = existingTasks ? JSON.parse(existingTasks) : [];

    saveData();
    closeLoginModal();
    updateAuthUI();
    renderAll();
    particleCelebration.trigger();
    soundSynth.playComplete();
    showToast(`Account created! Welcome, ${normalizedEmail}`, 'success');
  }

  function executeSignIn(email, password, rememberMe = false) {
    if (!email || !password) {
      showToast('Please enter both email and password.', 'warning');
      return;
    }

    const normalizedEmail = email.toLowerCase();
    const account = state.accounts.find(a => a.email.toLowerCase() === normalizedEmail);
    if (!account) {
      showToast('No account found with this email. Please create an account first.', 'warning');
      setGateAuthMode('signup');
      setAuthMode('signup');
      return;
    }

    if (account.password !== password) {
      showToast('Incorrect password. Please try again.', 'warning');
      return;
    }

    state.currentUser = { email: account.email, createdAt: account.createdAt };

    // Remember Me session handling
    if (rememberMe) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.currentUser));
      sessionStorage.removeItem(STORAGE_SESSION_KEY);
    } else {
      sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(state.currentUser));
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }

    // Load this specific user's tasks
    const userEmailKey = 'taskflow_tasks_' + normalizedEmail;
    const existingTasks = localStorage.getItem(userEmailKey);
    state.tasks = existingTasks ? JSON.parse(existingTasks) : [];

    saveData();
    closeLoginModal();
    updateAuthUI();
    renderAll();
    soundSynth.playComplete();
    showToast(`Welcome back, ${account.email}!` + (rememberMe ? ' (Remembered)' : ''), 'success');
  }

  function executeSignOut() {
    state.currentUser = null;
    state.tasks = [];
    localStorage.removeItem(STORAGE_SESSION_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    saveData();
    closeLoginModal();
    updateAuthUI();
    renderAll();
    showToast('Signed out successfully. Please log in to manage tasks.', 'info');
  }

  // --- Event Listeners Setup ---
  function setupEvents() {
    // 1. Live Clock & Dynamic Urgency Refresh
    setInterval(() => {
      updateLiveClock();
      if (state.currentPage === 'tasks') {
        renderAll();
      }
    }, 15000);

    // 2. SPA Navigation Buttons
    document.getElementById('navLinkTasks')?.addEventListener('click', () => navigateToPage('tasks'));
    document.getElementById('navLinkImprove')?.addEventListener('click', () => navigateToPage('improve'));
    document.getElementById('navLinkSupport')?.addEventListener('click', () => navigateToPage('support'));
    document.getElementById('navLinkPrivacy')?.addEventListener('click', () => navigateToPage('privacy'));

    document.getElementById('navLogoBtn')?.addEventListener('click', () => navigateToPage('tasks'));
    document.getElementById('navBrandText')?.addEventListener('click', () => navigateToPage('tasks'));
    document.getElementById('btnReturnToTasksFromPrivacy')?.addEventListener('click', () => navigateToPage('tasks'));

    // Mobile nav bar clicks
    document.querySelectorAll('.nav-page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigateToPage(btn.dataset.page);
      });
    });

    // 3. Theme Toggle (Upgraded Dark Mode)
    document.getElementById('btnToggleTheme')?.addEventListener('click', () => {
      state.darkMode = !state.darkMode;
      applyTheme();
      saveData();
      showToast(state.darkMode ? 'Switched to Obsidian Dark Mode 🌙' : 'Switched to Light Mode ☀️', 'info');
    });

    // 4. Sound Toggle
    document.getElementById('btnToggleSound')?.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      applyTheme();
      saveData();
      if (state.soundEnabled) {
        soundSynth.playComplete();
        showToast('Sound feedback enabled', 'info');
      } else {
        showToast('Sound muted', 'info');
      }
    });

    // 5. Data Menu Dropdown
    const dataBtn = document.getElementById('btnDataMenu');
    const dataMenu = document.getElementById('dataMenuDropdown');
    dataBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      dataMenu?.classList.toggle('hidden');
    });
    window.addEventListener('click', () => {
      dataMenu?.classList.add('hidden');
    });

    // Export JSON
    document.getElementById('btnExportJson')?.addEventListener('click', () => {
      if (!state.currentUser) {
        showToast('Please create an account or log in first to export tasks.', 'warning');
        openLoginModal();
        return;
      }
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state.tasks, null, 2));
      const a = document.createElement('a');
      a.setAttribute('href', dataStr);
      a.setAttribute('download', `taskflow-backup-${getTodayDateString()}.json`);
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Tasks backup downloaded!', 'success');
    });

    // Import JSON
    document.getElementById('inputImportJson')?.addEventListener('change', (e) => {
      if (!state.currentUser) {
        showToast('Please create an account or log in first to import tasks.', 'warning');
        openLoginModal();
        return;
      }
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target.result);
          if (Array.isArray(parsed)) {
            state.tasks = parsed;
            saveData();
            renderAll();
            showToast('Backup restored successfully!', 'success');
          } else {
            showToast('Invalid backup file format.', 'warning');
          }
        } catch (err) {
          showToast('Failed to parse JSON file.', 'warning');
        }
      };
      reader.readAsText(file);
    });

    // Reload Sample Tasks
    document.getElementById('btnLoadSamples')?.addEventListener('click', () => {
      if (!state.currentUser) {
        showToast('Please create an account or log in first.', 'warning');
        openLoginModal();
        return;
      }
      if (confirm('Reload sample tasks?')) {
        state.tasks = [...getSampleTasks(), ...state.tasks];
        saveData();
        renderAll();
        showToast('Sample tasks loaded!', 'success');
      }
    });

    // Delete All Tasks
    document.getElementById('btnClearAll')?.addEventListener('click', () => {
      if (!state.currentUser) {
        showToast('Please create an account or log in first.', 'warning');
        openLoginModal();
        return;
      }
      if (confirm('Delete ALL tasks?')) {
        state.tasks = [];
        saveData();
        renderAll();
        showToast('All tasks cleared.', 'info');
      }
    });

    // 6. On-Page Auth Gate (Welcome Screen) Events
    document.getElementById('gateTabBtnSignUp')?.addEventListener('click', () => setGateAuthMode('signup'));
    document.getElementById('gateTabBtnSignIn')?.addEventListener('click', () => setGateAuthMode('signin'));
    document.getElementById('gateLinkSwitchToSignIn')?.addEventListener('click', () => setGateAuthMode('signin'));
    document.getElementById('gateLinkSwitchToSignUp')?.addEventListener('click', () => setGateAuthMode('signup'));

    document.getElementById('gateFormSignUp')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('gateInputRegisterEmail')?.value.trim();
      const password = document.getElementById('gateInputRegisterPassword')?.value;
      const confirmPassword = document.getElementById('gateInputRegisterConfirmPassword')?.value;
      const remember = !!document.getElementById('gateRememberMeSignUp')?.checked;
      executeSignUp(email, password, confirmPassword, remember);
    });

    document.getElementById('gateFormSignIn')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('gateInputLoginEmail')?.value.trim();
      const password = document.getElementById('gateInputLoginPassword')?.value;
      const remember = !!document.getElementById('gateRememberMeSignIn')?.checked;
      executeSignIn(email, password, remember);
    });

    // Modal Authentication Events
    document.getElementById('btnUserProfile')?.addEventListener('click', openLoginModal);
    document.getElementById('btnCloseLoginModal')?.addEventListener('click', closeLoginModal);
    document.getElementById('tabBtnSignIn')?.addEventListener('click', () => setAuthMode('signin'));
    document.getElementById('tabBtnSignUp')?.addEventListener('click', () => setAuthMode('signup'));
    document.getElementById('linkSwitchToSignUp')?.addEventListener('click', () => setAuthMode('signup'));
    document.getElementById('linkSwitchToSignIn')?.addEventListener('click', () => setAuthMode('signin'));

    document.getElementById('formSignIn')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('inputLoginEmail')?.value.trim();
      const password = document.getElementById('inputLoginPassword')?.value;
      const remember = !!document.getElementById('modalRememberMeSignIn')?.checked;
      executeSignIn(email, password, remember);
    });

    document.getElementById('formSignUp')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('inputRegisterEmail')?.value.trim();
      const password = document.getElementById('inputRegisterPassword')?.value;
      const confirmPassword = document.getElementById('inputRegisterConfirmPassword')?.value;
      const remember = !!document.getElementById('modalRememberMeSignUp')?.checked;
      executeSignUp(email, password, confirmPassword, remember);
    });

    document.getElementById('btnLogoutSession')?.addEventListener('click', executeSignOut);

    // 7. Task View Tabs
    document.getElementById('tabUrgency')?.addEventListener('click', () => {
      state.activeTab = 'urgency';
      renderAll();
    });
    document.getElementById('tabToday')?.addEventListener('click', () => {
      state.activeTab = 'today';
      state.selectedDate = getTodayDateString();
      renderAll();
    });
    document.getElementById('tabDailyRoutines')?.addEventListener('click', () => {
      state.activeTab = 'daily';
      renderAll();
    });
    document.getElementById('tabAllTasks')?.addEventListener('click', () => {
      state.activeTab = 'all';
      renderAll();
    });

    // 8. Search & Filters
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.trim();
      renderAll();
    });

    document.getElementById('filterCategory')?.addEventListener('change', (e) => {
      state.filterCategory = e.target.value;
      renderAll();
    });

    // 9. Task Modal Triggers (Protected)
    document.getElementById('btnOpenNewTaskModal')?.addEventListener('click', () => {
      if (!state.currentUser) {
        showToast('Please create an account or log in first to create tasks.', 'warning');
        if (state.currentPage !== 'tasks') {
          navigateToPage('tasks');
        }
        setGateAuthMode('signup');
        document.getElementById('gateInputRegisterEmail')?.focus();
        return;
      }
      openTaskModal();
    });

    document.getElementById('btnQuickCreateTaskBanner')?.addEventListener('click', () => {
      if (!state.currentUser) {
        showToast('Please create an account or log in first to create tasks.', 'warning');
        openLoginModal();
        return;
      }
      openTaskModal();
    });
    document.getElementById('btnCloseModal')?.addEventListener('click', closeTaskModal);
    document.getElementById('btnCancelModal')?.addEventListener('click', closeTaskModal);
    document.getElementById('taskModalForm')?.addEventListener('submit', handleSaveTask);

    document.getElementById('modalDailyCheckbox')?.addEventListener('change', (e) => {
      document.getElementById('modalDailyTimeSection')?.classList.toggle('hidden', !e.target.checked);
      renderModalSchedules();
    });

    document.getElementById('btnAddScheduleRow')?.addEventListener('click', () => {
      state.modalSchedules.push({
        id: 'sch_' + Date.now() + Math.random().toString(36).substring(2, 6),
        date: getOffsetDateString(state.modalSchedules.length),
        time: '14:00',
        completed: false
      });
      renderModalSchedules();
    });

    // Subtasks add
    const subInput = document.getElementById('modalAddSubtaskInput');
    const subAddBtn = document.getElementById('modalBtnAddSubtask');
    const addSubtaskStep = () => {
      const val = subInput.value.trim();
      if (!val) return;
      state.modalSubtasks.push({
        id: 'sub_' + Date.now() + Math.random().toString(36).substring(2, 6),
        title: val,
        done: false
      });
      subInput.value = '';
      renderModalSubtasks();
    };

    subAddBtn?.addEventListener('click', addSubtaskStep);
    subInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addSubtaskStep();
      }
    });

    // 10. Completed Section
    document.getElementById('btnToggleCompletedSection')?.addEventListener('click', () => {
      state.completedSectionCollapsed = !state.completedSectionCollapsed;
      renderAll();
    });

    document.getElementById('btnClearCompleted')?.addEventListener('click', () => {
      if (confirm('Clear completed tasks?')) {
        state.tasks = state.tasks.filter(t => {
          if (t.isDaily && Array.isArray(t.completedDates)) {
            t.completedDates = t.completedDates.filter(d => d !== state.selectedDate);
            return true;
          }
          if (t.schedules && t.schedules.length > 0) {
            t.schedules = t.schedules.filter(s => !s.completed);
            return t.schedules.length > 0;
          }
          return !t.completed;
        });
        saveData();
        renderAll();
        showToast('Completed tasks cleared.', 'info');
      }
    });

    // 11. Simple Suggestion Bar (Improve TaskFlow)
    document.getElementById('btnSubmitSuggestionSimple')?.addEventListener('click', handleSubmitSuggestionSimple);
    document.getElementById('btnWriteAnotherSuggestion')?.addEventListener('click', handleWriteAnotherSuggestion);

    // 12. Support & Help (Send Problem to harshjhahjh2008@gmail.com)
    document.getElementById('btnSendSupportProblem')?.addEventListener('click', handleSendSupportProblem);
  }

  // --- Bootstrap Initialization ---
  function init() {
    loadData();
    particleCelebration.init();
    setupEvents();
    applyTheme();
    updateAuthUI();
    navigateToPage('tasks');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
