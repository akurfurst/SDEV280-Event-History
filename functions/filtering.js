// --------------------------------------------------------------------------------------------------------------------------
//
//                                               CODES FOR FILTERING SECTION
//
// --------------------------------------------------------------------------------------------------------------------------

// Code for adding item to the filter
async function getContinualEventYears(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventYears&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

async function getContinualEventsDivisions(continualId) {
  try {
    const url = `https://coderelic.greenriverdev.com/query.php?queryType=getContinualEventsDivisions&continualId=${continualId}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error:", error);
  }
}

async function processFilterEvent() {
  const years = await getContinualEventYears(continualId);
  const yearList = years.map((item) => item.year);
  const yearNumbers = years.map((item) => parseInt(item.year));
  addYearList(yearNumbers);

  const eventDivisions = await getContinualEventsDivisions(continualId);
  const allDivisions = eventDivisions.flatMap((event) => event.divisions);
  const uniqueDivisions = [...new Set(allDivisions)];
  const sortedDivisions = sortDivisions(uniqueDivisions);

  addDivisionList(sortedDivisions);
}

// Call it
processFilterEvent();

// Add list of years in that continual event to the filter option
function addYearList(availableYears) {
  availableYears.reverse();
  const yearSelect = document.getElementById("year");
  yearSelect.innerHTML = "";
  const newOption = document.createElement("option");
  newOption.textContent = "All Years";
  newOption.value = "All Years";
  yearSelect.appendChild(newOption);
  availableYears.forEach((year) => {
    const newOption = document.createElement("option");
    newOption.textContent = year;
    newOption.value = year;
    yearSelect.appendChild(newOption);
  });
}

// Add list of divisions in that continual event to the filter option
function addDivisionList(divisions) {
  const divisionSelect = document.getElementById("division");
  divisionSelect.innerHTML = "";
  const newOption = document.createElement("option");
  newOption.textContent = "All Divisions";
  newOption.value = "All Divisions";
  divisionSelect.appendChild(newOption);
  divisions.forEach((division) => {
    const newOption = document.createElement("option");
    newOption.textContent = division;
    newOption.value = division;
    divisionSelect.appendChild(newOption);
  });
}

// When Year Filter is selected-----------------------------
const yearSelect = document.getElementById("year");

yearSelect.addEventListener("change", function () {
  const selectedYear = yearSelect.value;
  console.log("The currently selected year is:", selectedYear);
  if (selectedYear === "All Years") {
    console.log("Showing data for all years.");
  } else {
    console.log(`Filtering data for the year ${selectedYear}.`);
  }
});

console.log(yearSelect.value);

// When Division Filter is selected-----------------------------
const divisionSelect = document.getElementById("division");

divisionSelect.addEventListener("change", function () {
  const selectedDivision = divisionSelect.value;
  console.log("The currently selected division is:", selectedDivision);
  if (selectedDivision === "All Divisions") {
    console.log("Showing data for all divisions.");
  } else {
    console.log(`Filtering data for the division ${selectedDivision}.`);
  }
});

console.log(divisionSelect.value);
