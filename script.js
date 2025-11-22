import {
  getAllEventsID,
  getAllEventsDetails,
  getParticipantsAndPrizesPerYearByPdgaEventIds,
  clearTable,
  createClickableRow,
  fillEmptyRows,
  relocatePaginationControls,
  activateBackToAllEventsBtn,
  initPagination,
  getPaginationInfo,
  getCurrentPageData,
  updatePaginationInfo,
  updatePaginationControls,
  processTierData,
  sortingEventsByDate,
  renderPastEventsTable,
  renderEventDetails,
  renderParticipantsTrend,
  renderPrizeMoneyAnalysis,
  renderAverageRatings,
  renderDiffRating,
  activateVizSelectionBtn,
  renderSelectedVizButton,
  getEventsResultByPdgaEventIds,
  getPlayersByPdgaNumbers,
  renderDivisionsWinner,
  sortDivisions,
  getUniqueEventDivisions,
  sortTiers,
} from "./functions/index.js";

const allEventsData = [];
let recentEventsList = [];
let selectedEvent;
let selectedEventsResult = [];
let pastEventsList = [];
let continualId;
const eventDivisionsMap = new Map();

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               Initialization Code
//
// --------------------------------------------------------------------------------------------------------------------------

(async () => {
  const [allEventsId, allEventsDetails] = await Promise.all([
    getAllEventsID(),
    getAllEventsDetails(),
  ]);

  // map all events with continualId
  allEventsDetails.forEach((event) => {
    // continualId = newId
    const newId =
      allEventsId.find((e) => e.pdga_event_id === event.pdga_event_id)?.id ||
      null;

    // name = eventgeneric name
    const newName =
      allEventsId.find((e) => e.pdga_event_id === event.pdga_event_id)?.name ||
      null;

    // process tier code
    const { tier, tierCode } = processTierData(event);

    // now assign to allEventsData
    allEventsData.push({
      ...event,
      id: newId,
      name: newName,
      tier: tier,
      tierCode: tierCode,
    });
  });

  // use reduce to get out only the lastest year of that continual event
  const latestEventsMap = allEventsData.reduce((accumulator, currentEvent) => {
    const currentId = currentEvent.id;
    if (
      !accumulator[currentId] ||
      currentEvent.year > accumulator[currentId].year
    ) {
      accumulator[currentId] = currentEvent;
    }
    return accumulator;
  }, {});

  // convert obj to array
  const latestEventsArray = Object.values(latestEventsMap);

  // sort by date
  const sortedLatestEvents = sortingEventsByDate(latestEventsArray);

  // assign to recentEventsList
  recentEventsList = sortedLatestEvents;

  // initialize pagination in recent events table
  initPagination(recentEventsList, renderTable);

  // Initialize filter functionality
  populateYearsFilter();
  populateDivisionsFilter();
  populateTiersFilter();
  populateCountriesFilter();
  initializeFilters();

  activateVizSelectionBtn();
  activateBackToAllEventsBtn();
})();

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               FILTER FUNCTIONALITY
//
// --------------------------------------------------------------------------------------------------------------------------

function populateOptions(selectElement, optionsArray, defaultOptionText) {
  // Clear existing options
  selectElement.innerHTML = `<option value="">${defaultOptionText}</option>`;

  optionsArray.forEach((item) => {
    if (item) {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      selectElement.appendChild(option);
    }
  });
}

// Populate year dropdown with unique years from allEventsData
function populateYearsFilter() {
  const yearSelect = document.getElementById("year");
  const uniqueYears = [
    ...new Set(allEventsData.map((event) => event.year)),
  ].sort((a, b) => b - a); // Sort descending

  // Add unique years to dropdown
  populateOptions(yearSelect, uniqueYears, "All Years");
}

// Populate tier dropdown with unique tier from allEventsData
function populateTiersFilter() {
  const tierSelect = document.getElementById("tier");
  const uniqueTiers = [
    ...new Set(sortTiers(allEventsData.map((event) => event.tier))),
  ];

  // Add unique years to dropdown
  populateOptions(tierSelect, uniqueTiers, "All Tiers");
}

// Populate country dropdown with unique countries from allEventsData
function populateCountriesFilter() {
  const countrySelect = document.getElementById("country");
  const uniqueCountries = [
    ...new Set(allEventsData.map((event) => event.country)),
  ].sort();

  // Add unique countries to dropdown
  populateOptions(countrySelect, uniqueCountries, "All Countries");
}

