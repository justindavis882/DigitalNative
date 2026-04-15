document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('app-search');
    const appCards = document.querySelectorAll('.app-card');
    const categoryBtns = document.querySelectorAll('.category-btn');

    // Search Bar Filtering
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        appCards.forEach(card => {
            const title = card.querySelector('h3').innerText.toLowerCase();
            const desc = card.querySelector('p').innerText.toLowerCase();
            
            if (title.includes(searchTerm) || desc.includes(searchTerm)) {
                card.style.display = 'flex';
            } else {
                card.style.display = 'none';
            }
        });
        
        // Reset category buttons when searching
        categoryBtns.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-filter="all"]').classList.add('active');
    });

    // Category Button Filtering
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Manage active state styling
            categoryBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Clear search bar
            searchInput.value = '';

            const filter = e.target.getAttribute('data-filter');

            appCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
});
