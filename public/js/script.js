// Smooth Scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80, // Account for fixed header
                behavior: 'smooth'
            });
        }
    });
});

// Intersection Observer for animations on scroll
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

document.querySelectorAll('.animate-up').forEach(el => {
    // Initially remove class to re-trigger it with observer if needed, 
    // but the class is already used for CSS animation.
    // For a more robust "reveal on scroll", we can use a separate class.
    observer.observe(el);
});

// Newsletter Form Submission (Mock)
const newsletterForm = document.querySelector('.newsletter-form');
if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = newsletterForm.querySelector('input').value;
        alert(`Obrigado por se inscrever, ${email}! Em breve você receberá nossas novidades.`);
        newsletterForm.reset();
    });
}

// Navbar shadow on scroll
window.addEventListener('scroll', () => {
    const nav = document.querySelector('nav');
    if (window.scrollY > 50) {
        nav.style.boxShadow = 'var(--shadow-md)';
        nav.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    } else {
        nav.style.boxShadow = 'none';
        nav.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    }
});

// O detalhamento dos projetos agora é gerenciado pelo servidor (EJS/MongoDB).
// Removida lógica estática que causava redirecionamentos indevidos.


// Lógica Global de Likes via AJAX
document.addEventListener('click', async (e) => {
    const btn = e.target.closest('.btn-like-ajax');
    if (!btn) return;

    e.preventDefault();
    const projectId = btn.getAttribute('data-id');
    const heartIcon = btn.querySelector('.heart-icon') || btn.querySelector('svg') || btn.querySelector('i');
    const countSpan = btn.querySelector('.like-count') || btn.querySelector('#likeCountText');

    console.log('[LIKE] Iniciando requisição para:', projectId);

    try {
        const response = await fetch('/projeto/like', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ projectId })
        });

        if (response.status === 401) {
            console.warn('[LIKE] Usuário não logado');
            alert('Você precisa estar conectado para curtir um projeto! Redirecionando para login...');
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[LIKE] Erro no servidor:', response.status, errorText);
            return;
        }

        const data = await response.json();
        console.log('[LIKE] Resposta recebida:', data);

        if (data.success) {
            // Sincroniza o estado do botão
            if (data.hasLiked) {
                btn.classList.add('active');
                if (heartIcon) {
                    heartIcon.classList.add('heart-pop');
                    setTimeout(() => heartIcon.classList.remove('heart-pop'), 450);
                }
            } else {
                btn.classList.remove('active');
            }
            
            // Sincroniza o contador
            if (countSpan) {
                if (countSpan.id === 'likeCountText') {
                    const label = data.count === 1 ? 'Curtida' : 'Curtidas';
                    countSpan.textContent = `${data.count} ${label}`;
                } else {
                    countSpan.textContent = data.count;
                }
            }
        }
    } catch (err) {
        console.error('[LIKE] Erro crítico na requisição:', err);
        alert('Ocorreu um erro ao processar sua curtida. Verifique sua conexão.');
    }
});

// Lógica do Modal de Criação
document.addEventListener('DOMContentLoaded', () => {
    const initModal = () => {
        const btnOpen = document.getElementById('btnOpenCreateModal');
        const btnClose = document.getElementById('btnCloseModal');
        const modal = document.getElementById('createSelectionModal');

        if (btnOpen && modal) {
            btnOpen.onclick = (e) => {
                e.preventDefault();
                modal.hidden = false;
                document.body.style.overflow = 'hidden';
            };

            const closeModal = () => {
                modal.hidden = true;
                document.body.style.overflow = 'auto';
            };

            if (btnClose) {
                btnClose.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeModal();
                };
            }

            modal.onclick = (e) => {
                if (e.target === modal) closeModal();
            };

            document.onkeydown = (e) => {
                if (e.key === 'Escape' && !modal.hidden) closeModal();
            };
        }
    };

    initModal();
});
