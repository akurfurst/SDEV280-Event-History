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
    case 'getRecurringEventCountOnContinualEvent':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
                count(ce.pdga_event_id) as events_count,
                MIN(YEAR(e.start_date)) AS start_year
            FROM continual_events ce
            JOIN events e ON e.pdga_event_id = ce.pdga_event_id
            WHERE ce.continual_id = ?
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
    
    case 'getPlayerCountOnContinualEvent':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
            	count(er.pdga_number) as players_count
            FROM continual_events ce
            JOIN event_results er ON er.pdga_event_id = ce.pdga_event_id
            WHERE ce.continual_id = ?
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
        
    case 'getAvgPlayerCountOnContinualEvent':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            WITH event_players_count AS (
                SELECT
                    er.pdga_event_id,
                    COUNT(er.pdga_number) AS players_count
                FROM continual_events ce
                JOIN events e ON e.pdga_event_id = ce.pdga_event_id
                JOIN event_results er ON er.pdga_event_id = ce.pdga_event_id
                WHERE ce.continual_id = ?
                GROUP BY er.pdga_event_id
                )
            SELECT
                ROUND(AVG(players_count), 0) AS avg_players_count
            FROM event_players_count;
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
        
    case 'getTotalPrizeOnContinualEvent':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
            	SUM(er.cash) as total_prize
            FROM continual_events ce
            JOIN event_results er ON er.pdga_event_id = ce.pdga_event_id
            WHERE ce.continual_id = ?
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
        
    case 'getEventDateRange':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
            MIN(YEAR(e.start_date)) AS start_year,
            MAX(YEAR(e.start_date)) AS end_year,
            MIN(e.start_date) AS start_date,
            MAX(e.start_date) AS end_date
            FROM continual_events ce
            JOIN events e ON e.pdga_event_id = ce.pdga_event_id
            WHERE ce.continual_id = ?
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
        
    case 'getPastEvents':
        $continualId = $_GET['continualId'] ?? '';

        if (empty($continualId)) {
            echo json_encode(['error' => 'continualId is required']);
            exit;
        }

        $stmt = $conn->prepare("
            SELECT
            e.event_name,
            e.start_date,
            e.website_url,
            er.division,
            er.pdga_number
            FROM continual_events ce
            JOIN events e ON e.pdga_event_id = ce.pdga_event_id
            JOIN event_results er ON er.pdga_event_id = ce.pdga_event_id
            WHERE ce.continual_id = ? AND er.place = 1
            ORDER BY e.start_date DESC
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
        
case 'getPlayersByPdgaNumbers':
    $pdgaNumbersParam = $_GET['pdgaNumbers'] ?? '';
    
    if (empty($pdgaNumbersParam)) {
        echo json_encode(['error' => 'pdgaNumbers parameter is required']);
        exit;
    }
    
    // Convert comma-separated string to array
    $pdgaNumbers = explode(',', $pdgaNumbersParam);
    
    // Remove duplicates and trim whitespace
    $pdgaNumbers = array_unique(array_map('trim', $pdgaNumbers));
    
    // Validate all are numeric
    foreach ($pdgaNumbers as $num) {
        if (!is_numeric($num)) {
            echo json_encode(['error' => 'Invalid PDGA number: ' . $num]);
            exit;
        }
    }
    
    // Create placeholders for prepared statement
    $placeholders = implode(',', array_fill(0, count($pdgaNumbers), '?'));
    
    $stmt = $conn->prepare("
        SELECT
            *
        FROM
            players
        WHERE
            pdga_number IN ($placeholders)
    ");
    
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    
    // Bind parameters dynamically
    $types = str_repeat('s', count($pdgaNumbers));
    $stmt->bind_param($types, ...array_values($pdgaNumbers));
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    $stmt->close();
    break;
    
    case 'getAllEventsID':

        $stmt = $conn->prepare("
            SELECT 
                c.id,
                c.name,
                c.alt_name,
                ce.pdga_event_id
            FROM continual c
            JOIN continual_events ce ON ce.continual_id = c.id
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

        echo json_encode($data);
        $stmt->close();
        break;
        
    case 'getAllEventsDetails':

        $stmt = $conn->prepare("
            SELECT 
                *, YEAR(start_date) AS year
            FROM events
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

        echo json_encode($data);
        $stmt->close();
        break;
        
case 'getParticipantsAndPrizesPerYearByPdgaEventIds':
    $pdgaEventIds = $_GET['pdgaEventIds'] ?? '';
    
    if (empty(pdgaEventIds)) {
        echo json_encode(['error' => 'pdgaEventIds parameter is required']);
        exit;
    }
    
    // Convert comma-separated string to array
    $pdgaEventIds = explode(',', $pdgaEventIds);
    
    // Remove duplicates and trim whitespace
    $pdgaEventIds = array_unique(array_map('trim', $pdgaEventIds));
    
    // Validate all are numeric
    foreach ($pdgaEventIds as $num) {
        if (!is_numeric($num)) {
            echo json_encode(['error' => 'Invalid PDGA Event ID: ' . $num]);
            exit;
        }
    }
    
    // Create placeholders for prepared statement
    $placeholders = implode(',', array_fill(0, count($pdgaEventIds), '?'));
    
    $stmt = $conn->prepare("
        SELECT 
	    er.pdga_event_id,
	    COUNT(er.pdga_number) AS players_count,
   	    SUM(er.cash) AS total_prize
        FROM event_results er
        WHERE pdga_event_id IN ($placeholders)
        GROUP BY er.pdga_event_id
    ");
    
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    
    // Bind parameters dynamically
    $types = str_repeat('s', count($pdgaEventIds));
    $stmt->bind_param($types, ...array_values($pdgaEventIds));
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    $stmt->close();
    break;
    
    case 'getEventsResultByPdgaEventIds':
    $pdgaEventIds = $_GET['pdgaEventIds'] ?? '';
    
    if (empty(pdgaEventIds)) {
        echo json_encode(['error' => 'pdgaEventIds parameter is required']);
        exit;
    }
    
    // Convert comma-separated string to array
    $pdgaEventIds = explode(',', $pdgaEventIds);
    
    // Remove duplicates and trim whitespace
    $pdgaEventIds = array_unique(array_map('trim', $pdgaEventIds));
    
    // Validate all are numeric
    foreach ($pdgaEventIds as $num) {
        if (!is_numeric($num)) {
            echo json_encode(['error' => 'Invalid PDGA Event ID: ' . $num]);
            exit;
        }
    }
    
    // Create placeholders for prepared statement
    $placeholders = implode(',', array_fill(0, count($pdgaEventIds), '?'));
    
    $stmt = $conn->prepare("
        SELECT 
	    *
        FROM event_results er
        WHERE pdga_event_id IN ($placeholders) AND er.place = 1
    ");
    
    if (!$stmt) {
        echo json_encode(['error' => 'Prepare failed: ' . $conn->error]);
        exit;
    }
    
    // Bind parameters dynamically
    $types = str_repeat('s', count($pdgaEventIds));
    $stmt->bind_param($types, ...array_values($pdgaEventIds));
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $data = [];
    while ($row = $result->fetch_assoc()) {
        $data[] = $row;
    }
    
    echo json_encode($data);
    $stmt->close();
    break;
    
    case 'getUniqueEventDivisions':

        $stmt = $conn->prepare("
        SELECT DISTINCT er.pdga_event_id, er.division
        FROM event_results er
        ORDER BY er.pdga_event_id, er.division;
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

        echo json_encode($data);
        $stmt->close();
        break;

    default:
        echo json_encode(['error' => 'Invalid query type']);
        break;
}

$conn->close();
?>