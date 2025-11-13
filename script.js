// Simple 12-slide deck controller with full-screen slides & overview mode
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

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

  function parseHash(){
    const n = parseInt((location.hash || '#1').replace('#',''),10);
    return isNaN(n) ? 1 : (n - 1);
  }

  function goto(i){
    idx = clamp(i, 0, slides.length - 1);
    // Only update hash if not in overview so deep-links remain clean
    location.hash = String(idx + 1);
    update();
  }

  function update(){
    slides.forEach((s,i)=>{
      const isActive = i === idx;
      s.classList.toggle('active', isActive);
      s.classList.toggle('before', i < idx);
      s.classList.toggle('after', i > idx);
    });

    counter.textContent = `${idx+1} / ${slides.length}`;
    titleEl.textContent = slides[idx].dataset.title || `Slide ${idx+1}`;
    progressEl.style.width = `${((idx+1)/slides.length)*100}%`;

    // Update notes if visible
    if(showNotes){
      notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.';
    }
  }

  // NAVIGATION BUTTONS
  prevBtn.addEventListener('click', ()=> goto(idx-1));
  nextBtn.addEventListener('click', ()=> goto(idx+1));

  // KEYBOARD CONTROLS
  window.addEventListener('keydown', (e)=>{
    const key = e.key.toLowerCase();

    if(['arrowright','pagedown',' '].includes(key)){
      e.preventDefault();
      goto(idx+1);
    }
    if(['arrowleft','pageup'].includes(key)){
      e.preventDefault();
      goto(idx-1);
    }
    if(key === 'home'){ goto(0); }
    if(key === 'end'){ goto(slides.length-1); }

    if(key === 'o'){
      // Toggle overview grid
      overview = !overview;
      document.body.classList.toggle('overview', overview);
      overviewBtn.setAttribute('aria-pressed', String(overview));
      // When entering overview, ensure all slides visible
      if(overview){
        slides.forEach(s=>{
          s.classList.add('active');
        });
      }else{
        update();
      }
    }

    if(key === 'n'){
      toggleNotes();
    }
  });

  // TOUCH / SWIPE (simple)
  let touchStartX = 0;
  deck.addEventListener('touchstart', (e)=>{
    touchStartX = e.changedTouches[0].clientX;
  }, {passive:true});

  deck.addEventListener('touchend', (e)=>{
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 40){
      if(dx < 0) goto(idx+1);
      else goto(idx-1);
    }
  }, {passive:true});

  // HASH CHANGE (deep linking)
  window.addEventListener('hashchange', ()=>{
    idx = clamp(parseHash(),0,slides.length-1);
    update();
  });

  // NOTES TOGGLES
  function toggleNotes(){
    showNotes = !showNotes;
    notesBtn.setAttribute('aria-pressed', String(showNotes));
    notesPanel.hidden = !showNotes;
    if(showNotes){
      notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.';
    }
  }

  notesBtn.addEventListener('click', toggleNotes);

  closeNotes.addEventListener('click', ()=>{
    showNotes = false;
    notesBtn.setAttribute('aria-pressed', 'false');
    notesPanel.hidden = true;
  });

  // OVERVIEW CLICK TO SELECT SLIDE
  slides.forEach((s, i)=>{
    s.addEventListener('click', ()=>{
      if(overview){
        overview = false;
        document.body.classList.remove('overview');
        overviewBtn.setAttribute('aria-pressed', 'false');
        goto(i);
      }
    });
  });

  // Inject small CSS tweak for overview spacing (if needed)
  const style = document.createElement('style');
  style.textContent = `
    body.overview .slide.active { opacity:1; transform:scale(1); }
  `;
  document.head.appendChild(style);

})();
