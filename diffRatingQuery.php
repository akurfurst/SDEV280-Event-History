<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Adjust for production

// Import database configuration
require_once '../config.php';

// Create connection using the function from config.php
$conn = getDBConnection();

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
    case 'getContinualEventsDiffRating':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT 
                YEAR(events.start_date) AS year,
                AVG(event_results.evt_rating - event_results.pre_rating) AS avg_diff_rating 
            FROM continual_events
            JOIN events ON continual_events.pdga_event_id = events.pdga_event_id
            JOIN event_results ON events.pdga_event_id = event_results.pdga_event_id
            WHERE continual_events.continual_id = ?
            GROUP BY YEAR(events.start_date)
            ORDER BY YEAR(events.start_date) ASC
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
                'year' => (int)$row['year'],
                'avg_diff_rating' => round((float)$row['avg_diff_rating'], 2)
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