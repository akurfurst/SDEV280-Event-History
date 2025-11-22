import { handleVizButtonClick } from "../script.js";
import { sortDivisions } from "./functions.js";
import {
  getCurrentPageData,
  getPaginationInfo,
  updatePaginationControls,
  updatePaginationInfo,
} from "./pagination.js";

export function clearTable(tableBodyId) {
  const tableBody = document.getElementById(tableBodyId);
  if (tableBody) {
    tableBody.innerHTML = "";
  }
}

export function createClickableRow(content, clickHandler) {
  const row = document.createElement("tr");
  row.innerHTML = content;
  row.addEventListener("click", clickHandler);
  return row;
}

export function fillEmptyRows(
  tableBody,
  currentRowCount,
  pageSize,
  columnCount
) {
  const rowsToFill = pageSize - currentRowCount;

  const emptyCellHtml = `<td>&nbsp;</td>`;
  const emptyCells = Array(columnCount).fill(emptyCellHtml).join("");

  for (let i = 0; i < rowsToFill; i++) {
    const emptyRow = document.createElement("tr");
    emptyRow.className = "empty-row";

    emptyRow.innerHTML = emptyCells;
    tableBody.appendChild(emptyRow);
  }
}

export async function updateStatCards(pastEventsList) {
  const eventsCount = pastEventsList.length;
  const startYear = pastEventsList[pastEventsList.length - 1].year;
  let playersCount = 0;
  let totalPrize = 0;

  pastEventsList.forEach((event) => {
    playersCount += event.players_count === "N/A" ? 0 : event.players_count;
    totalPrize += event.total_prize === "N/A" ? 0 : event.total_prize;
  });
  const avgPlayersCount = Math.round(playersCount / eventsCount, 0);

  document.getElementById("stat-total-events").textContent =
    eventsCount.toLocaleString();
  document.getElementById(
    "stat-detail-total-event"
  ).textContent = `Running Since ${startYear}`;
  document.getElementById("stat-total-players").textContent =
    playersCount.toLocaleString();
  document.getElementById("stat-avg-players").textContent =
    avgPlayersCount.toLocaleString();

  if (totalPrize > 1000000) {
    document.getElementById("stat-total-prize").textContent =
      "$" + (totalPrize / 1000000).toFixed(1) + "M";
  } else {
    document.getElementById("stat-total-prize").textContent =
      "$" + totalPrize.toLocaleString();
  }
}

// Update Past Events List with Player Names
// export async function updatePastEventsList(id) {
//   const pastEvents = await getPastEvents(id);

//   const pdgaNumbers = [];

//   pastEvents.forEach(event => {
//     pdgaNumbers.push(event.pdga_number);
//   })

//   const playersData = await getPlayersByPdgaNumbers(pdgaNumbers);

//   pastEvents.forEach(event => {
//     const player = playersData.find(p => String(p.pdga_number) === String(event.pdga_number));
//     event.player_name = player ? `${player.first_name} ${player.last_name}` : "N/A";
//   });

//   console.log(pastEvents);
// }

// Update Table Headers for Past Events
// Render Past Events Table

export function relocatePaginationControls(
  paginationContainer,
  newParent,
  buttonContainer
) {
  if (paginationContainer && buttonContainer && newParent) {
    newParent.insertBefore(paginationContainer, buttonContainer);
  } else {
    newParent.appendChild(paginationContainer);
  }
}

export function activateBackToAllEventsBtn() {
  const btn = document.getElementById("all-events-btn");
  const headerBtn = document.getElementById("header-back-btn");
  
  const backToAllEvents = () => {
    document.getElementById("btn-container").style.display = "none";
    window.location.reload();
  };
  
  btn.addEventListener("click", backToAllEvents);
  
  if (headerBtn) {
    headerBtn.addEventListener("click", backToAllEvents);
  }
}

export function showHeaderBackButton() {
  const headerBtn = document.getElementById("header-back-btn");
  if (headerBtn) {
    headerBtn.classList.remove("hidden");
  }
}

export function hideHeaderBackButton() {
  const headerBtn = document.getElementById("header-back-btn");
  if (headerBtn) {
    headerBtn.classList.add("hidden");
  }
}

export function getTierBadge(tier) {
  let tierClass = "";
  let tierLabel = tier;

  switch (tier) {
    case "Major":
      tierClass = "tier-m";
      tierLabel = "PDGA Major";
      break;
    case "Elite":
      tierClass = "tier-es";
      tierLabel = "Elite Series";
      break;
    case "Tier-A":
      tierClass = "tier-a";
      tierLabel = "A-Tier";
      break;
    case "Tier-B":
      tierClass = "tier-b";
      tierLabel = "B-Tier";
      break;
    case "Tier-C":
      tierClass = "tier-c";
      tierLabel = "C-Tier";
      break;
    case "Tier-XA":
      tierClass = "tier-xa";
      tierLabel = "XA-Tier";
      break;
    case "Tier-XB":
      tierClass = "tier-xb";
      tierLabel = "XB-Tier";
      break;
    case "Tier-XC":
      tierClass = "tier-xc";
      tierLabel = "XC-Tier";
      break;
    case "Tier-XM":
      tierClass = "tier-xm";
      tierLabel = "XM-Tier";
      break;
    default:
      tierLabel = tier || "Unknown";
  }

  return `<span class="tier-badge ${tierClass}">${tierLabel}</span>`;
}

