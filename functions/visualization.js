import { createChart } from "./domHandler.js";
import { customDivisionOrder } from "./functions.js";
import { getContinualEventsAverageRatingByDivision, getContinualEventsDiffRating } from "./queries.js";

export function renderParticipantsTrend(data) {
  const title = {
    text:
      "Participants Trend " + data[data.length - 1].year + " - " + data[0].year
  };
  const legend = {
    data: ["Participants"],
  };
  const yearList = data.map((event) => {
    return event.year;
  });
  const xAxis = {
    data: yearList,
    name: "Year",
  };
  const yAxis = {
    name: "Total Participants", // Set your Y-axis label here
    nameLocation: "middle", // Position the label in the middle of the axis
    nameGap: 50, // Adjust the distance between the label and the axis line
    axisLabel: {
      formatter: "{value}", // Optional: Format the individual axis tick labels
    },
  };
  const playerCounts = data.map((event) => {
    return event.players_count;
  });
  const series = [
    {
      name: "Participants",
      data: playerCounts,
      type: "line",
    },
  ];
  const tooltip = {
    // Formats the value for all series
    valueFormatter: (value) => {
      if (value === null || value === undefined) {
        return "-";
      }
      return value.toLocaleString() + " players";
    },
  };
  createChart(title, legend, xAxis, yAxis, series, tooltip);
}

export function renderPrizeMoneyAnalysis(data) {
  const title = {
    text: "Total Prize " + data[data.length - 1].year + " - " + data[0].year
  };
  const legend = {
    data: ["Total Prize"],
  };
  const yearList = data.map((event) => {
    return event.year;
  });
  const xAxis = {
    data: yearList,
    name: "Year",
  };
  const yAxis = {
    type: "value",
    name: "Total Prize Money", // Set your Y-axis label here
    nameLocation: "middle", // Position the label in the middle of the axis
    nameGap: 50, // Adjust the distance between the label and the axis line
    axisLabel: {
      formatter: "$ {value}", // Optional: Format the individual axis tick labels
    },
  };
  const totalPrize = data.map((event) => {
    return event.total_prize;
  });
  const series = [
    {
      name: "Total Prize",
      data: totalPrize,
      type: "line",
    },
  ];
  const tooltip = {
    // Formats the value for all series
    valueFormatter: (value) => {
      if (value === null || value === undefined) {
        return "-";
      }
      return "$" + value.toLocaleString();
    },
  };
  createChart(title, legend, xAxis, yAxis, series, tooltip);
}

export function renderAverageRatings(continualId) {
  getContinualEventsAverageRatingByDivision(continualId).then((data) => {
    if (!data || data.length === 0) {
      console.error("No rating data available");
      return;
    }

    // Sort divisions using your existing sortDivisions function
    const sortedData = data.sort((a, b) => {
      const indexA = customDivisionOrder.indexOf(a.division);
      const indexB = customDivisionOrder.indexOf(b.division);
      if (indexA === -1 && indexB === -1)
        return a.division.localeCompare(b.division);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });

    const title = {
      text: "Average Event Rating by Division",
    };

    const legend = {
      data: ["Average Rating"],
    };

    const divisionList = sortedData.map((item) => item.division);

    const xAxis = {
      type: "category",
      data: divisionList,
      name: "Division",
      axisLabel: {
        rotate: 45, // Rotate labels if there are many divisions
      },
    };

    const yAxis = {
      type: "value",
      name: "Average Rating",
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        formatter: "{value}",
      },
    };

    const avgRatings = sortedData.map((item) => item.avg_rating);

    const series = [
      {
        name: "Average Rating",
        data: avgRatings,
        type: "bar",
        itemStyle: {
          color: "#5470c6",
        },
      },
    ];

    const tooltip = {
      trigger: "axis",
      axisPointer: {
        type: "shadow",
      },
      formatter: function (params) {
        const dataIndex = params[0].dataIndex;
        const item = sortedData[dataIndex];
        return (
          `<strong>${item.division}</strong><br/>` +
          `Average Rating: ${item.avg_rating}<br/>` +
          `Total Players: ${item.player_count.toLocaleString()}`
        );
      },
    };

    createChart(title, legend, xAxis, yAxis, series, tooltip);
  });
}

export function renderDiffRating(continualId) {
  getContinualEventsDiffRating(continualId).then((data) => {
    if (!data || data.length === 0) {
      console.error("No rating difference data available");
      return;
    }

    const title = {
      text:
        "Difference in Rating " +
        data[0].year +
        " - " +
        data[data.length - 1].year,
    };

    const legend = {
      data: ["Average Rating Difference"],
    };

    const yearList = data.map((event) => {
      return event.year;
    });

    const xAxis = {
      data: yearList,
      name: "Year",
    };

    const yAxis = {
      type: "value",
      name: "Average Rating Difference",
      nameLocation: "middle",
      nameGap: 50,
      axisLabel: {
        formatter: "{value}",
      },
    };

    const ratingDifferences = data.map((event) => {
      return event.avg_diff_rating;
    });

    const series = [
      {
        name: "Average Rating Difference",
        data: ratingDifferences,
        type: "line",
      },
    ];

    const tooltip = {
      trigger: "axis",
      axisPointer: {},
      formatter: null,
      valueFormatter: (value) => {
        if (value === null || value === undefined) {
          return "-";
        }
        return value.toFixed(2) + " points";
      },
    };

    createChart(title, legend, xAxis, yAxis, series, tooltip);
  });
}