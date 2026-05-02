document.addEventListener('DOMContentLoaded', () => {
    // Função genérica para configurar busca
    function setupSearch(inputElement, resultsElement) {
        if (!inputElement || !resultsElement) return;

        let debounceTimer;

        inputElement.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            const query = e.target.value.trim();

            if (query.length < 2) {
                resultsElement.hidden = true;
                resultsElement.innerHTML = '';
                return;
            }

            debounceTimer = setTimeout(async () => {
                try {
                    const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
                    const items = await response.json();
                    renderResults(items, resultsElement);
                } catch (error) {
                    console.error('Erro na busca:', error);
                }
            }, 300);
        });

        // Fechar dropdown ao clicar fora
        document.addEventListener('click', (e) => {
            if (!inputElement.contains(e.target) && !resultsElement.contains(e.target)) {
                resultsElement.hidden = true;
            }
        });

        // Re-abrir ao focar se houver texto
        inputElement.addEventListener('focus', () => {
            if (inputElement.value.trim().length >= 2) {
                resultsElement.hidden = false;
            }
        });
    }

    function renderResults(items, resultsElement) {
        if (items.length === 0) {
            resultsElement.innerHTML = '<div class="search-no-results">Nada encontrado.</div>';
        } else {
            resultsElement.innerHTML = items.map(item => {
                const link = item.type === 'projeto' ? `/projeto?id=${item.slug}` : `/usuario/${item.id}`;
                const thumb = item.image ? 
                    `<img src="${item.image}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">` :
                    `<div style="width: 32px; height: 32px; border-radius: 50%; background: var(--emerald-500); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${item.title.charAt(0)}</div>`;

                return `
                    <a href="${link}" class="search-result-item" style="flex-direction: row; align-items: center; gap: 0.75rem;">
                        ${thumb}
                        <div style="display: flex; flex-direction: column;">
                            <span class="res-category" style="font-size: 0.65rem;">${item.category}</span>
                            <span class="res-title">${item.title}</span>
                        </div>
                    </a>
                `;
            }).join('');
        }
        resultsElement.hidden = false;
    }

    // Configura a busca da Navbar
    const navInput = document.getElementById('projectSearch');
    const navResults = document.getElementById('searchResults');
    setupSearch(navInput, navResults);

    // Configura a busca Flutuante
    const floatInput = document.getElementById('floatingSearchInput');
    const floatResults = document.getElementById('floatingSearchResults');
    setupSearch(floatInput, floatResults);
});
