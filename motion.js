(() => {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = document.createElement('div');
  progress.className = 'reading-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.append(progress);
  const back = document.createElement('button');
  back.className = 'back-to-top';
  back.type = 'button';
  back.setAttribute('aria-label', '回到顶部');
  back.textContent = '↑';
  back.addEventListener('click', () => window.scrollTo({top: 0, behavior: reduced.matches ? 'instant' : 'smooth'}));
  document.body.append(back);
  let ticking = false;
  function updateProgress() {
    const max = document.documentElement.scrollHeight - innerHeight;
    const value = max > 0 ? Math.max(0, Math.min(1, scrollY / max)) : 0;
    progress.style.transform = `scaleX(${value})`;
    back.classList.toggle('is-visible', scrollY > 650);
    back.tabIndex = scrollY > 650 ? 0 : -1;
    ticking = false;
  }
  addEventListener('scroll', () => {if (!ticking) {ticking = true;requestAnimationFrame(updateProgress);}}, {passive: true});
  addEventListener('resize', updateProgress, {passive: true});
  updateProgress();

  if ('IntersectionObserver' in window && !reduced.matches) {
    const reveal = new IntersectionObserver(entries => {
      entries.forEach(entry => {if(entry.isIntersecting){entry.target.classList.add('is-revealed');reveal.unobserve(entry.target);}});
    }, {threshold: .08, rootMargin: '0px 0px 35px 0px'});
    function observeCards(root = document) {
      root.querySelectorAll('.category-card,.entry-card,.about-section,.updates-panel').forEach((el,i) => {
        if (el.dataset.reveal) return;
        el.dataset.reveal = 'true';
        el.style.setProperty('--reveal-delay', `${Math.min(i % 4,3) * 45}ms`);
        reveal.observe(el);
      });
    }
    observeCards();
    ['explore','content-grid'].forEach(id => {
      const grid = document.getElementById(id);
      if (grid) new MutationObserver(() => {observeCards(grid);updateProgress();}).observe(grid,{childList:true});
    });
    document.documentElement.classList.add('motion-ready');
  }

  const aside = document.querySelector('.reading-aside');
  const toggle = document.getElementById('outline-toggle');
  if (aside && toggle) {
    const mobile = matchMedia('(max-width: 850px)');
    const sync = () => {aside.classList.remove('outline-open');toggle.setAttribute('aria-expanded', String(!mobile.matches));};
    sync();mobile.addEventListener('change', sync);
    toggle.addEventListener('click', () => {
      if(!mobile.matches) return;
      const open = aside.classList.toggle('outline-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.getElementById('outline')?.addEventListener('click', e => {
      if(e.target.closest('a') && mobile.matches){aside.classList.remove('outline-open');toggle.setAttribute('aria-expanded','false');}
    });
  }

  const body = document.getElementById('body');
  if (body) {
    let sectionObserver;
    const enhanceArticle = () => {
      updateProgress();
      body.querySelectorAll('pre').forEach(pre => {
        if(pre.querySelector('.copy-code')) return;
        const button = document.createElement('button');
        button.type='button';button.className='copy-code';button.textContent='复制';
        button.addEventListener('click', async () => {
          try {await navigator.clipboard.writeText(pre.querySelector('code').textContent);button.textContent='已复制';}
          catch {button.textContent='请长按代码复制';}
          setTimeout(() => button.textContent='复制',1800);
        });
        pre.append(button);
      });
      if('IntersectionObserver' in window){
        sectionObserver?.disconnect();
        sectionObserver = new IntersectionObserver(entries => {
          for(const entry of entries){if(!entry.isIntersecting) continue;
            document.querySelectorAll('#outline a').forEach(a => {
              const active = a.hash === '#'+entry.target.id;
              a.classList.toggle('is-current',active);
              if(active) a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
            });
          }
        },{rootMargin:'-5% 0px -65% 0px'});
        body.querySelectorAll('h2').forEach(h => sectionObserver.observe(h));
      }
    };
    new MutationObserver(enhanceArticle).observe(body,{childList:true});
    enhanceArticle();
  }
})();