export function createChart(title, legend, xAxis, yAxis, series, tooltip) {
  // Initialize the echarts instance based on the prepared dom
  var myChart = echarts.init(document.getElementById("viz"));

  myChart.clear();

  // Specify the configuration items and data for the chart
  var option = {
    title: title,
    tooltip: tooltip,
    legend: legend,
    xAxis: xAxis,
    yAxis: yAxis,
    series: series,
  };

  // Display the chart using the configuration items and data just specified.
  myChart.setOption(option);
}

export function renderPastEventsTable() {
  const tableBody = document.getElementById("past-events-body");
  const { data: pageData } = getCurrentPageData();
  const { pageSize, currentPage } = getPaginationInfo();

  // Clear table
  clearTable("past-events-body");

  // Add data rows
  pageData.forEach((item) => {
    const total_prize =
      item.total_prize === "N/A"
        ? "N/A"
        : `$${(+item.total_prize).toLocaleString()}`;

    const rowContent = `
      <td>${item.year}</td>
      <td>${item.event_name}</td>
      <td>${item.start_date}</td>
      <td>${item.players_count}</td>
      <td>${total_prize}</td>
    `;

    const row = createClickableRow(rowContent, () => {
      window.open(item.website_url, "_blank");
    });
    tableBody.appendChild(row);
  });

  // Fill empty rows
  fillEmptyRows(tableBody, pageData.length, pageSize, 5);

  // Update pagination UI
  updatePaginationInfo();
  updatePaginationControls();
}

export function renderEventDetails(selectedEvent, pastEventsList) {
  const eventSection = document.getElementById("event-section");
  const eventName = document.getElementById("event-name");
  const eventTier = document.getElementById("event-tier");
  const eventDates = document.getElementById("event-dates");
  const eventCity = document.getElementById("event-city");
  const eventState = document.getElementById("event-state");
  const eventCountry = document.getElementById("event-country");
  const eventDirector = document.getElementById("event-director");

  // Check if all required elements exist
  if (
    !eventSection ||
    !eventName ||
    !eventTier ||
    !eventDates ||
    !eventCity ||
    !eventState ||
    !eventCountry ||
    !eventDirector
  ) {
    console.error("One or more required elements not found");
    return;
  }

  // Check if selectedEvent exists
  if (!selectedEvent) {
    console.error("selectedEvent is not defined");
    return;
  }

  // Now safely assign values
  eventSection.style.display = "block";
  eventName.textContent = selectedEvent.event_name || "Unknown Event";

  const tierBadge = getTierBadge(selectedEvent.tier);
  eventTier.innerHTML = tierBadge || "";

  // Check pastEventsList
  if (pastEventsList && pastEventsList.length > 0) {
    const start_year = pastEventsList[pastEventsList.length - 1].year;
    const end_year = pastEventsList[0].year;
    eventDates.textContent = `${start_year} - ${end_year}`;
  } else {
    eventDates.textContent = "N/A";
  }

  updateStatCards(pastEventsList);

  eventCity.textContent = selectedEvent.city + ",\u00A0" || "N/A,\u00A0";
  eventState.textContent = selectedEvent.state
    ? selectedEvent.state + ",\u00A0"
    : "";
  eventCountry.textContent = selectedEvent.country || "N/A";
  eventDirector.textContent = selectedEvent.tournament_director || "N/A";

  renderPastEventsTable();

  // Show the header back button when viewing an event
  showHeaderBackButton();

  // Smooth scroll to the event section
  eventSection.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export function activateVizSelectionBtn() {
  const vizButtons = document.querySelectorAll(".viz-button");

  // 1. Add click handlers for interaction
  vizButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all
      vizButtons.forEach((btn) => btn.classList.remove("active"));

      // Set the clicked button as active
      this.classList.add("active");

      // Get the text and execute the handler
      const buttonText = this.textContent.trim();
      handleVizButtonClick(buttonText);
    });
  });
}

export function renderSelectedVizButton() {
  const initialActiveButton = document.querySelector(".viz-button.active");

  if (initialActiveButton) {
    const initialButtonText = initialActiveButton.textContent.trim();
    handleVizButtonClick(initialButtonText);
  } else if (vizButtons.length > 0) {
    // If no button has 'active' set in HTML, activate the first one by default
    const firstButton = vizButtons[0];
    firstButton.classList.add("active");
    console.log(
      `No active button found. Defaulting to: ${firstButton.textContent.trim()}`
    );
    handleVizButtonClick(firstButton.textContent.trim());
  }
}

