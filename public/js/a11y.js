(function() {
    console.log('[A11Y] Script inicializado');
    
    const a11yDefaults = {
        fontScale: 1,
        lineHeight: 1.5,
        letterSpacing: 'normal',
        highContrast: false,
        dyslexiaFont: false,
        colorFilter: 'none'
    };

    let settings = JSON.parse(localStorage.getItem('impacta_a11y_settings')) || { ...a11yDefaults };

    window.applySettings = function() {
        console.log('[A11Y] Aplicando:', settings);
        const root = document.documentElement;
        
        // Escala de fonte no HTML (afeta REMs)
        const scale = parseFloat(settings.fontScale) || 1;
        root.style.fontSize = (scale * 100) + '%';
        
        // Variáveis para CSS
        root.style.setProperty('--a11y-line-height', settings.lineHeight || 1.5);
        root.style.setProperty('--a11y-letter-spacing', settings.letterSpacing || 'normal');

        // Ativar classe de controle para espaçamentos
        const hasSpacing = settings.lineHeight !== '1.5' || settings.letterSpacing !== 'normal';
        document.body.classList.toggle('a11y-active', hasSpacing);

        // Classes no Body
        if (settings.dyslexiaFont === true || settings.dyslexiaFont === 'true') {
            document.body.classList.add('dyslexia-font');
        } else {
            document.body.classList.remove('dyslexia-font');
        }
        
        root.classList.remove('filter-protan', 'filter-deutan', 'filter-tritan');
        if (settings.colorFilter && settings.colorFilter !== 'none') {
            root.classList.add('filter-' + settings.colorFilter);
        }

        updateUI();
    };

    function updateUI() {
        document.querySelectorAll('.a11y-btn-font').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.value) === parseFloat(settings.fontScale));
        });
        document.querySelectorAll('.a11y-btn-line').forEach(btn => {
            btn.classList.toggle('active', parseFloat(btn.dataset.value) === parseFloat(settings.lineHeight));
        });
        document.querySelectorAll('.a11y-btn-spacing').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === settings.letterSpacing);
        });
        
        const dyslexiaToggle = document.getElementById('a11y-dyslexia-toggle');
        if (dyslexiaToggle) dyslexiaToggle.checked = (settings.dyslexiaFont === true || settings.dyslexiaFont === 'true');

        document.querySelectorAll('.a11y-btn-filter').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.value === settings.colorFilter);
        });
    }

    window.setA11ySetting = function(key, value) {
        console.log('[A11Y] Alterando', key, 'para', value);
        settings[key] = value;
        localStorage.setItem('impacta_a11y_settings', JSON.stringify(settings));
        window.applySettings();
    };

    window.resetA11ySettings = function() {
        settings = { ...a11yDefaults };
        localStorage.setItem('impacta_a11y_settings', JSON.stringify(settings));
        window.applySettings();
    };

    window.toggleA11yPanel = function() {
        const panel = document.getElementById('a11y-panel');
        if (panel) panel.classList.toggle('active');
    };

    // Auto-init
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.applySettings);
    } else {
        window.applySettings();
    }
})();
