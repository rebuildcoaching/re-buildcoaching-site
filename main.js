(function(){
  const $ = s => document.querySelector(s), $$ = s => Array.from(document.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header state + mobile CTA
  const header = $('.site-header'), mcta = $('#mobile-cta'), enq = $('#enquire');
  function onScroll(){
    const y = scrollY;
    header.classList.toggle('scrolled', y > 40);
    if (mcta && enq){
      const r = enq.getBoundingClientRect();
      const nearForm = r.top < innerHeight && r.bottom > 0;
      mcta.classList.toggle('show', y > innerHeight * 0.8 && !nearForm);
    }
  }
  addEventListener('scroll', onScroll, {passive:true}); onScroll();

  // Reveals
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), {rootMargin:'0px 0px -8% 0px', threshold:0.08});
  $$('.reveal').forEach(el => io.observe(el));
  // Safety: anything already in view on load
  requestAnimationFrame(() => $$('.reveal').forEach(el => { const r = el.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) el.classList.add('in'); }));

  // Parallax-ish hero + offer image
  const heroImg = $('#hero-img'), offerImg = $('#offer-img'), offer = $('#coaching');
  if (!reduce){
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return; ticking = true;
      requestAnimationFrame(() => {
        const y = scrollY;
        if (heroImg && y < innerHeight * 1.2) heroImg.style.transform = `scale(${1 + Math.min(y, innerHeight) / innerHeight * 0.08}) translateY(${y * 0.12}px)`;
        if (offerImg && offer){
          const r = offer.getBoundingClientRect();
          if (r.bottom > 0 && r.top < innerHeight){
            const p = (innerHeight - r.top) / (innerHeight + r.height);
            offerImg.style.transform = `translateY(${(p - 0.5) * -14}%)`;
          }
        }
        ticking = false;
      });
    }, {passive:true});
  }

  // Method steps highlight
  const steps = $$('.step'), meter = $$('.method-meter i');
  function setStep(i){
    steps.forEach((s, j) => s.classList.toggle('active', j === i));
    meter.forEach((m, j) => m.classList.toggle('on', j <= i));
  }
  if (steps.length){
    setStep(0);
    const so = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) setStep(Number(e.target.dataset.step)); });
    }, {rootMargin:'-45% 0px -45% 0px', threshold:0});
    steps.forEach(s => so.observe(s));
  }

  // Hybrid Parent Plan week
  const weeks = {
    perfect: {
      note: 'Three full-body sessions on non-consecutive days. This is the target, not the test.',
      days: [
        ['Mon','train','Session A','Full-body strength'],
        ['Tue','rest','Walk','Easy, conversational'],
        ['Wed','train','Session B','Full-body strength'],
        ['Thu','rest','Rest','Recover'],
        ['Fri','train','Session C','Full-body strength'],
        ['Sat','rest','Family','Get outside'],
        ['Sun','rest','Rest','Plan next week']
      ]
    },
    real: {
      note: 'Late meetings, a sick kid, a cancelled childcare day. The fallback plan keeps the week moving: shorter sessions, same momentum.',
      days: [
        ['Mon','train','Session A','Full session done'],
        ['Tue','busy','Late finish','Life happened'],
        ['Wed','short','20-min AMRAP','Fallback session'],
        ['Thu','busy','Kids off sick','Life happened'],
        ['Fri','short','First 3 lifts','Short on time'],
        ['Sat','short','25-min EMOM','Fallback session'],
        ['Sun','rest','Rest','Still a good week']
      ]
    }
  };
  const weekEl = $('#week'), note = $('#week-note');
  function renderWeek(mode, animate){
    const w = weeks[mode];
    const build = () => {
      weekEl.innerHTML = w.days.map(([d, cls, tag, len]) =>
        `<div class="day ${cls}"><b>${d}</b><div class="slot"><span class="tag">${tag}</span><span class="len">${len}</span></div></div>`).join('');
      note.textContent = w.note;
    };
    if (!animate || reduce){ build(); return; }
    weekEl.classList.add('swap');
    setTimeout(() => { build(); requestAnimationFrame(() => requestAnimationFrame(() => weekEl.classList.remove('swap'))); }, 260);
  }
  if (weekEl){
    renderWeek('perfect', false);
    $$('.toggle button').forEach(b => b.addEventListener('click', () => {
      if (b.getAttribute('aria-pressed') === 'true') return;
      $$('.toggle button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      renderWeek(b.dataset.mode, true);
    }));
  }

  // FAQ: one open at a time
  $$('.faq-list details').forEach(d => d.addEventListener('toggle', () => {
    if (d.open) $$('.faq-list details').forEach(o => { if (o !== d) o.open = false; });
  }));

  // Enquiry form
  const form = $('#coaching-enquiry');
  if (form){
    const status = $('#enquiry-status'), mail = $('#enquiry-email-link');
    const bodyText = () => {
      const v = new FormData(form);
      return ['Hi Malky,', '', "I'm interested in RE:BUILD 1-to-1 coaching.", '',
        'Name: ' + (v.get('name') || ''), 'Email: ' + (v.get('email') || ''), '',
        'My goals over the next 6–12 months:', v.get('goals') || '', '',
        "What's currently stopping me:", v.get('obstacles') || '', '',
        'My current training and available time:', v.get('routine') || 'Not provided'].join('\n');
    };
    const syncMail = () => { mail.href = 'mailto:malky@re-buildcoaching.com?subject=' + encodeURIComponent('RE:BUILD coaching enquiry') + '&body=' + encodeURIComponent(bodyText()); };
    form.addEventListener('input', syncMail); syncMail();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const v = new FormData(form);
      if (v.get('_honey')) return;
      if (!form.checkValidity()){
        const bad = form.querySelector(':invalid');
        status.textContent = 'Please fill in the required fields (marked *) with a valid email.';
        bad && bad.focus();
        return;
      }
      const btn = form.querySelector('button[type=submit]');
      const label = btn.innerHTML;
      btn.disabled = true; btn.textContent = 'Sending…'; status.textContent = 'Sending your enquiry…';
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 20000);
      try{
        const res = await fetch('https://formsubmit.co/ajax/malky@re-buildcoaching.com', {
          method:'POST', signal:ctrl.signal,
          headers:{'Content-Type':'application/json', 'Accept':'application/json'},
          body: JSON.stringify({
            name: v.get('name'), email: v.get('email'),
            'Goals over the next 6–12 months': v.get('goals'),
            'Current obstacles': v.get('obstacles'),
            'Current training and available time': v.get('routine') || 'Not provided',
            _subject: 'New RE:BUILD 1-to-1 coaching enquiry', _template: 'table'
          })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || String(data.success) === 'false') throw new Error('fail');
        form.reset(); syncMail();
        status.textContent = "Thanks, your enquiry is on its way. I'll be in touch soon.";
      } catch(err){
        status.textContent = "That didn't send. Use \"Email my answers instead\" and your answers will open in your email app, ready to send.";
      } finally { clearTimeout(t); btn.disabled = false; btn.innerHTML = label; }
    });
  }

  const yr = $('#yr'); if (yr) yr.textContent = new Date().getFullYear();
})();