export function renderDivisionsWinner(eventsResult, pastEventsList) {
  const section = document.getElementById("division-section");
  section.innerHTML = '';

  // Get unique divisions and sort them
  const allDivisions = eventsResult.map((item) => item.division);
  const uniqueDivisionsSet = new Set(allDivisions);
  const divisionList = sortDivisions(Array.from(uniqueDivisionsSet));

  // Get reigning winners
  const reigningWinners = [];
  eventsResult.forEach(event => {
    const winner = event.player_name || 'N/A';
    const division = event.division;
    if (!reigningWinners.find(dw => dw.winner === winner)) {
      reigningWinners.push({
        division: division,
        winner: winner,
        winCount: 1
      });
    } else {
      reigningWinners.find(dw => dw.winner === winner).winCount += 1;
    }
  })

  // Merge event details into eventsResult
  const finalEventsResult = eventsResult.map(result => {
    const eventDetail = pastEventsList.find(
      event => event.pdga_event_id === result.pdga_event_id
    );
    return {
      ...result,
      ...eventDetail
    };
  });

  // Loop through divisions and create cards
  const totalCards = divisionList.length;
  const hasOneExtraCard = totalCards % 3 === 1;

  for (let i = 0; i < totalCards; i++) {
    const updatedReigningWinners = reigningWinners.filter(dw => dw.division === divisionList[i]);
    updatedReigningWinners.sort((a, b) => b.winCount - a.winCount);
    const updatedDivisionWinners = finalEventsResult.filter(fe => fe.division === divisionList[i]);
    updatedDivisionWinners.sort((a, b) => b.year - a.year);

    // Assign ranks with handling ties
    const firstRankWinCount = updatedReigningWinners[0]?.winCount || 'N/A';
    let currentWinCount = firstRankWinCount;
    let currentRank = 1;
    updatedReigningWinners.forEach(dw => {
      if (dw.winCount === currentWinCount) {
        dw.rank = currentRank;
      } else if (dw.winCount < currentWinCount) {
        currentRank += 1;
        dw.rank = currentRank;
        currentWinCount = dw.winCount;
      }
    });

    // Format ranks
    updatedReigningWinners.forEach(dw => {
      if (dw.rank === 1) {
        dw.rank = '1st';
      } else if (dw.rank === 2) {
        dw.rank = '2nd';
      } else if (dw.rank === 3) {
        dw.rank = '3rd';
      } else {
        dw.rank = dw.rank + 'th';
      }
    });

    // Create card content
    const cardContent = `
    <div class="division-card ${hasOneExtraCard && i === totalCards - 1 ? 'extra-one' : ''}">
            <h2>${divisionList[i]}</h2>
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Reigning Champions</th>
                  <th>Win Count</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${updatedReigningWinners[0]?.rank || ''}</td>
                  <td>${updatedReigningWinners[0]?.winner || ''}</td>
                  <td>${updatedReigningWinners[0]?.winCount || ''}</td>
                </tr>
                <tr>
                  <td>${updatedReigningWinners[1]?.rank || ''}</td>
                  <td>${updatedReigningWinners[1]?.winner || ''}</td>
                  <td>${updatedReigningWinners[1]?.winCount || ''}</td>
                </tr>
                <tr>
                  <td>${updatedReigningWinners[2]?.rank || ''}</td>
                  <td>${updatedReigningWinners[2]?.winner || ''}</td>
                  <td>${updatedReigningWinners[2]?.winCount || ''}</td>
                </tr>
              </tbody>
            </table>
            <table>
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Winner</th>
                  <th>Prize</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${updatedDivisionWinners[0]?.year || ''}</td>
                  <td>${updatedDivisionWinners[0]?.player_name || ''}</td>
                  <td>${updatedDivisionWinners[0]?.cash ? `$${Number(updatedDivisionWinners[0].cash).toLocaleString()}` : ''}</td>
                </tr>
                <tr>
                  <td>${updatedDivisionWinners[1]?.year || ''}</td>
                  <td>${updatedDivisionWinners[1]?.player_name || ''}</td>
                  <td>${updatedDivisionWinners[1]?.cash ? `$${Number(updatedDivisionWinners[1].cash).toLocaleString()}` : ''}</td>
                </tr>
                <tr>
                  <td>${updatedDivisionWinners[2]?.year || ''}</td>
                  <td>${updatedDivisionWinners[2]?.player_name || ''}</td>
                  <td>${updatedDivisionWinners[2]?.cash ? `$${Number(updatedDivisionWinners[2].cash).toLocaleString()}` : ''}</td>
                </tr>
              </tbody>
            </table>
            <div class="division-btn-container">
              <button>View More</button>
            </div>
          </div>
    `;

    section.innerHTML += cardContent;
  }
}
