package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
)

var db *sql.DB
var rdb *redis.Client
var upgrader = websocket.Upgrader{}

// represents the structure of the content the will be sent to frontend to render
type ContentShown struct {
	ContentID int      `json:"content_id"`
	UserID    int      `json:"user_id"`
	Username  string   `json:"username"`
	Title     string   `json:"title"`
	Content   string   `json:"content"`
	CreatedAt string   `json:"created_at"`
	Tags      []string `json:"tags"`
	Likes     int      `json:"likes"`
}

// represents the structure of the content that the frond end sent when an user post something
type ContentSubmitted struct {
	Title   string   `json:"title"`
	Content string   `json:"content"`
	Tags    []string `json:"tags"`
	AuthID  string   `json:"auth_id"`
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
	r.HandleFunc("/api/retrieve", getContentsHandler).Methods("POST")
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
	var request struct {
		UserID *string `json:"userId"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	var query string
	var args []interface{}

	if request.UserID != nil {
		query = `
		SELECT 
			c.content_id,
			c.user_id,
			u.username,
			c.title,
			c.content,
			c.created_at,
			GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name ASC) AS tags,
			COUNT(DISTINCT l.user_id) AS likes
		FROM 
			Contents c
			JOIN Contents2Tags ct ON c.content_id = ct.content_id
			JOIN Tags t ON ct.tag_id = t.tag_id
			LEFT JOIN UserTagInteraction uti ON t.tag_id = uti.tag_id AND uti.user_id = (
				SELECT user_id 
				FROM Users 
				WHERE auth_id = ?
			)
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
		args = append(args, *request.UserID)
	} else {
		query = `
		SELECT 
			c.content_id,
			c.user_id,
			u.username,
			c.title,
			c.content,
			c.created_at,
			GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name ASC) AS tags,
			COUNT(DISTINCT l.user_id) AS likes
		FROM 
			Contents c
			JOIN Contents2Tags ct ON c.content_id = ct.content_id
			JOIN Tags t ON ct.tag_id = t.tag_id
			LEFT JOIN Likes l ON c.content_id = l.content_id
			JOIN Users u ON c.user_id = u.user_id
		GROUP BY 
			c.content_id
		ORDER BY 
			COUNT(DISTINCT l.user_id) DESC, 
			c.created_at DESC
		LIMIT 50;`
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		http.Error(w, "Unable to fetch content", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var contents []ContentShown
	for rows.Next() {
		var content ContentShown
		if err := rows.Scan(&content.ContentID, &content.UserID, &content.Username, &content.Title, &content.Content, &content.CreatedAt, &content.Tags, &content.Likes); err != nil {
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
	var content ContentSubmitted
	if err := json.NewDecoder(r.Body).Decode(&content); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Insert the content
	if err := insertContent(db, content); err != nil {
		log.Fatal(err)
	}

	w.WriteHeader(http.StatusCreated)

	// Publish a notification
	publishNotification(rdb, "New content posted!")
}

func insertContent(db *sql.DB, contentSubmitted ContentSubmitted) error {
	// 1. Find the user_id from the Users table where auth_id equals the UserID
	var userID int
	err := db.QueryRow("SELECT user_id FROM Users WHERE auth_id = ?", contentSubmitted.AuthID).Scan(&userID)
	if err != nil {
		return fmt.Errorf("failed to find user_id: %w", err)
	}

	// 2. Insert the post title and content into the Contents table
	result, err := db.Exec("INSERT INTO Contents (user_id, title, content) VALUES (?, ?, ?)", userID, contentSubmitted.Title, contentSubmitted.Content)
	if err != nil {
		return fmt.Errorf("failed to insert content: %w", err)
	}

	// Get the content_id of the newly inserted content
	contentID, err := result.LastInsertId()
	if err != nil {
		return fmt.Errorf("failed to get last insert id: %w", err)
	}

	// 3. Process the tags (convert to lowercase)
	for i, tag := range contentSubmitted.Tags {
		contentSubmitted.Tags[i] = strings.ToLower(tag)
	}

	// 3. Record new tags into the Tags table and get tag_ids
	tagIDs := make([]int, 0)
	for _, tag := range contentSubmitted.Tags {
		var tagID int
		// Check if the tag already exists
		err := db.QueryRow("SELECT tag_id FROM Tags WHERE tag_name = ?", tag).Scan(&tagID)
		if err == sql.ErrNoRows {
			// If the tag doesn't exist, insert it
			result, err := db.Exec("INSERT INTO Tags (tag_name) VALUES (?)", tag)
			if err != nil {
				return fmt.Errorf("failed to insert tag: %w", err)
			}
			tagID64, err := result.LastInsertId()
			if err != nil {
				return fmt.Errorf("failed to get last insert id for tag: %w", err)
			}
			tagID = int(tagID64)
		} else if err != nil {
			return fmt.Errorf("failed to check tag existence: %w", err)
		}
		tagIDs = append(tagIDs, tagID)
	}

	// 4. Insert the relationships between the content and tags into Contents2Tags
	for _, tagID := range tagIDs {
		_, err := db.Exec("INSERT INTO Contents2Tags (content_id, tag_id) VALUES (?, ?)", contentID, tagID)
		if err != nil {
			return fmt.Errorf("failed to insert into Contents2Tags: %w", err)
		}
	}

	// 5. Update UserTagInteraction table
	for _, tagID := range tagIDs {
		var score int
		// Check if the user-tag interaction already exists
		err := db.QueryRow("SELECT score FROM UserTagInteraction WHERE user_id = ? AND tag_id = ?", userID, tagID).Scan(&score)
		if err == sql.ErrNoRows {
			// If the interaction doesn't exist, insert it with a score of 1
			_, err := db.Exec("INSERT INTO UserTagInteraction (user_id, tag_id, score) VALUES (?, ?, ?)", userID, tagID, 1)
			if err != nil {
				return fmt.Errorf("failed to insert into UserTagInteraction: %w", err)
			}
		} else if err == nil {
			// If the interaction exists, increase the score by 1
			_, err := db.Exec("UPDATE UserTagInteraction SET score = score + 1 WHERE user_id = ? AND tag_id = ?", userID, tagID)
			if err != nil {
				return fmt.Errorf("failed to update UserTagInteraction: %w", err)
			}
		} else {
			return fmt.Errorf("failed to check user-tag interaction: %w", err)
		}
	}

	return nil
}

func recommendContents(db *sql.DB, authID string) ([]ContentShown, error) {
	query := `
	SELECT 
		c.content_id,
		c.user_id,
		u.username,
		c.title,
		c.content,
		c.created_at,
		GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name ASC) AS tags,
		COUNT(DISTINCT l.user_id) AS likes
	FROM 
		Contents c
		JOIN Contents2Tags ct ON c.content_id = ct.content_id
		JOIN Tags t ON ct.tag_id = t.tag_id
		LEFT JOIN UserTagInteraction uti ON t.tag_id = uti.tag_id AND uti.user_id = (
			SELECT user_id 
			FROM Users 
			WHERE auth_id = ?
		)
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

	rows, err := db.Query(query, authID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []ContentShown
	for rows.Next() {
		var post ContentShown
		if err := rows.Scan(&post.ContentID, &post.UserID, &post.Username, &post.Title, &post.Content, &post.CreatedAt, &post.Tags, &post.Likes); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}

func getContentsByUser(db *sql.DB, targetAuthID string) ([]ContentShown, error) {
	query := `
    SELECT 
		c.content_id,
		c.user_id,
		u.username,
		c.title,
		c.content,
		c.created_at,
		GROUP_CONCAT(DISTINCT t.tag_name ORDER BY t.tag_name ASC) AS tags,  
		COUNT(DISTINCT l.user_id) AS likes  
	FROM Contents c
	JOIN Users u ON c.user_id = u.user_id
	JOIN Contents2Tags ct ON c.content_id = ct.content_id
	JOIN Tags t ON ct.tag_id = t.tag_id
	LEFT JOIN Likes l ON c.content_id = l.content_id
	WHERE c.user_id = (
			SELECT user_id 
			FROM Users 
			WHERE auth_id = ?
		)
	GROUP BY c.content_id
	ORDER BY created_at DESC;`

	rows, err := db.Query(query, targetAuthID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []ContentShown
	for rows.Next() {
		var post ContentShown
		if err := rows.Scan(&post.ContentID, &post.UserID, &post.Username, &post.Title, &post.Content, &post.CreatedAt, &post.Tags, &post.Likes); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	return posts, nil
}
