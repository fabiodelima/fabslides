/**
   🎨 FABSLIDES CORE CONTROLLER - BOILERPLATE
   Lógica Sequencial de Scroll Híbrido, Passos Progressivos e Sincronização WebSocket
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const sections = Array.from(document.querySelectorAll('.slide-section'));
  const indicatorContainer = document.querySelector('.indicator-container');
  const indicators = Array.from(document.querySelectorAll('.indicator-index'));
  
  let activeSlideIndex = 0;
  let activeSlideSteps = [];
  let currentStepIndex = 0; // Passo atual no slide ativo

  // 1. Configurações de Controle Remoto via WebSocket (Opcional)
  const WS_URL = 'wss://ws.fabiollima.com';
  const SESSION_ID = String(Math.floor(1000 + Math.random() * 9000));
  let remoteWs = null;

  // Injeta identificador de conexão na tela (apenas em desenvolvimento/capa)
  const connectBadge = document.createElement('div');
  connectBadge.id = 'fabslides-session-badge';
  connectBadge.style.cssText = [
    'position:fixed', 'bottom:1.2rem', 'right:1.5rem', 'z-index:9999',
    'background:rgba(11,30,54,0.85)', 'backdrop-filter:blur(8px)',
    'border:1px solid rgba(224,90,16,0.4)', 'border-radius:8px',
    'padding:0.4rem 0.9rem', 'font-family:sans-serif',
    'font-size:0.75rem', 'color:rgba(240,237,232,0.6)',
    'transition:opacity 0.5s', 'pointer-events:none'
  ].join(';');
  connectBadge.innerHTML = `FabSlides ID: <strong style="color:#E05A10;letter-spacing:0.15em">${SESSION_ID}</strong>`;
  document.body.appendChild(connectBadge);

  function sendStateUpdate() {
    if (!remoteWs || remoteWs.readyState !== WebSocket.OPEN) return;
    remoteWs.send(JSON.stringify({
      type: 'state-update',
      slideIndex: activeSlideIndex,
      stepIndex: currentStepIndex
    }));
  }

  function connectRemote() {
    try {
      remoteWs = new WebSocket(WS_URL);
    } catch (e) {
      console.warn('[FabSlides] Servidor WebSocket indisponível:', e.message);
      return;
    }

    remoteWs.onopen = () => {
      remoteWs.send(JSON.stringify({ type: 'register', sessionId: SESSION_ID, role: 'host' }));
      console.log(`[FabSlides] Conectado. Sala de Sincronização: ${SESSION_ID}`);
    };

    remoteWs.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === 'request-state') {
        sendStateUpdate();
        return;
      }

      if (data.type === 'command') {
        if (data.action === 'next') {
          handleKeyDown({ key: 'ArrowRight', preventDefault: () => {} });
        } else if (data.action === 'prev') {
          handleKeyDown({ key: 'ArrowLeft', preventDefault: () => {} });
        }
      }
    };

    remoteWs.onclose = () => {
      setTimeout(connectRemote, 5000);
    };
  }

  // 2. Parâmetros de Apresentador (Verifica se está rodando dentro do Iframe)
  const urlParams = new URLSearchParams(window.location.search);
  const isPresenter = urlParams.has('presenter');

  // Inicializa conexão remota apenas na tela principal de palco
  if (!isPresenter) {
    connectRemote();
  }

  // Oculta badge se estiver no Iframe
  if (isPresenter && connectBadge) {
    connectBadge.style.display = 'none';
  }

  // 3. Inicializar Delays em Cascata para entrada de elementos
  sections.forEach(section => {
    const contentContainer = section.querySelector('[data-content]');
    if (contentContainer) {
      const children = Array.from(contentContainer.children);
      children.forEach((child, i) => {
        if (!child.hasAttribute('data-step') || child.dataset.step === "1") {
          child.style.setProperty('--delay', `${i * 80}ms`);
        }
      });
    }
  });

  // 4. Mapeamento e Ativação de Passos Locais
  function getStepsForSlide(slideSection) {
    return Array.from(slideSection.querySelectorAll('[data-step]'))
      .sort((a, b) => parseInt(a.dataset.step, 10) - parseInt(b.dataset.step, 10));
  }

  function updateSlideState(index, isKeyboardHorizontal = false) {
    activeSlideIndex = index;
    const activeSection = sections[index];

    // Ocultar/Exibir indicadores na capa (Slide 0)
    if (indicatorContainer) {
      indicatorContainer.style.opacity = index === 0 ? '0' : '1';
      indicatorContainer.style.pointerEvents = index === 0 ? 'none' : 'auto';
    }

    // Gerencia classes ativas nos slides
    sections.forEach((sec, i) => {
      sec.classList.toggle('is-visible', i === index);
    });

    // Atualiza indicadores de página à direita
    indicators.forEach((ind, i) => {
      ind.classList.toggle('expand', i === index);
    });

    // Configura os passos do slide ativo
    activeSlideSteps = getStepsForSlide(activeSection);

    if (isKeyboardHorizontal) {
      // Começa limpo para o Storytelling progressivo no teclado
      currentStepIndex = 0;
      activeSlideSteps.forEach(stepEl => {
        stepEl.classList.remove('active-step');
      });
    } else {
      // Carrega tudo imediatamente no Scroll Nativo ou Visão de Estudo
      currentStepIndex = activeSlideSteps.length;
      activeSlideSteps.forEach(stepEl => {
        stepEl.classList.add('active-step');
      });
    }

    // Executa gatilhos especiais de animação
    triggerStepAnimations(activeSlideIndex, currentStepIndex);

    // Persistência local e Hash URL
    if (!isPresenter) {
      localStorage.setItem('fabslides_index', index);
      const slideId = activeSection.id;
      if (slideId) {
        history.replaceState(null, null, `#${slideId}`);
      }
      sendStateUpdate();
    }
  }

  // 5. IntersectionObserver (Detecta Rolagem Nativa / Mouse Wheel)
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.55
  };

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const index = parseInt(entry.target.dataset.index, 10);
        if (index !== activeSlideIndex) {
          updateSlideState(index, false);
        }
      }
    });
  };

  if (!isPresenter) {
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(section => observer.observe(section));
  }

  // 6. Rolagem Suave Magnética
  const scrollToSlide = (index, isKeyboardHorizontal = false) => {
    if (index >= 0 && index < sections.length) {
      sections[index].scrollIntoView({ behavior: 'smooth' });
      updateSlideState(index, isKeyboardHorizontal);
    }
  };

  // 7. Interceptor de Teclado Híbrido
  const handleKeyDown = (e) => {
    if (['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft', ' ', 'PageDown', 'PageUp'].includes(e.key)) {
      e.preventDefault();
    }

    if (e.key === 'ArrowDown' || e.key === 'PageDown') {
      if (activeSlideIndex < sections.length - 1) {
        scrollToSlide(activeSlideIndex + 1, false);
      }
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      if (activeSlideIndex > 0) {
        scrollToSlide(activeSlideIndex - 1, false);
      }
    } else if (e.key === 'ArrowRight' || e.key === ' ') {
      // Storytelling por Ações
      if (activeSlideSteps.length > 0 && currentStepIndex < activeSlideSteps.length) {
        currentStepIndex++;
        activeSlideSteps.forEach(stepEl => {
          if (parseInt(stepEl.dataset.step, 10) <= currentStepIndex) {
            stepEl.classList.add('active-step');
          }
        });
        triggerStepAnimations(activeSlideIndex, currentStepIndex);
        sendStateUpdate();
      } else {
        // Sem mais passos locais, rola para o próximo slide
        if (activeSlideIndex < sections.length - 1) {
          scrollToSlide(activeSlideIndex + 1, true);
        }
      }
    } else if (e.key === 'ArrowLeft') {
      if (activeSlideSteps.length > 0 && currentStepIndex > 0) {
        activeSlideSteps.forEach(stepEl => {
          if (parseInt(stepEl.dataset.step, 10) === currentStepIndex) {
            stepEl.classList.remove('active-step');
          }
        });
        currentStepIndex--;
        triggerStepAnimations(activeSlideIndex, currentStepIndex);
        sendStateUpdate();
      } else {
        if (activeSlideIndex > 0) {
          scrollToSlide(activeSlideIndex - 1, false);
        }
      }
    }
  };

  if (!isPresenter) {
    window.addEventListener('keydown', handleKeyDown);
  }

  // 8. Navegação por Clique nos Indicadores Laterais
  indicators.forEach(indicator => {
    indicator.addEventListener('click', () => {
      const index = parseInt(indicator.dataset.targetIndex, 10);
      scrollToSlide(index, false);
    });
  });

  // 9. Gatilhos Personalizáveis de Animação (Feature Library hooks)
  function triggerStepAnimations(slideIdx, stepIdx) {
    /* Exemplo de Gancho para Funcionalidades:
    if (slideIdx === 1) {
      const timelineBar = document.querySelector('.timeline-bar');
      if (timelineBar) {
        timelineBar.classList.toggle('stretched', stepIdx >= 1);
      }
    }
    */
  }

  // 10. Inicialização e Restauração de Estado
  const hash = window.location.hash;
  let initIndex = 0;
  
  if (hash) {
    const matchedSec = document.querySelector(hash);
    if (matchedSec) {
      initIndex = parseInt(matchedSec.dataset.index, 10);
    }
  } else if (!isPresenter) {
    const savedIndex = localStorage.getItem('fabslides_index');
    if (savedIndex !== null) {
      const idx = parseInt(savedIndex, 10);
      if (idx >= 0 && idx < sections.length) {
        initIndex = idx;
      }
    }
  }

  if (isPresenter) {
    if (hash) {
      const matchedSec = document.querySelector(hash);
      if (matchedSec) {
        setTimeout(() => { matchedSec.scrollIntoView({ behavior: 'auto' }); }, 100);
      }
    }
    updateSlideState(initIndex, false);
    
    // Força revelação completa no Iframe/Presenter
    const activeSection = sections[initIndex];
    const steps = Array.from(activeSection.querySelectorAll('[data-step]'));
    steps.forEach(stepEl => { stepEl.classList.add('active-step'); });
    triggerStepAnimations(initIndex, steps.length);
  } else {
    if (initIndex > 0) {
      setTimeout(() => { sections[initIndex].scrollIntoView({ behavior: 'auto' }); }, 50);
      updateSlideState(initIndex, false);
    } else {
      updateSlideState(0, false);
    }
  }
});
