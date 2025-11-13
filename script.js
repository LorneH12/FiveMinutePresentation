// Deck controller with vertical depth transitions + multi-layer parallax + depth presets
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

  const parallaxGroup = document.getElementById('parallaxGroup');
  const parallaxLayers = parallaxGroup
    ? Array.from(parallaxGroup.querySelectorAll('.parallax-layer'))
    : [];

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');

  const depthButtons = Array.from(document.querySelectorAll('.depth-btn'));

  if (!deck || slides.length === 0) {
    return;
  }

  let idx = clamp(parseHash(), 0, slides.length - 1);
  let overview = false;
  let showNotes = false;

  // parallax strength (tuned by depth presets)
  let parallaxStrengthX = 120;
  let parallaxStrengthY = 80;

  // Initial render
  setInitialSlide(idx);
  updateUI();
  updateGlow();
  setDepthPreset('deep'); // default

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

    location.hash = String(idx + 1);

    animateTransition(oldIndex, idx, direction);
    updateUI();
    updateGlow();
  }

  function animateTransition(oldIndex, newIndex, direction){
    if(oldIndex === newIndex) return;

    const oldSlide = slides[oldIndex];
    const newSlide = slides[newIndex];

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
    if(!parallaxGroup) return;
    const total = Math.max(slides.length - 1, 1);
    const t = idx / total; // 0..1 across deck

    const glowX = 25 + 50 * t;      // 25% → 75%
    const glowY = 25 + 20 * (1 - t);// ~45% → ~25%
    const strength = 0.35 + 0.25 * Math.sin(t * Math.PI); // 0.35 → 0.6 → 0.35

    parallaxGroup.style.setProperty('--glow-x', glowX + '%');
    parallaxGroup.style.setProperty('--glow-y', glowY + '%');
    parallaxGroup.style.setProperty('--glow-strength', String(strength));
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

  // MULTI-LAYER PARALLAX: move layers at different speeds with mouse
  if(parallaxGroup && deck && parallaxLayers.length){
    window.addEventListener('mousemove', (e)=>{
      const rect = deck.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const relX = ((e.clientX - rect.left) / rect.width) - 0.5; // -0.5..0.5
      const relY = ((e.clientY - rect.top) / rect.height) - 0.5;

      parallaxLayers.forEach(layer=>{
        const depth = parseFloat(layer.dataset.depth || '0.2'); // 0..1

        // Deep 3D feel: nearer layers move much more
        const translateX = relX * depth * parallaxStrengthX;
        const translateY = relY * depth * parallaxStrengthY;

        layer.style.transform =
          `translate3d(${translateX}px, ${translateY}px, 0)`;
      });
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

  // Depth presets
  depthButtons.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const preset = btn.dataset.depth || 'medium';
      setDepthPreset(preset);
    });
  });

  function setDepthPreset(preset){
    const rootStyle = document.documentElement.style;

    if(preset === 'subtle'){
      parallaxStrengthX = 40;
      parallaxStrengthY = 30;
      rootStyle.setProperty('--blur-bg1','10px');
      rootStyle.setProperty('--blur-layer3','7px');
      rootStyle.setProperty('--blur-layer2','4px');
      rootStyle.setProperty('--blur-main','1px');
    }else if(preset === 'medium'){
      parallaxStrengthX = 80;
      parallaxStrengthY = 55;
      rootStyle.setProperty('--blur-bg1','9px');
      rootStyle.setProperty('--blur-layer3','6px');
      rootStyle.setProperty('--blur-layer2','3px');
      rootStyle.setProperty('--blur-main','0.5px');
    }else{ // deep
      parallaxStrengthX = 120;
      parallaxStrengthY = 80;
      rootStyle.setProperty('--blur-bg1','8px');
      rootStyle.setProperty('--blur-layer3','5px');
      rootStyle.setProperty('--blur-layer2','3px');
      rootStyle.setProperty('--blur-main','0px');
    }

    document.documentElement.setAttribute('data-depth-preset', preset);

    depthButtons.forEach(b=>{
      const isActive = b.dataset.depth === preset;
      b.setAttribute('aria-pressed', String(isActive));
    });
  }

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
