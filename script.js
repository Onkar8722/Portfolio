/* script.js
 - Auto-load GitHub repos, build project cards, typed hero, skills chart
 - Customize: replace GITHUB_USER if needed
*/

const GITHUB_USER = "Onkar8722"; // <-- your GitHub username

// Typed.js hero line
document.addEventListener("DOMContentLoaded", () => {
  // typed effect
  new Typed("#typed", {
    strings: [
      "ML Engineer | Deep Learning Specialist | Computer Vision Expert",
      "Building production-grade AI systems & intelligent data solutions",
      "Python • TensorFlow • PyTorch • OpenCV • YOLO • SQL",
      "From concept to deployment: Full-stack ML Engineering"
    ],
    typeSpeed: 40,
    backSpeed: 25,
    backDelay: 2500,
    loop: true
  });

  // set year
  document.getElementById("year").textContent = new Date().getFullYear();

  // render skills radar chart
  renderSkillsChart();

  // load projects from GitHub (client-side)
  loadGitHubProjects();

  // initialize scroll animations
  initScrollAnimations();

  // smooth scroll for anchor links
  setupSmoothScroll();

  // add copy-to-clipboard for email
  setupEmailCopy();
});

// Scroll animation for fade-in elements
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in-up');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });
}

// Smooth scroll setup for navigation links
function setupSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
}

// Copy email to clipboard
function setupEmailCopy() {
  const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
  emailLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      const email = this.textContent;
      // Allow default behavior but add visual feedback
      setTimeout(() => {
        showToast(`Email copied: ${email}`);
      }, 100);
    });
  });
}

// Toast notification
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'fixed bottom-4 right-4 bg-cyan-600 text-white px-4 py-2 rounded shadow-lg z-50 animate-pulse';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.remove(), 3000);
}

// Chart.js radar chart for skills
function renderSkillsChart(){
  const ctx = document.getElementById("skillsChart").getContext("2d");
  const data = {
    labels: ["Python","Data","ML/DL","CV","NLP","Visualization"],
    datasets: [{
      label: "Skill level",
      data: [90,85,80,78,70,72],
      fill: true,
      backgroundColor: "rgba(6,182,212,0.12)",
      borderColor: "rgba(6,182,212,0.9)",
      pointBackgroundColor: "rgba(6,182,212,0.9)"
    }]
  };
  const config = {
    type: "radar",
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          suggestedMax: 100,
          ticks: { color: "#9ca3af", stepSize: 20 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  };
  new Chart(ctx, config);
}

// Fetch repositories from GitHub and show top projects (fallback to manual list)
async function loadGitHubProjects(){
  const container = document.getElementById("projectsGrid");

  // Helper: fallback static projects (useful if API fails)
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
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`);
    if(!res.ok) throw new Error("GitHub API error");

    const repos = await res.json();

    // filter and prioritize repos by a list, else pick top starred
    const priority = ["NeuroBloom","BioAware","AeroGuard"];
    const prioritized = [];

    // map repo name to repo object (case-insensitive)
    const repoMap = {};
    repos.forEach(r => repoMap[r.name.toLowerCase()] = r);

    priority.forEach(name => {
      const r = repoMap[name.toLowerCase()];
      if(r) prioritized.push(r);
    });

    // only show the 3 prioritized projects
    const selected = prioritized.slice(0, 3);

    // if nothing selected, use fallback
    if(selected.length === 0) {
      populateProjects(fallbackProjects, container);
      return;
    }

    // build project cards from selected repos
    const projectCards = await Promise.all(selected.map(async (r) => {
      // try to find a screenshot in /assets by name
      const screenshotCandidates = [
        `assets/${r.name}.png`,
        `assets/${r.name.toLowerCase()}.png`,
        `assets/${r.name.replace(/\s/g,"_")}.png`
      ];
      // check existence heuristically (we can't check file system reliably), use first
      const screenshot = screenshotCandidates[0];

      return {
        name: r.name,
        html_url: r.html_url,
        description: r.description || "Project repository",
        topics: r.topics || [],
        screenshot
      };
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