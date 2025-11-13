// Deck controller with vertical depth transitions + parallax cheesecake mid-ground
(function(){
  const deck = document.getElementById('deck');
  const slides = deck ? Array.from(deck.querySelectorAll('.slide')) : [];
  const counter = document.getElementById('slideCounter');
  const titleEl = document.getElementById('slideTitle');
  const progressEl = document.getElementById('progress');
  const notesPanel = document.getElementById('notesPanel');
  const notesBody = document.getElementById('notesBody');
  const notesBtn = document.getElementById('notesBtn');
  const closeNotes = document.getElementById('closeNotes');
  const overviewBtn = document.getElementById('overviewBtn');
  const parallaxBg = document.getElementById('parallaxBg');

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  if (!deck || slides.length === 0) {
    // Fail-safe: if something is really wrong, just stop here.
    return;
  }

  let idx = clamp(parseHash(), 0, slides.length - 1);
  let overview = false;
  let showNotes = false;

  // Initial render without animation
  setInitialSlide(idx);
  updateUI();
  updateGlow();

  function clamp(n,min,max){ return Math.max(min, Math.min(max, n)); }

  function parseHash(){
    const raw = (location.hash || '#1').replace('#','');
    const n = parseInt(raw,10);
    return isNaN(n) ? 0 : (n - 1);
  }

  function setInitialSlide(i){
    slides.forEach((s, index)=>{
      const isActive = index === i;
      s.classList.toggle('active', isActive);
      s.classList.remove(
        'slide-enter-up','slide-exit-up',
        'slide-enter-down','slide-exit-down',
        'before','after'
      );
      s.style.pointerEvents = isActive ? 'auto' : 'none';
    });
  }

  function goto(newIndex){
    newIndex = clamp(newIndex, 0, slides.length - 1);
    if(newIndex === idx) return;

    const oldIndex = idx;
    const direction = newIndex > oldIndex ? 'forward' : 'backward';
    idx = newIndex;

    // Update hash for deep-linking
    location.hash = String(idx + 1);

    animateTransition(oldIndex, idx, direction);
    updateUI();
    updateGlow();
  }

  function animateTransition(oldIndex, newIndex, direction){
    if(oldIndex === newIndex) return;

    const oldSlide = slides[oldIndex];
    const newSlide = slides[newIndex];

    // Clear previous animation classes
    slides.forEach(s=>{
      s.classList.remove(
        'slide-enter-up','slide-exit-up',
        'slide-enter-down','slide-exit-down',
        'before','after','active'
      );
      s.style.pointerEvents = 'none';
    });

    if(!oldSlide || !newSlide){
      setInitialSlide(newIndex);
      return;
    }

    const enterClass = direction === 'forward' ? 'slide-enter-up' : 'slide-enter-down';
    const exitClass  = direction === 'forward' ? 'slide-exit-up'  : 'slide-exit-down';

    oldSlide.classList.add(exitClass, direction === 'forward' ? 'before' : 'after');
    newSlide.classList.add('active', enterClass);
    newSlide.style.pointerEvents = 'auto';

    [oldSlide, newSlide].forEach(slide=>{
      slide.addEventListener('animationend', function handler(){
        slide.classList.remove(
          'slide-enter-up','slide-exit-up',
          'slide-enter-down','slide-exit-down',
          'before','after'
        );
        if(slide !== slides[idx]){
          slide.classList.remove('active');
          slide.style.pointerEvents = 'none';
        }
        slide.removeEventListener('animationend', handler);
      }, { once:true });
    });
  }

  function updateUI(){
    if (counter) counter.textContent = `${idx+1} / ${slides.length}`;
    if (titleEl) titleEl.textContent = slides[idx].dataset.title || `Slide ${idx+1}`;
    if (progressEl) progressEl.style.width = `${((idx+1)/slides.length)*100}%`;

    if(showNotes && notesBody){
      notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.';
    }
  }

  // Glow position + intensity based on slide index (subtle lighting shift)
  function updateGlow(){
    if(!parallaxBg) return;
    const total = Math.max(slides.length - 1, 1);
    const t = idx / total; // 0..1 across deck

    const glowX = 25 + 50 * t;      // 25% → 75%
    const glowY = 25 + 20 * (1 - t);// ~45% → ~25%
    const strength = 0.35 + 0.25 * Math.sin(t * Math.PI); // 0.35 → 0.6 → 0.35

    parallaxBg.style.setProperty('--glow-x', glowX + '%');
    parallaxBg.style.setProperty('--glow-y', glowY + '%');
    parallaxBg.style.setProperty('--glow-strength', String(strength));
  }

  // NAV BUTTONS
  if (prevBtn) prevBtn.addEventListener('click', ()=> { if(!overview) goto(idx-1); });
  if (nextBtn) nextBtn.addEventListener('click', ()=> { if(!overview) goto(idx+1); });

  // KEYBOARD CONTROLS
  window.addEventListener('keydown', (e)=>{
    const key = e.key.toLowerCase();

    if(['arrowright','pagedown',' '].includes(key)){
      e.preventDefault();
      if(!overview) goto(idx+1);
    }
    if(['arrowleft','pageup'].includes(key)){
      e.preventDefault();
      if(!overview) goto(idx-1);
    }
    if(key === 'home'){ if(!overview) goto(0); }
    if(key === 'end'){ if(!overview) goto(slides.length-1); }

    if(key === 'o'){
      overview = !overview;
      document.body.classList.toggle('overview', overview);
      if (overviewBtn) overviewBtn.setAttribute('aria-pressed', String(overview));

      if(overview){
        // Show all slides as mini cards, no animations
        slides.forEach(s=>{
          s.classList.add('active');
          s.style.pointerEvents = 'auto';
        });
      }else{
        setInitialSlide(idx);
        updateUI();
        updateGlow();
      }
    }

    if(key === 'n'){
      toggleNotes();
    }
  });

  // PARALLAX: move cheesecake subtly with mouse on desktop
  if(parallaxBg && deck){
    window.addEventListener('mousemove', (e)=>{
      const rect = deck.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const relX = ((e.clientX - rect.left) / rect.width) - 0.5; // -0.5..0.5
      const relY = ((e.clientY - rect.top) / rect.height) - 0.5;

      const translateX = relX * 24;
      const translateY = relY * 18;

      parallaxBg.style.transform =
        `translate3d(${translateX}px, ${translateY}px, 0) scale(1.05)`;
    }, { passive: true });
  }

  // TOUCH / SWIPE (simple)
  let touchStartX = 0;
  deck.addEventListener('touchstart', (e)=>{
    touchStartX = e.changedTouches[0].clientX;
  }, {passive:true});

  deck.addEventListener('touchend', (e)=>{
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 40){
      if(!overview){
        if(dx < 0) goto(idx+1);
        else goto(idx-1);
      }
    }
  }, {passive:true});

  // HASH CHANGE (deep linking via URL)
  window.addEventListener('hashchange', ()=>{
    const newIndex = clamp(parseHash(),0,slides.length-1);
    if(newIndex === idx) return;
    const direction = newIndex > idx ? 'forward' : 'backward';
    const oldIndex = idx;
    idx = newIndex;
    animateTransition(oldIndex, idx, direction);
    updateUI();
    updateGlow();
  });

  // NOTES
  function toggleNotes(){
    showNotes = !showNotes;
    if (notesBtn) notesBtn.setAttribute('aria-pressed', String(showNotes));
    if (!notesPanel) return;
    notesPanel.hidden = !showNotes;
    if(showNotes && notesBody){
      notesBody.textContent = slides[idx].dataset.notes || 'No notes for this slide.';
    }
  }

  if (notesBtn) notesBtn.addEventListener('click', toggleNotes);

  if (closeNotes) {
    closeNotes.addEventListener('click', ()=>{
      showNotes = false;
      if (notesBtn) notesBtn.setAttribute('aria-pressed', 'false');
      if (notesPanel) notesPanel.hidden = true;
    });
  }

  // OVERVIEW CLICK TO SELECT SLIDE
  slides.forEach((s, i)=>{
    s.addEventListener('click', ()=>{
      if(overview){
        overview = false;
        document.body.classList.remove('overview');
        if (overviewBtn) overviewBtn.setAttribute('aria-pressed', 'false');
        goto(i);
      }
    });
  });

  // Ensure active slide looks correct in overview
  const style = document.createElement('style');
  style.textContent = `
    body.overview .slide.active {
      opacity:1;
      transform:scale(1);
      filter:none;
    }
  `;
  document.head.appendChild(style);

})();
