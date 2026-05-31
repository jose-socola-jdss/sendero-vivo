import { gsap } from "gsap";

document.addEventListener("DOMContentLoaded", () => {
  // Mobile Nav Toggle
  const menuToggle = document.querySelector(".menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const header = document.querySelector(".site-header");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      const isOpen = navLinks.classList.toggle("is-open");
      header.classList.toggle("menu-open", isOpen);
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.innerHTML = isOpen ? "&times;" : "&#9776;";
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navLinks.classList.remove("is-open");
        header.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.innerHTML = "&#9776;";
      });
    });
  }

  // Accordion Logic
  const accordionGroup = document.querySelector("[data-accordion]");
  if (accordionGroup) {
    const items = accordionGroup.querySelectorAll(".accordion-item");
    items.forEach((item) => {
      const trigger = item.querySelector("[data-accordion-trigger]");
      const content = item.querySelector("[data-accordion-content]");

      if (trigger && content) {
        trigger.addEventListener("click", () => {
          const isActive = item.classList.toggle("is-active");
          trigger.setAttribute("aria-expanded", String(isActive));
          
          if (isActive) {
            content.removeAttribute("hidden");
            gsap.fromTo(content, 
              { height: 0, opacity: 0 },
              { height: "auto", opacity: 1, duration: 0.35, ease: "power1.out" }
            );
            trigger.querySelector("span").textContent = "−";
          } else {
            gsap.to(content, {
              height: 0,
              opacity: 0,
              duration: 0.25,
              ease: "power1.in",
              onComplete: () => {
                content.setAttribute("hidden", "true");
              }
            });
            trigger.querySelector("span").textContent = "+";
          }
        });
      }
    });
  }

  // Footer Year
  const yearSpan = document.getElementById("year");
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }

  // GSAP Fade-in
  gsap.from(".calm-box .eyebrow, .calm-box .display, .calm-box .lead, .calm-box .cluster", {
    y: 35,
    opacity: 0,
    duration: 1.2,
    stagger: 0.15,
    ease: "power3.out"
  });

  gsap.from("breathing-guide", {
    opacity: 0,
    y: 40,
    duration: 1.2,
    ease: "power3.out",
    delay: 0.4
  });

  // Scroll Reveal
  const reveals = document.querySelectorAll(".card, .soft-quote, .timeline-item, .accordion-item");
  if (reveals.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          gsap.from(entry.target, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power2.out"
          });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach((el) => observer.observe(el));
  }
});

// Custom Breathing Guide Web Component
class BreathingGuide extends HTMLElement {
  constructor() {
    super();
    this.isActive = false;
    this.currentMode = "box"; // box, deep
    
    // Duration configurations in seconds
    this.modes = {
      box: [
        { state: "Inhala", duration: 4, scale: 1.5, bgGlow: 1.8 },
        { state: "Retén", duration: 4, scale: 1.5, bgGlow: 1.5 },
        { state: "Exhala", duration: 4, scale: 1.0, bgGlow: 1.0 },
        { state: "Retén", duration: 4, scale: 1.0, bgGlow: 1.0 }
      ],
      deep: [
        { state: "Inhala", duration: 4, scale: 1.5, bgGlow: 1.8 },
        { state: "Retén", duration: 2, scale: 1.5, bgGlow: 1.5 },
        { state: "Exhala", duration: 6, scale: 1.0, bgGlow: 1.0 },
        { state: "Retén", duration: 2, scale: 1.0, bgGlow: 1.0 }
      ]
    };
    
    this.currentStep = 0;
    this.secondsLeft = 0;
    this.timerInterval = null;
  }

  connectedCallback() {
    this.render();
    this.setupListeners();
    this.resetGuide();
  }

  render() {
    this.innerHTML = `
      <div class="breathing-settings">
        <button type="button" class="breath-mode-btn active" data-mode="box">Calma Rápida (4-4-4-4)</button>
        <button type="button" class="breath-mode-btn" data-mode="deep">Alivio Profundo (4-2-6-2)</button>
      </div>

      <div class="breathing-stage" style="cursor: pointer;">
        <svg class="breathing-svg" width="220" height="220" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="bubble-grad" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stop-color="#f5c7b3" />
              <stop offset="65%" stop-color="#d68d71" />
              <stop offset="100%" stop-color="#a86244" />
            </radialGradient>
            <filter id="soft-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="7" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          <!-- Ripple Waves (pulsing) -->
          <circle class="svg-ripple ripple-1" cx="100" cy="100" r="50" fill="none" stroke="#d68d71" stroke-width="1.5" opacity="0" />
          <circle class="svg-ripple ripple-2" cx="100" cy="100" r="50" fill="none" stroke="#d68d71" stroke-width="1.5" opacity="0" />
          <circle class="svg-ripple ripple-3" cx="100" cy="100" r="50" fill="none" stroke="#d68d71" stroke-width="1.5" opacity="0" />
          
          <!-- Outer Pulsing Glow -->
          <circle id="circle-outer" cx="100" cy="100" r="56" fill="#d68d71" opacity="0.06" />
          
          <!-- Main Bubble -->
          <g id="circle-main-group" filter="url(#soft-glow)">
            <circle id="circle-main" cx="100" cy="100" r="50" fill="url(#bubble-grad)" />
            <circle cx="100" cy="100" r="49" fill="none" stroke="rgba(255, 255, 255, 0.3)" stroke-width="0.75" />
          </g>
        </svg>
        <span class="breath-action-text" id="action-text">Iniciar</span>
      </div>

      <div class="breath-timer" id="timer-text">Respira a tu propio ritmo</div>

      <button type="button" class="btn" id="start-btn" style="padding:0.75rem 2rem;">Comenzar Sesión</button>
    `;
  }

