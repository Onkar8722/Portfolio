/* script.js - Optimized Portfolio Website
 - Auto-load GitHub repos, build project cards, typed hero, skills chart
 - Customize: replace GITHUB_USER if needed
*/

const GITHUB_USER = "Onkar8722";
const CACHE_KEY_GITHUB = 'github_projects_cache';
const CACHE_DURATION = 3600000; // 1 hour

// Cache DOM elements for performance
const cache = { elements: {} };
function getElement(selector) {
  if (!cache.elements[selector]) {
    cache.elements[selector] = document.querySelector(selector);
  }
  return cache.elements[selector];
}

// Utility: Debounce function for expensive operations
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Optimized DOMContentLoaded
document.addEventListener("DOMContentLoaded", () => {
  // Typed.js hero effect
  const typedElement = getElement("#typed");
  if (typedElement) {
    new Typed(typedElement, {
      strings: [
        "� ML Engineer | AI & Data Science Specialist",
        "Building Production-Grade ML Solutions • Computer Vision Expert",
        "Python • TensorFlow • PyTorch • OpenCV • YOLO • SQL • Flask",
        "Transforming Ideas into Intelligent Systems"
      ],
      typeSpeed: 40,
      backSpeed: 25,
      backDelay: 2500,
      loop: true
    });
  }

  // Set year
  const yearElement = getElement("#year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // Load projects from GitHub (with caching)
  loadGitHubProjects();

  // Initialize scroll animations
  initScrollAnimations();

  // Setup smooth scroll for anchor links
  setupSmoothScroll();

  // Setup email copy feedback
  setupEmailCopy();

  // Setup parallax (debounced for performance)
  if (window.innerWidth >= 1024) { // Only on desktop
    setupParallax();
  }

  // Setup optimized cursor glow (with debouncing)
  setupCursorGlow();

  // Setup card animations
  setupCardAnimations();

  // Initialize form and tracking features
  initializeEnhancements();
});

// Optimized scroll animation for fade-in elements
function initScrollAnimations() {
  const options = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px' // Start animation slightly before element is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, options);

  // Only observe sections (not every element for performance)
  document.querySelectorAll('section:not(.hero-section)').forEach(section => {
    observer.observe(section);
  });
}

// Smooth scroll setup with event delegation
function setupSmoothScroll() {
  document.addEventListener('click', (e) => {
    const anchor = e.target.closest('a[href^="#"]');
    if (!anchor) return;
    
    const href = anchor.getAttribute('href');
    if (href === '#') return;
    
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

// Copy email to clipboard with event delegation
function setupEmailCopy() {
  document.addEventListener('click', (e) => {
    const emailLink = e.target.closest('a[href^="mailto:"]');
    if (!emailLink) return;
    
    const email = emailLink.textContent;
    setTimeout(() => {
      showToast(`Email copied: ${email}`, 'success');
    }, 100);
  }, { passive: true });
}

// Toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-cyan-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// Fetch repositories from GitHub with caching
async function loadGitHubProjects(){
  const container = getElement("#projectsGrid");
  if (!container) return;

  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY_GITHUB);
  if (cached) {
    const cacheData = JSON.parse(cached);
    if (Date.now() - cacheData.timestamp < CACHE_DURATION) {
      populateProjects(cacheData.projects, container);
      return;
    }
  }

  // Fallback projects
  const fallbackProjects = [
    {
      name: "NeuroBloom",
      html_url: "https://github.com/Onkar8722/NeuroBloom",
      description: "Advanced learning disability detection using CNN, ANN & NLP. Achieves 94% accuracy in identifying cognitive challenges from behavioral and linguistic patterns.",
      topics: ["deep-learning","healthcare","ml"],
      screenshot: "assets/neurobloom.png"
    },
    {
      name: "BioAware",
      html_url: "https://github.com/Onkar8722/BioAware",
      description: "Real-time wildlife monitoring system using YOLO object detection & tracking algorithms. Predicts poaching threats with 92% accuracy for conservation efforts.",
      topics: ["computer-vision","yolo","tracking"],
      screenshot: "assets/bioaware.png"
    },
    {
      name: "AeroGuard",
      html_url: "https://github.com/Onkar8722/AeroGuard",
      description: "Intelligent aerial surveillance platform using deep CNN models for real-time threat detection. Deployment-ready system with optimized inference pipeline.",
      topics: ["cnn","detection","deployment"],
      screenshot: "assets/aeroguard.png"
    }
  ];

  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`, {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    if(!res.ok) throw new Error("GitHub API error");

    const repos = await res.json();
    const priority = ["NeuroBloom","BioAware","AeroGuard"];
    const prioritized = [];
    const repoMap = {};
    
    repos.forEach(r => repoMap[r.name.toLowerCase()] = r);
    priority.forEach(name => {
      const r = repoMap[name.toLowerCase()];
      if(r) prioritized.push(r);
    });

    const selected = prioritized.slice(0, 3);
    if(selected.length === 0) throw new Error("No projects found");

    const projectCards = selected.map(r => ({
      name: r.name,
      html_url: r.html_url,
      description: r.description || "Project repository",
      topics: r.topics || [],
      screenshot: `assets/${r.name.toLowerCase()}.png`
    }));

    // Cache the projects
    localStorage.setItem(CACHE_KEY_GITHUB, JSON.stringify({
      projects: projectCards,
      timestamp: Date.now()
    }));

    populateProjects(projectCards, container);
  } catch (err) {
    console.warn("GitHub fetch failed, using fallback projects", err);
    populateProjects(fallbackProjects, container);
  }
}

function populateProjects(projects, container){
  container.innerHTML = ""; // clear
  projects.forEach((p, index) => {
    const card = document.createElement("article");
    card.className = "project-card card-hover p-4 bg-[#0b0b0b] rounded-xl border border-slate-800";
    card.style.animationDelay = `${index * 0.1}s`;

    card.innerHTML = `
      <img loading="lazy" class="project-image" src="${p.screenshot || 'assets/placeholder.png'}" alt="${escapeHtml(p.name)} screenshot" onerror="this.onerror=null;this.src='assets/placeholder.png'"/>
      <h3 class="mt-3 font-semibold text-white">${escapeHtml(p.name)}</h3>
      <p class="mt-1 text-slate-300 text-sm">${escapeHtml(limitText(p.description || ''))}</p>
      <div class="mt-3 flex items-center justify-between">
        <div class="flex space-x-2">
          ${ (p.topics || []).slice(0,3).map(t => `<span class="skill-tag text-xs px-2 py-1 bg-slate-800 text-slate-300 rounded">${escapeHtml(t)}</span>`).join(" ") }
        </div>
        <div class="flex space-x-2">
          <a href="${p.html_url}" target="_blank" class="text-cyan-400 text-sm hover:text-cyan-300 transition">GitHub →</a>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// small helper to escape HTML
function escapeHtml(text){
  return String(text || "").replace(/[&<>"'`=\/]/g, function(s){
    return ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'
    })[s];
  });
}
function limitText(t, n=140){
  if(!t) return "";
  return t.length > n ? t.slice(0,n-1) + "…" : t;
}

// Optimized parallax scroll effect with debouncing
function setupParallax() {
  const header = getElement('header');
  const matrix = header ? header.querySelector('.matrix') : null;
  if (!matrix) return;

  const debouncedScroll = debounce(() => {
    const scrollY = window.pageYOffset;
    requestAnimationFrame(() => {
      matrix.style.transform = `translateY(${scrollY * 0.5}px)`;
    });
  }, 16); // ~60fps throttle

  window.addEventListener('scroll', debouncedScroll, { passive: true });
}

// Optimized cursor glow effect with debouncing and passive listeners
function setupCursorGlow() {
  const cards = document.querySelectorAll('.card-hover, .project-card');
  if (cards.length === 0) return;

  let lastX = 0, lastY = 0;
  
  // Debounced mouse move handler
  const debouncedMouseMove = debounce((e) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // Only update if mouse moved significantly to avoid excessive reflows
    if (Math.abs(x - lastX) < 5 && Math.abs(y - lastY) < 5) return;
    lastX = x;
    lastY = y;

    cards.forEach(el => {
      const rect = el.getBoundingClientRect();
      const elX = rect.left + rect.width / 2;
      const elY = rect.top + rect.height / 2;
      const distance = Math.sqrt((x - elX) ** 2 + (y - elY) ** 2);
      const maxDistance = 200;

      if (distance < maxDistance) {
        const intensity = (1 - distance / maxDistance) * 0.15;
        el.style.boxShadow = `0 0 ${30 + intensity * 20}px rgba(6, 182, 212, ${0.1 + intensity})`;
      } else {
        el.style.boxShadow = '';
      }
    });
  }, 16); // ~60fps throttle

  document.addEventListener('mousemove', debouncedMouseMove, { passive: true });
}

// Enhanced card animations with optimized selectors
function setupCardAnimations() {
  const cards = document.querySelectorAll('.card-hover, .project-card');
  
  cards.forEach((card, index) => {
    // Cache transform state to avoid repeated DOM reads
    let isHovering = false;
    
    card.addEventListener('mouseenter', () => {
      if (!isHovering) {
        isHovering = true;
        card.style.transform = 'translateY(-10px) scale(1.02)';
      }
    }, { passive: true });
    
    card.addEventListener('mouseleave', () => {
      if (isHovering) {
        isHovering = false;
        card.style.transform = 'translateY(0) scale(1)';
      }
    }, { passive: true });
  });
}

// ===== CONTACT FORM INTEGRATION =====
function setupContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('name')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const subject = document.getElementById('subject')?.value.trim();
    const message = document.getElementById('message')?.value.trim();

    // Validate
    if (!name || !email || !message) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Disable button during submission
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          subject: subject || 'Portfolio Contact',
          message
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('✓ Message sent successfully!', 'success');
        contactForm.reset();
      } else {
        showToast('Error: ' + (data.error || 'Failed to send message'), 'error');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      showToast('Connection error. Please try again later.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// ===== ENHANCED TOAST (with type) =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  
  // Color based on type
  let bgColor = 'bg-cyan-600';
  if (type === 'success') bgColor = 'bg-green-600';
  if (type === 'error') bgColor = 'bg-red-600';
  if (type === 'warning') bgColor = 'bg-yellow-600';

  toast.className = `fixed bottom-4 right-4 ${bgColor} text-white px-4 py-3 rounded shadow-lg z-50 animate-pulse max-w-sm`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ===== PROJECT VIEW TRACKING =====
function trackProjectView(projectName) {
  fetch(`/api/projects/${encodeURIComponent(projectName)}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }).catch(err => console.log('View tracking not available'));
}

// Add click handlers to project cards for tracking
function setupProjectTracking() {
  document.querySelectorAll('.project-card').forEach(card => {
    const projectName = card.querySelector('h3')?.textContent || 'unknown';
    card.addEventListener('click', () => trackProjectView(projectName));
  });
}

// ===== ADD TO INIT =====
// Call this at the end of DOMContentLoaded
function initializeEnhancements() {
  setupContactForm();
  setupProjectTracking();
  setupSkillBarAnimations();
}

// ===== SKILL BAR ANIMATIONS =====
function setupSkillBarAnimations() {
  const skillLevels = document.querySelectorAll('.skill-level');
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const skillBar = entry.target.querySelector('.skill-bar');
        if (skillBar && !entry.target.classList.contains('animated')) {
          // Trigger animation by resetting and reapplying
          const width = skillBar.style.width;
          skillBar.style.width = '0';
          skillBar.style.animation = 'none';
          
          // Trigger reflow to restart animation
          void skillBar.offsetWidth;
          skillBar.style.animation = '';
          skillBar.style.width = width;
          
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      }
    });
  }, { threshold: 0.3 });

  skillLevels.forEach((level, index) => {
    // Add staggered delay
    const skillBar = level.querySelector('.skill-bar');
    if (skillBar) {
      skillBar.style.animationDelay = `${index * 0.15}s`;
    }
    observer.observe(level);
  });
}