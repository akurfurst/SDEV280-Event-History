<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *'); // Adjust for production

// Import database configuration
require_once '../config.php';

// Create connection using the function from config.php
$conn = getDBConnection();

// Check connection
if ($conn->connect_error) {
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// Get the query type from request
$queryType = $_GET['queryType'] ?? '';

// Main switch for queryType
switch ($queryType) {
    case 'getContinualEventsParticipants':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT 
                e.pdga_event_id,
                YEAR(e.start_date) as year,
                COUNT(er.id) as player_count
            FROM continual_events ce
            JOIN events e ON ce.pdga_event_id = e.pdga_event_id
            LEFT JOIN event_results er ON e.pdga_event_id = er.pdga_event_id
            WHERE ce.continual_id = ?
            GROUP BY e.pdga_event_id, e.start_date
            ORDER BY YEAR(e.start_date) ASC
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
            $data[] = $row;
        }

        echo json_encode($data);
        $stmt->close();
        break;

    case 'getContinualEventYears':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT DISTINCT
                YEAR(e.start_date) AS year
            FROM 
                continual_events ce
            JOIN 
                events e ON ce.pdga_event_id = e.pdga_event_id
            WHERE 
                ce.continual_id = ?
            ORDER BY 
                year ASC
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
            $data[] = $row;
        }

        echo json_encode($data);
        $stmt->close();
        break;

    case 'getContinualEventsDivisions':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT DISTINCT
                ce.pdga_event_id,
                YEAR(e.start_date) AS year,
                er.division
            FROM 
                continual_events ce
            JOIN 
                events e ON ce.pdga_event_id = e.pdga_event_id
            JOIN 
                event_results er ON e.pdga_event_id = er.pdga_event_id
            WHERE 
                ce.continual_id = ?
            ORDER BY 
                e.start_date ASC, er.division ASC
        ");

        if (!$stmt) {
            echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
            exit;
        }

        $stmt->bind_param("i", $continualId);
        $stmt->execute();
        $result = $stmt->get_result();

        // Organize data by event
        $events = [];
        while ($row = $result->fetch_assoc()) {
            $eventId = $row['pdga_event_id'];

            if (!isset($events[$eventId])) {
                $events[$eventId] = [
                    'pdga_event_id' => $eventId,
                    'year' => $row['year'],
                    'divisions' => []
                ];
            }

            $events[$eventId]['divisions'][] = $row['division'];
        }

        // Convert to indexed array
        $data = array_values($events);

        echo json_encode($data);
        $stmt->close();
        break;

    case 'getContinualEventsWithPrizes':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT 
                ce.pdga_event_id,
                YEAR(e.start_date) AS year,
                COALESCE(SUM(er.cash), 0) AS total_prize
            FROM continual_events ce
            JOIN events e ON ce.pdga_event_id = e.pdga_event_id
            LEFT JOIN event_results er ON e.pdga_event_id = er.pdga_event_id
            WHERE ce.continual_id = ?
            GROUP BY ce.pdga_event_id, e.start_date
            ORDER BY e.start_date ASC
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
                'pdga_event_id' => (int)$row['pdga_event_id'],
                'year' => $row['year'],
                'total_prize' => (int)$row['total_prize']
            ];
        }

        echo json_encode($data);
        $stmt->close();
        break;

    case 'getContinualEventsAverageRatingByDivision':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT 
                er.division,
                AVG(er.evt_rating) AS avg_rating,
                COUNT(er.id) AS player_count
            FROM continual_events ce
            JOIN events e ON ce.pdga_event_id = e.pdga_event_id
            JOIN event_results er ON e.pdga_event_id = er.pdga_event_id
            WHERE ce.continual_id = ? AND er.evt_rating IS NOT NULL AND er.evt_rating > 0
            GROUP BY er.division
            ORDER BY er.division ASC
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
                'division' => $row['division'],
                'avg_rating' => round((float)$row['avg_rating'], 1),
                'player_count' => (int)$row['player_count']
            ];
        }

        echo json_encode($data);
        $stmt->close();
        break;

    case 'getAllRecentEventsContinualList':
        $stmt = $conn->prepare("
            SELECT 
                c.id, 
                c.name,
                ce.pdga_event_id, 
                e.tier,
                e.start_date,
                e.event_name,
                e.city,
                e.state,
                e.country,
                YEAR(e.start_date) AS year
            FROM continual c
            JOIN (
                SELECT ce_inner.continual_id, MAX(YEAR(e_inner.start_date)) AS max_year
                FROM continual_events ce_inner
                JOIN events e_inner ON e_inner.pdga_event_id = ce_inner.pdga_event_id
                GROUP BY ce_inner.continual_id
            ) latest ON latest.continual_id = c.id
            JOIN continual_events ce ON ce.continual_id = c.id
            JOIN events e ON e.pdga_event_id = ce.pdga_event_id 
                AND YEAR(e.start_date) = latest.max_year
            ORDER BY e.start_date DESC
        ");

        if (!$stmt) {
            echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
            exit;
        }

        $stmt->execute();
        $result = $stmt->get_result();

        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }

        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        $stmt->close();
        break;
        
    case 'getAllRecentEventsContinualList':
        $stmt = $conn->prepare("
            SELECT 
                c.id,
                c.name,
                ce.pdga_event_id, 
                e.tier,
                e.start_date,
                e.event_name,
                e.city,
                e.state,
                e.country,
                YEAR(e.start_date) AS year
            FROM continual c
            JOIN (
                SELECT ce_inner.continual_id, MAX(YEAR(e_inner.start_date)) AS max_year
                FROM continual_events ce_inner
                JOIN events e_inner ON e_inner.pdga_event_id = ce_inner.pdga_event_id
                GROUP BY ce_inner.continual_id
            ) latest ON latest.continual_id = c.id
            JOIN continual_events ce ON ce.continual_id = c.id
            JOIN events e ON e.pdga_event_id = ce.pdga_event_id 
                AND YEAR(e.start_date) = latest.max_year
            ORDER BY e.start_date DESC
        ");
        
        if (!$stmt) {
            echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
            exit;
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        
        // Simpler JSON encoding with proper UTF-8
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        $stmt->close();
        break;

    default:
        echo json_encode(['error' => 'Invalid query type']);
        break;
}

$conn->close();
?>