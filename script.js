// Simple 12-slide deck controller
(function(){
  const deck = document.getElementById('deck');
  const slides = Array.from(deck.querySelectorAll('.slide'));
  const counter = document.getElementById('slideCounter');
  const titleEl = document.getElementById('slideTitle');
  const progressEl = document.getElementById('progress');
  const notesPanel = document.getElementById('notesPanel');
  const notesBody = document.getElementById('notesBody');
  const notesBtn = document.getElementById('notesBtn');
  const closeNotes = document.getElementById('closeNotes');
  const overviewBtn = document.getElementById('overviewBtn');

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  let idx = clamp(parseHash(), 0, slides.length - 1);
  let overview = false;
  let showNotes = false;
  update();

  // Navigation
  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }
  function parseHash(){
    const n = parseInt((location.hash || '#1').replace('#',''),10);
    return isNaN(n) ? 1 : (n - 1);
  }
  function goto(i){
    idx = clamp(i, 0, slides.length - 1);
    location.hash = String(idx + 1);
    update();
  }
  function update(){
    slides.forEach((s,i)=>{
      s.style.outline = i === idx ? '2px solid rgba(34,211,238,.35)' : 'none';
      s.style.transform = i === idx ? 'scale(1.01)' : 'scale(1)';
    });
    counter.textContent = `${idx+1} / ${slides.length}`;
    titleEl.textContent = slides[idx].dataset.title || `Slide ${idx+1}`;
    progressEl.style.width = `${((idx+1)/slides.length)*100}%`;

    // Scroll active slide into view
    slides[idx].scrollIntoView({behavior:'smooth', block:'center'});

    // Notes
    if(showNotes){
      notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.';
    }
  }

  // Buttons
  prevBtn.addEventListener('click', ()=> goto(idx-1));
  nextBtn.addEventListener('click', ()=> goto(idx+1));

  // Keyboard controls
  window.addEventListener('keydown', (e)=>{
    const k = e.key.toLowerCase();
    if(['arrowright','pagedown',' '].includes(e.key.toLowerCase())){ e.preventDefault(); goto(idx+1); }
    if(['arrowleft','pageup'].includes(e.key.toLowerCase())){ e.preventDefault(); goto(idx-1); }
    if(k === 'home'){ goto(0); }
    if(k === 'end'){ goto(slides.length-1); }
    if(k === 'o'){ // overview toggles compact spacing
      overview = !overview;
      document.body.classList.toggle('overview', overview);
    }
    if(k === 'n'){ // toggle notes
      showNotes = !showNotes;
      notesBtn.setAttribute('aria-pressed', String(showNotes));
      notesPanel.hidden = !showNotes;
      if(showNotes){ notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.'; }
    }
  });

  // Touch/swipe (simple)
  let touchStartX = 0;
  deck.addEventListener('touchstart', (e)=>{ touchStartX = e.changedTouches[0].clientX; }, {passive:true});
  deck.addEventListener('touchend', (e)=>{
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 40){
      if(dx < 0) goto(idx+1); else goto(idx-1);
    }
  }, {passive:true});

  // Hash change (deep linking)
  window.addEventListener('hashchange', ()=>{ idx = clamp(parseHash(),0,slides.length-1); update(); });

  // Notes toggles
  notesBtn.addEventListener('click', ()=>{
    showNotes = !showNotes;
    notesBtn.setAttribute('aria-pressed', String(showNotes));
    notesPanel.hidden = !showNotes;
    if(showNotes){ notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.'; }
  });
  closeNotes.addEventListener('click', ()=>{
    showNotes = false;
    notesBtn.setAttribute('aria-pressed', 'false');
    notesPanel.hidden = true;
  });

  // Overview mode via CSS class (optional compact spacing)
  const style = document.createElement('style');
  style.textContent = `
    body.overview .slide{ margin:.6rem 0 1rem; transform: scale(1); }
  `;
  document.head.appendChild(style);

})();