// Populate division dropdown with unique divisions from all events
async function populateDivisionsFilter() {
  const data = await getUniqueEventDivisions();

  const eventIdsContinualIdsMap = new Map()
  allEventsData.forEach(event => {
    if (!eventIdsContinualIdsMap.get(event.pdga_event_id)) {
      eventIdsContinualIdsMap.set(event.pdga_event_id, event.id)
    }
  });

  data.forEach(item => {
    const continualId = eventIdsContinualIdsMap.get(item.pdga_event_id)    
    const divisionsArray = eventDivisionsMap.get(continualId);
    if (!divisionsArray) {
      eventDivisionsMap.set(continualId, [])
    }
    if (divisionsArray && !divisionsArray.includes(item.division)) {
      eventDivisionsMap.get(continualId).push(item.division)
    }
  })

  // Get unique and sorted divisions
  const sortedDivisions = sortDivisions(
    [...new Set(data.map(item => item.division))]
  );

  const divisionSelect = document.getElementById("division");
  // Add unique countries to dropdown
  populateOptions(divisionSelect, sortedDivisions, "All Divisions");
}

// Filter events based on selected criteria
function filterEvents() {
  const yearSelect = document.getElementById("year");
  const divisionSelect = document.getElementById("division");
  const tierSelect = document.getElementById("tier");
  const countrySelect = document.getElementById("country");

  const selectedYear = yearSelect.value;
  const selectedDivision = divisionSelect.value;
  const selectedTier = tierSelect.value;
  const selectedCountry = countrySelect.value;

  let filteredEvents = [...recentEventsList];

  // Filter by year - check if the event was played in the selected year
  if (selectedYear && selectedYear !== "All Years") {
    filteredEvents = filteredEvents.filter((event) => {
      // For year filtering, we need to check if any event in the continual series was played in that year
      const continualEvents = allEventsData.filter((e) => e.id === event.id);
      return continualEvents.some((e) => e.year.toString() === selectedYear);
    });
  }

  // Filter by tier
  if (selectedTier && selectedTier !== "All Tiers") {
    filteredEvents = filteredEvents.filter((event) => {
      const processedEvent = processTierData({ ...event });
      return processedEvent.tier === selectedTier;
    });
  }

  // Filter by country
  if (selectedCountry && selectedCountry !== "All Countries") {
    filteredEvents = filteredEvents.filter(
      (event) => event.country === selectedCountry
    );
  }

  // Filter by division - check if any event in the continual series had that division
  if (selectedDivision && selectedDivision !== "All Divisions") {
    filteredEvents = filteredEvents.filter((event) => {
      const divisions = eventDivisionsMap.get(event.id)
      return divisions && divisions.includes(selectedDivision)
    });
  }

  // Update pagination with filtered data
  initPagination(filteredEvents, renderTable);
}

// Add event listeners for filter changes
function initializeFilters() {
  const yearSelect = document.getElementById("year");
  const divisionSelect = document.getElementById("division");
  const tierSelect = document.getElementById("tier");
  const countrySelect = document.getElementById("country");
  const clearFiltersBtn = document.getElementById("clearFilters");

  if (yearSelect) {
    yearSelect.addEventListener("change", filterEvents);
  }

  if (divisionSelect) {
    divisionSelect.addEventListener("change", filterEvents);
  }

  if (tierSelect) {
    tierSelect.addEventListener("change", filterEvents);
  }

  if (countrySelect) {
    countrySelect.addEventListener("change", filterEvents);
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", clearFilters);
  }
}

// Clear all filters and reset to show all events
function clearFilters() {
  const yearSelect = document.getElementById("year");
  const divisionSelect = document.getElementById("division");
  const tierSelect = document.getElementById("tier");
  const countrySelect = document.getElementById("country");

  if (yearSelect) yearSelect.value = "";
  if (divisionSelect) divisionSelect.value = "";
  if (tierSelect) tierSelect.value = "";
  if (countrySelect) countrySelect.value = "";

  // Reset to show all events
  initPagination(recentEventsList, renderTable);
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               SEARCH FUNCTIONALITY
//
// --------------------------------------------------------------------------------------------------------------------------

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");

// Handle search form submission (works on both pages)
if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    if (query) {
      // Redirect to search page with search query
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
  });
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               EVENT SELECTED HANDLER
//
// --------------------------------------------------------------------------------------------------------------------------

