package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var db *sql.DB
var rdb *redis.Client
var upgrader = websocket.Upgrader{}

// Content represents the structure of the content that will be stored in the database
type Content struct {
	ContentID int      `json:"content_id"`
	UserID    int      `json:"user_id"`
	Username  string   `json:"username"`
	Content   string   `json:"content"`
	CreatedAt string   `json:"created_at"`
	Tags      []string `json:"tags"`
	Likes     int      `json:"likes"`
}

var ctx = context.Background()

func init() {
	err := godotenv.Load(".env.local")
	if err != nil {
		log.Fatal("Error loading .env.local file")
	}
}

func main() {
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := "contents"

	// Construct the connection string
	dbConnection := fmt.Sprintf("%s:%s@tcp(127.0.0.1:3306)/%s", dbUser, dbPassword, dbName)

	// Connect to MySQL database
	var err error
	db, err = sql.Open("mysql", dbConnection)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	// Test the connection
	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	// Set up routes
	r := mux.NewRouter()
	r.HandleFunc("/api/contents", getContentsHandler).Methods("GET")
	r.HandleFunc("/api/contents", submitHandler).Methods("POST")

	// Start the server
	fmt.Println("Server started at :8080")
	log.Fatal(http.ListenAndServe(":8080", r))

	rdb = redis.NewClient(&redis.Options{
		Addr: "localhost:6379", // Redis server address
	})

	http.HandleFunc("/ws", handleWebSocket)

	// Test Redis connection
	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to Redis")
}

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	// upgrades the HTTP server connection to a WebSocket connection
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Failed to set websocket upgrade: ", err)
		return
	}
	defer conn.Close()

	pubsub := rdb.Subscribe(ctx, "notifications")
	defer pubsub.Close()

	// creates a Go channel that will receive messages from the Redis subscription
	ch := pubsub.Channel()
	for msg := range ch {
		// sends the message received from Redis over the WebSocket connection to the client
		if err := conn.WriteMessage(websocket.TextMessage, []byte(msg.Payload)); err != nil {
			log.Println("Failed to send message over WebSocket: ", err)
			return
		}
	}
}

func publishNotification(rdb *redis.Client, message string) {
	err := rdb.Publish(ctx, "notifications", message).Err()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Notification published")
}

// getContentsHandler handles fetching all contents from the database
func getContentsHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, content FROM contents")
	if err != nil {
		http.Error(w, "Unable to fetch content", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var contents []Content
	for rows.Next() {
		var content Content
		if err := rows.Scan(&content.ContentID, &content.Content); err != nil {
			http.Error(w, "Error scanning content", http.StatusInternalServerError)
			return
		}
		contents = append(contents, content)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(contents)
}

// submitHandler handles inserting new content into the database
func submitHandler(w http.ResponseWriter, r *http.Request) {
	var content Content
	if err := json.NewDecoder(r.Body).Decode(&content); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	_, err := db.Exec("INSERT INTO contents (content) VALUES (?)", content.Content)
	if err != nil {
		http.Error(w, "Unable to save content", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)

	// Publish a notification
	publishNotification(rdb, "New content posted!")
}

func recommendContents(db *sql.DB, userID string) ([]Content, error) {
	query := `
	SELECT 
		c.content_id,
		c.user_id,
		u.username,
		c.content,
		c.created_at,
		GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name ASC) AS tags,
		COUNT(DISTINCT l.user_id) AS likes
	FROM 
		Contents c
		JOIN Contents2Tags ct ON c.content_id = ct.content_id
		JOIN Tags t ON ct.tag_id = t.tag_id
		LEFT JOIN UserTagInteraction uti ON t.tag_id = uti.tag_id AND uti.user_id = ?
		LEFT JOIN Likes l ON c.content_id = l.content_id
		JOIN Users u ON c.user_id = u.user_id
	GROUP BY 
		c.content_id
	ORDER BY 
		CASE 
			WHEN COUNT(DISTINCT uti.tag_id) = 0 THEN COUNT(DISTINCT l.user_id)  
			ELSE SUM(uti.score) 
		END DESC, 
		c.created_at DESC
	LIMIT 50;`

	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Content
	for rows.Next() {
		var post Content
		if err := rows.Scan(&post.ContentID, &post.Content); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func getContentsByUser(db *sql.DB, targetUserID string) ([]Content, error) {
	query := `
    SELECT 
		c.content_id,
		c.user_id,
		u.username,
		c.content,
		c.created_at,
		GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name ASC) AS tags,  
		COUNT(DISTINCT l.user_id) AS likes  
	FROM Contents c
	JOIN Users u ON c.user_id = u.user_id
	JOIN Contents2Tags ct ON c.content_id = ct.content_id
	JOIN Tags t ON ct.tag_id = t.tag_id
	LEFT JOIN Likes l ON c.content_id = l.content_id
	WHERE c.user_id = ?
	GROUP BY c.content_id
	ORDER BY created_at DESC;`

	rows, err := db.Query(query, targetUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Content
	for rows.Next() {
		var post Content
		if err := rows.Scan(&post.ContentID, &post.Content, &post.CreatedAt); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}
