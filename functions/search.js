import {
  getContinualEventsParticipants,
  getContinualEventsWithPrizes,
  getContinualEventsAverageRatingByDivision,
  getContinualEventsDiffRating,
  getAllEventsID,
  getAllEventsDetails,
  clearTable, 
  createClickableRow,
  fillEmptyRows, 
  updateStatCards,
  updateEventDateRange, 
  updatePastEventsList,
  initPagination,
  getPaginationInfo,
  getCurrentPageData,
  updatePaginationInfo,
  updatePaginationControls,
  processTierData } from "./functions/index.js";

let allData = [];
let originalData = []; // Store original unfiltered data
let selectedEvent;
let continualId;

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               LOAD DATA
//
// --------------------------------------------------------------------------------------------------------------------------

(async function processAllEventsData() {
    console.log('Starting to load data...');
    
    try {
        const allEventsId = await getAllEventsID();
        const allEventsDetails = await getAllEventsDetails();
        
        console.log('Events ID loaded:', allEventsId.length);
        console.log('Events Details loaded:', allEventsDetails.length);
        
        const allEventsData = [];
        
        allEventsDetails.forEach(event => {
            const newId = allEventsId.find(e => e.pdga_event_id === event.pdga_event_id)?.id || null;
            const newName = allEventsId.find(e => e.pdga_event_id === event.pdga_event_id)?.name || null;
            allEventsData.push({
                ...event,
                id: newId,
                name: newName
            });
        });

        // Sort all events by date (newest first)
        const sortedAllEvents = allEventsData.sort((a, b) => {
            const dateA = new Date(a.start_date);
            const dateB = new Date(b.start_date);
            return dateB - dateA;
        });

        originalData = sortedAllEvents; // Store original data
        allData = sortedAllEvents;
        
        console.log('Data loaded successfully:', allData.length, 'total events');
        
        // Get search query from URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('q');
        
        console.log('Search query from URL:', searchQuery);
        
        if (searchQuery && searchQuery.trim() !== '') {
            // Display search query in header
            const searchQueryDisplay = document.getElementById('searchQueryDisplay');
            if (searchQueryDisplay) {
                searchQueryDisplay.textContent = searchQuery;
                console.log('Updated search query display');
            } else {
                console.error('searchQueryDisplay element not found');
            }
            
            // Fill the search input with the current query
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.value = searchQuery;
                console.log('Updated search input value');
            } else {
                console.error('searchInput element not found');
            }
            
            // Perform search
            performSearch(searchQuery);
        } else {
            console.log('No search query, redirecting to index.html');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error loading data:', error);
    }
})();

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               SEARCH FUNCTIONALITY
//
// --------------------------------------------------------------------------------------------------------------------------

const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');

// Handle search form submission
if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        console.log('Search form submitted with query:', query);
        if (query) {
            // Reload page with new search query
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    });
    console.log('Search form listener attached');
} else {
    console.error('Search form or input not found');
}

function performSearch(query) {
    console.log('=== performSearch called ===');
    console.log('Query:', query);
    console.log('Original data length:', originalData.length);
    
    if (!originalData || originalData.length === 0) {
        console.error('No data available to search');
        return;
    }
    
    // Filter the data based on the query
    const filteredData = originalData.filter(event => {
        const searchQuery = query.toLowerCase();
        return (
            (event.name && event.name.toLowerCase().includes(searchQuery)) ||
            (event.event_name && event.event_name.toLowerCase().includes(searchQuery)) ||
            (event.city && event.city.toLowerCase().includes(searchQuery)) ||
            (event.state && event.state.toLowerCase().includes(searchQuery)) ||
            (event.country && event.country.toLowerCase().includes(searchQuery)) ||
            (event.tier && event.tier.toLowerCase().includes(searchQuery))
        );
    });
    
    console.log(`Search results for "${query}":`, filteredData.length, 'events');
    
    // Update total results display
    const totalResults = document.getElementById('totalResults');
    if (totalResults) {
        totalResults.textContent = filteredData.length;
        console.log('Updated total results display');
    } else {
        console.error('totalResults element not found');
    }
    
    // Update allData with filtered results
    allData = filteredData;
    console.log('Updated allData with filtered results');
    
    // Initialize pagination with filtered data (pageSize is 10 by default in pagination.js)
    console.log('Calling initPagination...');
    initPagination(allData, renderTable);
    
    // renderTable is called automatically by initPagination, no need to call it again
}

// Back to events button
const backToEvents = document.getElementById('backToEvents');
if (backToEvents) {
    backToEvents.addEventListener('click', () => {
        console.log('Back to events clicked');
        window.location.href = 'index.html';
    });
    console.log('Back to events listener attached');
} else {
    console.error('backToEvents button not found');
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               RENDER TABLE
//
// --------------------------------------------------------------------------------------------------------------------------

function renderTable() {
    console.log('=== renderTable called ===');
    
    const tableBody = document.getElementById('resultsTableBody');
    
    if (!tableBody) {
        console.error('Table body not found!');
        return;
    }
    
    console.log('Table body found');
    console.log('allData length:', allData.length);
    
    const { currentPage, pageSize, totalItems } = getPaginationInfo();
    console.log('Current page:', currentPage);
    console.log('Page size:', pageSize);
    console.log('Total items in pagination:', totalItems);
    
    // getCurrentPageData returns an object with {data, startIndex, endIndex}
    const pageDataObj = getCurrentPageData();
    const currentPageData = pageDataObj.data;
    console.log('Current page data length:', currentPageData.length);

    // Clear existing rows - make sure table is completely empty
    tableBody.innerHTML = '';
    console.log('Table cleared');

    // Check if we have data to display
    if (allData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; font-size: 16px;">
                No results found for your search. Try different keywords.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No results message added');
        return;
    }

    if (currentPageData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 20px; font-size: 16px;">
                No data for current page.
            </td>
        `;
        tableBody.appendChild(row);
        console.log('No data for page message added');
        return;
    }

    // Add rows for current page
    currentPageData.forEach((item, index) => {
        console.log(`Processing item ${index}:`, item.name);
        
        const processedItem = processTierData(item);
        
        const row = document.createElement('tr');
        row.style.cursor = 'pointer';
        row.innerHTML = `
            <td>${processedItem.name || 'N/A'}</td>
            <td>${processedItem.start_date || 'N/A'}</td>
            <td><span class="tier-badge ${processedItem.tierCode || ''}">${processedItem.tier || 'N/A'}</span></td>
            <td>${processedItem.city || 'N/A'}</td>
            <td>${processedItem.state || 'N/A'}</td>
            <td>${processedItem.country || 'N/A'}</td>
        `;
        
        row.addEventListener('click', () => {
            selectedEvent = processedItem;
            continualId = processedItem.id;
            console.log('Event clicked:', processedItem.name);
        });
        
        tableBody.appendChild(row);
    });

    console.log(`Added ${currentPageData.length} rows to table`);

    // Fill empty rows if needed
    fillEmptyRows(tableBody, currentPageData.length, pageSize);
    console.log('Empty rows filled');

    // Update pagination
    updatePaginationInfo();
    console.log('Pagination info updated');
    
    updatePaginationControls(allData, renderTable);
    console.log('Pagination controls updated');
    
    console.log('=== renderTable complete ===');
}