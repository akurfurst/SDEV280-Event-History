<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production

// Database credentials (find these in cPanel)
$servername = "localhost";
$username = "codereli_joe";
$password = "coderelicJoe2801@green";
$dbname = "codereli_events";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Get the query type from request
$action = $_GET['action'] ?? '';

if ($action === 'countAllPlayers') {
    $sql = "SELECT COUNT(*) AS 'Total Players' FROM players";
    $result = $conn->query($sql);

    $data = [];
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
    }
    echo json_encode($data);
    exit; // Exit after handling this action
}

switch ($_GET['queryType'] ?? '') {
    case 'getContinualEventsRepeatedWinner':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT 
                event_results.pdga_number, 
                players.first_name, 
                players.last_name, 
                COUNT(*) AS win_count
            FROM event_results
            JOIN players ON event_results.pdga_number = players.pdga_number
            JOIN events ON event_results.pdga_event_id = events.pdga_event_id
            JOIN continual_events ON events.pdga_event_id = continual_events.pdga_event_id
            WHERE place = 1 AND continual_events.continual_id = ?
            GROUP BY players.pdga_number
            ORDER BY win_count DESC
            LIMIT 10
        ");

        if (!$stmt) {
            echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
            exit;
        }

        $stmt->bind_param("i", $continualId);
        $stmt->execute();
        $result = $stmt->get_result();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = [
                'pdga_number' => (int)$row['pdga_number'],
                'first_name' => $row['fist_name'],
                'last_name' => $row['last_name'],
                'win_count' => (int)$row['win_count']
            ];
        }

        echo json_encode($data);
        $stmt->close();
        break;
        
    default:
        echo json_encode(['error' => 'Unknown queryType: ' . ($_GET['queryType'] ?? 'none')]);
        break;
}

$conn->close();