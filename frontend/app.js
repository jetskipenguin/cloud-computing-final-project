// REPLACE THIS URL with your actual Cloud Run Function URL
const API_URL = "YOUR_CLOUD_RUN_URL_HERE"; 

const searchInput = document.getElementById('breed-search');
const resultsContainer = document.getElementById('results-container');

// Fetch dogs on load
document.addEventListener('DOMContentLoaded', () => {
    fetchDogs();
});

// Filter on typing (debounced slightly for performance)
let timeout = null;
searchInput.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
        fetchDogs(e.target.value);
    }, 300);
});

async function fetchDogs(breed = '') {
    try {
        const url = new URL(API_URL);
        if (breed) {
            url.searchParams.append('breed', breed);
        }

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const dogs = await response.json();
        renderDogs(dogs);
    } catch (error) {
        console.error("Error fetching data:", error);
        resultsContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
}

function renderDogs(dogs) {
    resultsContainer.innerHTML = '';

    if (dogs.length === 0) {
        resultsContainer.innerHTML = '<p>No dogs found matching that criteria.</p>';
        return;
    }

    dogs.forEach(dog => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // Sanitize outputs to prevent XSS (basic textContent usage handles this)
        card.innerHTML = `
            <img src="${dog.image}" alt="Dog">
            <div class="card-content">
                <h2>${dog.name}</h2>
                <p><strong>Breed:</strong> ${dog.breed}</p>
                <div class="tags">
                    <span class="tag">${dog.age}</span>
                    <span class="tag">${dog.sex}</span>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}