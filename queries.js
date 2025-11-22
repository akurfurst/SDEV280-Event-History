export async function getTotalEvents() {
    try {
        const url = `https://coderelic.greenriverdev.com/query.php?queryType=getTotalEvents`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getTotalPlayers() {
    try {
        const url = `https://coderelic.greenriverdev.com/query.php?queryType=getTotalPlayers`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getAvgPlayersPerEvent() {
    try {
        const url = `https://coderelic.greenriverdev.com/query.php?queryType=getAvgPlayersPerEvent`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}

export async function getTotalPrize() {
    try {
        const url = `https://coderelic.greenriverdev.com/query.php?queryType=getTotalPrize`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error:', error);
    }
}

export function updateStatCards(statData) {
    document.getElementById('stat-total-events').textContent = statData['total_events']
    document.getElementById('stat-total-players').textContent = statData['total_players'].toLocaleString()
    document.getElementById('stat-avg-players').textContent = statData['avg_players_per_event']
    document.getElementById('stat-total-prize').textContent = '$' + Math.round((statData['total_prize'] / 1000000), 1) + 'M'
}