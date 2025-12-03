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
        
        // Store the ID in the DOM in case you need it later (e.g., for a click event)
        card.dataset.id = dog.id; 

        // DATA CLEANING:
        // 1. Remove the leading asterisk from names like "*Johnny"
        // 2. Handle missing names if any
        const cleanName = dog.name ? dog.name.replace(/^\*/, '') : 'Unknown';

        card.innerHTML = `
            <img src="${dog.image}" alt="${cleanName}">
            <div class="card-content">
                <h2>${cleanName}</h2>
                <p><strong>Breed:</strong> ${dog.breed}</p>
                <p><strong>Color:</strong> ${dog.color}</p> <div class="tags">
                    <span class="tag">${dog.age}</span>
                    <span class="tag">${dog.sex}</span>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}