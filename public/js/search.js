document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('projectSearch');
    const searchResults = document.getElementById('searchResults');
    let debounceTimer;

    if (!searchInput || !searchResults) return;

    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();

        if (query.length < 2) {
            searchResults.hidden = true;
            searchResults.innerHTML = '';
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`/api/search/global?q=${encodeURIComponent(query)}`);
                const items = await response.json();

                renderResults(items);
            } catch (error) {
                console.error('Erro na busca:', error);
            }
        }, 300);
    });

    function renderResults(items) {
        if (items.length === 0) {
            searchResults.innerHTML = '<div class="search-no-results">Nada encontrado.</div>';
        } else {
            searchResults.innerHTML = items.map(item => {
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
        searchResults.hidden = false;
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.hidden = true;
        }
    });

    // Re-abrir ao focar se houver texto
    searchInput.addEventListener('focus', () => {
        if (searchInput.value.trim().length >= 2) {
            searchResults.hidden = false;
        }
    });
});