  setupListeners() {
    const startBtn = this.querySelector("#start-btn");
    const modeBtns = this.querySelectorAll(".breath-mode-btn");
    const stage = this.querySelector(".breathing-stage");

    startBtn.addEventListener("click", () => {
      if (this.isActive) {
        this.pauseGuide();
      } else {
        this.startGuide();
      }
    });

    stage.addEventListener("click", () => {
      if (this.isActive) {
        this.pauseGuide();
      } else {
        this.startGuide();
      }
    });

    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (this.isActive) {
          this.pauseGuide();
        }
        modeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.currentMode = btn.dataset.mode;
        this.resetGuide();
      });
    });
  }

  resetGuide() {
    this.isActive = false;
    this.currentStep = 0;
    
    const steps = this.modes[this.currentMode];
    this.secondsLeft = steps[0].duration;

    this.querySelector("#action-text").textContent = "Iniciar";
    this.querySelector("#timer-text").textContent = "Presiona para comenzar el ciclo";
    this.querySelector("#start-btn").textContent = "Comenzar Sesión";

    gsap.killTweensOf(["#circle-main-group", "#circle-outer", ".svg-ripple"]);
    gsap.to("#circle-main-group", { scale: 1, duration: 0.5, transformOrigin: "100px 100px", ease: "power1.out" });
    gsap.to("#circle-outer", { scale: 1, opacity: 0.06, duration: 0.5, transformOrigin: "100px 100px", ease: "power1.out" });
    gsap.to(".svg-ripple", { opacity: 0, duration: 0.5 });
  }

  startGuide() {
    this.isActive = true;
    this.querySelector("#start-btn").textContent = "Pausar Sesión";
    this.runStep();
  }

  pauseGuide() {
    this.isActive = false;
    clearInterval(this.timerInterval);
    this.querySelector("#start-btn").textContent = "Reanudar Sesión";
    this.querySelector("#action-text").textContent = "Pausa";
    
    gsap.killTweensOf(["#circle-main-group", "#circle-outer", ".svg-ripple"]);
    gsap.to(".svg-ripple", { opacity: 0, duration: 0.5 });
  }

  runStep() {
    if (!this.isActive) return;

    const steps = this.modes[this.currentMode];
    const currentStepData = steps[this.currentStep];
    this.secondsLeft = currentStepData.duration;

    const actionText = this.querySelector("#action-text");
    const timerText = this.querySelector("#timer-text");

    actionText.textContent = currentStepData.state;
    timerText.textContent = `${this.secondsLeft} segundos restantes`;

    // Scale main breathing bubble
    gsap.killTweensOf(["#circle-main-group", "#circle-outer", ".svg-ripple"]);
    
    gsap.to("#circle-main-group", {
      scale: currentStepData.scale,
      duration: currentStepData.duration,
      transformOrigin: "100px 100px",
      ease: "sine.inOut"
    });

    // Animate outer background halo for visual resonance
    gsap.to("#circle-outer", {
      scale: currentStepData.bgGlow,
      opacity: currentStepData.state === "Inhala" ? 0.12 : 0.04,
      duration: currentStepData.duration,
      transformOrigin: "100px 100px",
      ease: "sine.inOut"
    });

    // Animate ripples
    if (currentStepData.state === "Inhala") {
      gsap.fromTo(".svg-ripple", 
        { scale: 1, opacity: 0.6 },
        {
          scale: 1.9,
          opacity: 0,
          duration: currentStepData.duration,
          stagger: currentStepData.duration / 3,
          transformOrigin: "100px 100px",
          ease: "power1.out",
          overwrite: "auto"
        }
      );
    } else if (currentStepData.state === "Exhala") {
      gsap.fromTo(".svg-ripple",
        { scale: 1.9, opacity: 0 },
        {
          scale: 1,
          opacity: 0.4,
          duration: currentStepData.duration,
          stagger: { each: currentStepData.duration / 3, from: "end" },
          transformOrigin: "100px 100px",
          ease: "power1.inOut",
          overwrite: "auto"
        }
      );
    } else {
      gsap.to(".svg-ripple", { opacity: 0, duration: 0.5 });
    }

    // Start ticking timer
    clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      this.secondsLeft--;
      if (this.secondsLeft <= 0) {
        clearInterval(this.timerInterval);
        // Advance to next step
        this.currentStep = (this.currentStep + 1) % steps.length;
        this.runStep();
      } else {
        timerText.textContent = `${this.secondsLeft} segundos restantes`;
      }
    }, 1000);
  }

  disconnectedCallback() {
    clearInterval(this.timerInterval);
  }
}

customElements.define("breathing-guide", BreathingGuide);
