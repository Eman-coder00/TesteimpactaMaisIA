/**
 * Impacta Mais - Premium UI/UX Scripts
 * Handles Top Loading Bar and Smooth Entry
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Top Loading Bar Logic
    const loadingBar = document.createElement('div');
    loadingBar.id = 'top-loading-bar';
    document.body.appendChild(loadingBar);

    window.addEventListener('beforeunload', () => {
        loadingBar.style.width = '30%';
        setTimeout(() => {
            loadingBar.style.width = '70%';
        }, 150);
    });

    // 2. Smooth Entry for Sections
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-up');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('section, .project-card, .sidebar-card').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });
});