function renderEvent() {
  // processFilterEvent();
  renderEventDetails(selectedEvent, pastEventsList);
  renderDivisionsWinner(selectedEventsResult, pastEventsList);
  renderSelectedVizButton();
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               RENDER TABLE
//
// --------------------------------------------------------------------------------------------------------------------------

function renderTable() {
  const tableBody = document.getElementById("tableBody");
  const { data: pageData } = getCurrentPageData();
  const { pageSize } = getPaginationInfo();

  // Clear table
  clearTable("tableBody");

  // Add data rows
  pageData.forEach((item) => {
    const rowContent = `
      <td>${item.name}</td>
      <td>${item.start_date}</td>
      <td><span class="tier-badge ${item.tierCode}">${item.tier}</span></td>
      <td>${item.city}</td>
      <td>${item.state}</td>
      <td>${item.country}</td>
    `;

    // Add event listener to the row
    const row = createClickableRow(rowContent, async () => {
      // Assign selectedEvent
      selectedEvent = item;

      // Assign selectedEvent continualId
      continualId = item.id;

      // Get selectedEvent data from allEventsData
      const unsortedSelectedEvent = allEventsData.filter(
        (event) => event.id === continualId
      );

      // Gather all pdga_event_id for query additional data (players count and total prize)
      const pdgaEventIds = [];
      unsortedSelectedEvent.forEach((event) => {
        pdgaEventIds.push(event.pdga_event_id);
      });

      const [additionalData, eventsResult] = await Promise.all([
        getParticipantsAndPrizesPerYearByPdgaEventIds(pdgaEventIds),
        getEventsResultByPdgaEventIds(pdgaEventIds),
      ]);

      // Map to new array
      const newUnsortedSelectedEvent = [];
      unsortedSelectedEvent.forEach((event) => {
        const playersCount =
          additionalData.find((e) => e.pdga_event_id === event.pdga_event_id)
            ?.players_count || "N/A";
        const totalPrize =
          additionalData.find((e) => e.pdga_event_id === event.pdga_event_id)
            ?.total_prize || "N/A";
        newUnsortedSelectedEvent.push({
          ...event,
          players_count: playersCount,
          total_prize: totalPrize,
        });
      });
      pastEventsList = sortingEventsByDate(newUnsortedSelectedEvent);

      const pdgaNumbers = [];
      eventsResult.forEach((winner) => {
        winner.pdga_number && pdgaNumbers.push(winner.pdga_number);
      });

      const winnersData = await getPlayersByPdgaNumbers(pdgaNumbers);

      eventsResult.forEach((event) => {
        const player = winnersData.find(
          (p) => String(p.pdga_number) === String(event.pdga_number)
        );
        event.player_name = player
          ? `${player.first_name} ${player.last_name}`
          : "N/A";
      });

      selectedEventsResult = eventsResult;

      renderEvent();

      // move pagination button to the past events table
      const paginationContainer = document.getElementById(
        "pagination-container"
      );
      const newParent = document.getElementById("past-events-table");
      relocatePaginationControls(paginationContainer, newParent);

      // Adjust CSS accordingly
      document.getElementById("past-events-table").style.display = "block";
      document.getElementById("btn-container").style.display = "flex";
      document.getElementById("events-table").style.display = "none";

      initPagination(pastEventsList, renderPastEventsTable);
    });

    tableBody.appendChild(row);
  });

  // Fill empty rows
  fillEmptyRows(tableBody, pageData.length, pageSize, 6);

  // Update pagination UI
  updatePaginationInfo();
  updatePaginationControls();
}

// --------------------------------------------------------------------------------------------------------------------------
//
//                                               CODES FOR VISUALIZATION BUTTON CLICKED
//
// --------------------------------------------------------------------------------------------------------------------------

export function handleVizButtonClick(buttonText) {
  // The 'buttonText' determines which specific visualization function to call.
  switch (buttonText) {
    case "Participants Trend":
      renderParticipantsTrend(pastEventsList);
      break;

    case "Prize Money Analysis":
      renderPrizeMoneyAnalysis(pastEventsList);
      break;

    case "Average Ratings":
      renderAverageRatings(continualId);
      break;

    case "Difference in Rating":
      renderDiffRating(continualId);
      break;

    default:
      console.error("Unknown visualization button:", buttonText);
  }
}
