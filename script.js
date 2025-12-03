// --- 1. THEME TOGGLING SETUP ---
const body = document.body;
(function initializeTheme() {
    const isDarkMode = localStorage.getItem('theme') === 'dark';
    if (isDarkMode) body.classList.add('dark');
})();

// --- 2. ABOUT MODAL LOGIC ---
const aboutModal = document.getElementById('about-modal');
function toggleAboutModal() {
    if (aboutModal.classList.contains('active')) {
        aboutModal.classList.remove('active');
        document.body.style.overflow = '';
    } else {
        aboutModal.classList.add('active'); 
        document.body.style.overflow = 'hidden'; 
    }
}
window.toggleAboutModal = toggleAboutModal;

// Instant modal initialization
(function initializeAboutModalInstantly() {
    if (!localStorage.getItem('hasVisited')) {
        setTimeout(() => {
            aboutModal.classList.add('active'); 
            document.body.style.overflow = 'hidden';
            localStorage.setItem('hasVisited', 'true');
        }, 100); 
    }
})();

// --- 3. RUNTIME INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    document.getElementById('current-year').textContent = new Date().getFullYear();

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    function updateThemeToggleIcon(isDark) {
        themeToggle.innerHTML = isDark 
            ? '<i data-lucide="sun" class="w-3 h-3 inline mr-1"></i>Light' 
            : '<i data-lucide="moon" class="w-3 h-3 inline mr-1"></i>Theme';
        lucide.createIcons();
        const computedStyle = getComputedStyle(document.body);
        themeToggle.style.backgroundColor = computedStyle.getPropertyValue('--color-soft-button-bg');
        themeToggle.style.color = computedStyle.getPropertyValue('--color-soft-button-text');
        themeToggle.style.borderColor = computedStyle.getPropertyValue('--color-border');
    }
    updateThemeToggleIcon(body.classList.contains('dark'));
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('dark');
        const isDark = body.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateThemeToggleIcon(isDark);
    });
    
    // Mobile Menu
    const mobileMenu = document.getElementById('mobile-menu');
    function toggleMobileMenu() {
        mobileMenu.classList.toggle('opacity-0');
        mobileMenu.classList.toggle('pointer-events-none');
    }
    window.toggleMobileMenu = toggleMobileMenu;
    document.getElementById('mobile-menu-btn').addEventListener('click', toggleMobileMenu);
    document.getElementById('mobile-close').addEventListener('click', toggleMobileMenu);

    // Feature Modal
    const featureModal = document.getElementById('feature-modal');
    const fTitle = document.getElementById('feature-title');
    const fBody = document.getElementById('feature-body');
    const fLink = document.getElementById('feature-link');
    window.showFeatureInfo = (title, bodyText, linkUrl) => {
        fTitle.textContent = title;
        fBody.textContent = bodyText;
        fLink.href = linkUrl;
        featureModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    window.closeFeatureInfo = () => {
        featureModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Keydown Listener
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (aboutModal.classList.contains('active')) toggleAboutModal();
            if (featureModal.classList.contains('active')) closeFeatureInfo();
            const emailChoiceModal = document.getElementById('email-choice-modal');
            if (emailChoiceModal && emailChoiceModal.classList.contains('active')) closeEmailChoiceModal();
            const resumeModal = document.getElementById('resume-modal');
            if (resumeModal && resumeModal.classList.contains('active')) closeResumeModal();
            const successModal = document.getElementById('success-modal');
            if (successModal && successModal.classList.contains('active')) closeSuccessModal();
        }
    });

    // --- DATABASE & SUCCESS MODAL CONNECTION ---
    document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault(); 
        const submitBtn = document.getElementById('submitBtn');
        
        // UI Feedback
        submitBtn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin inline mr-2"></i> TRANSMITTING...';
        lucide.createIcons();
        submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            mobile: document.getElementById('mobile').value,
            message: document.getElementById('message').value
        };

        try {
            const response = await fetch('http://localhost:5000/submit-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.success) {
                // Success! Show new modal
                openSuccessModal();
                document.getElementById('contactForm').reset();
            } else {
                throw new Error('Server rejected protocol.');
            }

        } catch (error) {
            console.error('Error:', error);
            alert("CONNECTION FAILED: SERVER OFFLINE. Please check console.");
        } finally {
            submitBtn.innerHTML = 'SEND SIGNAL (ENCRYPTED)';
            submitBtn.disabled = false;
        }
    });
});

// --- MODAL HELPERS ---

// Success Modal
function openSuccessModal() {
    const successModal = document.getElementById('success-modal');
    successModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
function closeSuccessModal() {
    const successModal = document.getElementById('success-modal');
    successModal.classList.remove('active');
    document.body.style.overflow = '';
}
window.closeSuccessModal = closeSuccessModal; // Global access

// Email Choice Modal
const emailChoiceModal = document.getElementById('email-choice-modal');
window.openEmailChoiceModal = function() {
    emailChoiceModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}
window.closeEmailChoiceModal = function() {
    emailChoiceModal.classList.remove('active');
    document.body.style.overflow = '';
}

// Resume Modal
const resumeModal = document.getElementById('resume-modal');
window.openResumeModal = function() {
    resumeModal.classList.add('active');
    resumeModal.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}
window.closeResumeModal = function() {
    resumeModal.classList.remove('active');
    resumeModal.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
}

// --- PARTICLE SYSTEM ---
const canvas = document.getElementById('about-particles');
const ctx = canvas.getContext('2d');
let particles = [];
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = 'rgba(255, 215, 0, 0.2)'; 
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
    }
    draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}
function initParticles() {
    for (let i = 0; i < 50; i++) particles.push(new Particle());
}
initParticles();
function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    requestAnimationFrame(animateParticles);
}
animateParticles();
