// ==========================================================
// THE PERFECT DAY — script.js
// mood tracker + quote generator + sticky notes + scroll stuff
// ==========================================================

// -------------------- SMOOTH SCROLL FOR NAV --------------------
document.querySelectorAll('.nav-links a').forEach(link => {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// -------------------- FADE-IN ON SCROLL --------------------
const fadeEls = document.querySelectorAll('.fade-in');

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      fadeObserver.unobserve(entry.target); // only need to do this once
    }
  });
}, { threshold: 0.15 });

fadeEls.forEach(el => fadeObserver.observe(el));


// -------------------- MOOD TRACKER --------------------
const moodButtons = document.querySelectorAll('.mood-btn');
const toast = document.getElementById('toast');
let toastTimer; // holds the setTimeout so we can clear it on rapid clicks

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2400);
}

moodButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // clear previous selection styling
    moodButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    const mood = btn.dataset.mood;
    const todayKey = new Date().toDateString(); // e.g. "Sat Aug 29 2026"

    localStorage.setItem('perfectDayMood_' + todayKey, mood);
    showToast('Mood saved for today! 💕');
  });
});

// on load, check if today's mood was already picked and highlight it
(function restoreMood() {
  const todayKey = new Date().toDateString();
  const savedMood = localStorage.getItem('perfectDayMood_' + todayKey);
  if (savedMood) {
    const match = document.querySelector(`.mood-btn[data-mood="${savedMood}"]`);
    if (match) match.classList.add('selected');
  }
})();


// -------------------- DAILY QUOTE --------------------
const quotes = [
  { text: "Small steps every day still get you there.", author: "unknown" },
  { text: "Your only limit is you.", author: "unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
  { text: "Not all storms come to disrupt your life, some come to clear your path.", author: "unknown" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "Make today so awesome that yesterday gets jealous.", author: "unknown" },
  { text: "You don't have to see the whole staircase, just take the first step.", author: "Martin Luther King Jr." },
  { text: "Slow progress is still progress.", author: "unknown" },
  { text: "Be soft. Do not let the world make you hard.", author: "Kurt Vonnegut" },
  { text: "Today is a good day to try.", author: "unknown" },
  // TODO: add more quotes later, maybe let people submit their own?
];

const quoteText = document.getElementById('quoteText');
const quoteAuthor = document.getElementById('quoteAuthor');
const newQuoteBtn = document.getElementById('newQuoteBtn');

let lastQuoteIndex = -1;

function showRandomQuote() {
  let index = Math.floor(Math.random() * quotes.length);
  // avoid showing the exact same quote twice in a row
  if (index === lastQuoteIndex) {
    index = (index + 1) % quotes.length;
  }
  lastQuoteIndex = index;

  const q = quotes[index];
  quoteText.textContent = `"${q.text}"`;
  quoteAuthor.textContent = q.author === 'unknown' ? '' : `— ${q.author}`;
}

newQuoteBtn.addEventListener('click', showRandomQuote);
showRandomQuote(); // one on page load


// -------------------- STICKY NOTES --------------------
const corkboard = document.getElementById('corkboard');
const addNoteBtn = document.getElementById('addNoteBtn');
const emptyHint = document.getElementById('emptyHint');
const NOTES_KEY = 'perfectDayNotes';

const noteColors = ['note-peach', 'note-lavender', 'note-blue', 'note-mint'];

// let colorCycle = 0; // was going to use this to alternate colors evenly but random looks more fun honestly

function loadNotes() {
  const raw = localStorage.getItem(NOTES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveNotes(notes) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

function toggleEmptyHint(notes) {
  emptyHint.style.display = notes.length === 0 ? 'block' : 'none';
}

// creates the DOM element for one note, given its saved data
function renderNote(note) {
  const el = document.createElement('div');
  el.className = `sticky-note ${note.color}`;
  el.style.left = note.x + 'px';
  el.style.top = note.y + 'px';
  el.dataset.id = note.id;

  el.innerHTML = `
    <span class="note-delete">✕</span>
    <textarea class="note-text" placeholder="what does your perfect day look like?">${note.text || ''}</textarea>
    <span class="note-timestamp">${note.date}</span>
  `;

  corkboard.appendChild(el);

  // -------- autosave while typing --------
  const textarea = el.querySelector('.note-text');
  textarea.addEventListener('input', () => {
    const notes = loadNotes();
    const target = notes.find(n => n.id === note.id);
    if (target) {
      target.text = textarea.value;
      saveNotes(notes);
    }
  });

  // -------- delete --------
  el.querySelector('.note-delete').addEventListener('click', () => {
    el.remove();
    const notes = loadNotes().filter(n => n.id !== note.id);
    saveNotes(notes);
    toggleEmptyHint(notes);
  });

  // -------- dragging (plain mouse events, no library) --------
  makeDraggable(el, note.id);

  return el;
}

function makeDraggable(el, id) {
  let offsetX = 0;
  let offsetY = 0;
  let isDown = false;

  el.addEventListener('mousedown', (e) => {
    // don't start a drag if the user clicked inside the textarea or the delete button
    if (e.target.classList.contains('note-text') || e.target.classList.contains('note-delete')) return;

    isDown = true;
    el.classList.add('dragging');

    const rect = el.getBoundingClientRect();
    const boardRect = corkboard.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    e.preventDefault(); // stops text selection while dragging
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDown) return;

    const boardRect = corkboard.getBoundingClientRect();
    let newX = e.clientX - boardRect.left - offsetX;
    let newY = e.clientY - boardRect.top - offsetY;

    // keep it roughly inside the board, hacky but works
    newX = Math.max(0, Math.min(newX, corkboard.clientWidth - el.offsetWidth));
    newY = Math.max(0, Math.min(newY, corkboard.clientHeight - el.offsetHeight));

    el.style.left = newX + 'px';
    el.style.top = newY + 'px';
  });

  document.addEventListener('mouseup', () => {
    if (!isDown) return;
    isDown = false;
    el.classList.remove('dragging');

    // save the new position
    const notes = loadNotes();
    const target = notes.find(n => n.id === id);
    if (target) {
      target.x = parseInt(el.style.left, 10);
      target.y = parseInt(el.style.top, 10);
      saveNotes(notes);
    }
  });
}

function addNewNote() {
  const notes = loadNotes();

  const newNote = {
    id: Date.now().toString(), // good enough for a unique id here
    text: '',
    color: noteColors[Math.floor(Math.random() * noteColors.length)],
    // scatter it somewhere reasonable so new notes don't all stack in one spot
    x: 40 + Math.random() * 60,
    y: 30 + Math.random() * 40,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  notes.push(newNote);
  saveNotes(notes);
  renderNote(newNote);
  toggleEmptyHint(notes);
}

addNoteBtn.addEventListener('click', addNewNote);

// load existing notes on page load
(function initNotes() {
  const notes = loadNotes();
  notes.forEach(renderNote);
  toggleEmptyHint(notes);
})();
