// REPLACE THIS URL with your actual Cloud Run Function URL
const API_URL = "http://localhost:8080"; 

// Grab all DOM elements
const searchInput = document.getElementById('breed-search');
const sexFilter = document.getElementById('sex-filter');
const ageMinInput = document.getElementById('age-min');
const ageMaxInput = document.getElementById('age-max');
const searchBtn = document.getElementById('search-btn');
const resultsContainer = document.getElementById('results-container');

// Fetch dogs on load
document.addEventListener('DOMContentLoaded', () => {
    fetchDogs();
});

// Event Listeners for automatic filtering
const inputs = [searchInput, sexFilter, ageMinInput, ageMaxInput];
let timeout = null;

inputs.forEach(input => {
    input.addEventListener('input', () => {
        // Debounce: Wait 400ms after user stops typing/selecting
        clearTimeout(timeout);
        timeout = setTimeout(fetchDogs, 400);
    });
});

// Search Button
searchBtn.addEventListener('click', fetchDogs);

// Fetch Dogs
async function fetchDogs() {
    try {
        const url = new URL(API_URL);
        
        // 1. Get values from inputs
        const breed = searchInput.value;
        const sex = sexFilter.value;
        const ageMin = ageMinInput.value;
        const ageMax = ageMaxInput.value;

        // 2. Append params ONLY if they have values
        // This matches the logic in main.py which checks "if args.get(...)"
        if (breed) url.searchParams.append('breed', breed);
        if (sex) url.searchParams.append('sex', sex);
        if (ageMin) url.searchParams.append('age_year_min', ageMin);
        if (ageMax) url.searchParams.append('age_year_max', ageMax);

        // Visual feedback
        resultsContainer.innerHTML = '<p class="loading-text">Searching...</p>';

        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const dogs = await response.json();
        renderDogs(dogs);

    } catch (error) {
        console.error("Error fetching data:", error);
        resultsContainer.innerHTML = '<p>Error loading data. Please try again later.</p>';
    }
}


// Render Dogs
function renderDogs(dogs) {
    resultsContainer.innerHTML = '';

    if (dogs.length === 0) {
        resultsContainer.innerHTML = '<p>No dogs found matching those filters.</p>';
        return;
    }

    dogs.forEach(dog => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = dog.id; 

        // Sanitize name
        const cleanName = dog.name ? dog.name.replace(/^\*/, '') : 'Unknown';

        card.innerHTML = `
            <img src="${dog.image}" alt="${cleanName}">
            <div class="card-content">
                <h2>${cleanName}</h2>
                <p><strong>Breed:</strong> ${dog.breed}</p>
                <p><strong>Color:</strong> ${dog.color}</p> 
                <div class="tags">
                    <span class="tag">${dog.age}</span>
                    <span class="tag">${dog.sex}</span>
                </div>
            </div>
        `;
        resultsContainer.appendChild(card);
    });
}