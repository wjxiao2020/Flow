package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"github.com/go-redis/redis/v8"
	_ "github.com/go-sql-driver/mysql"
	"github.com/gorilla/mux"
)

var db *sql.DB

// Content represents the structure of the content that will be stored in the database
type Content struct {
	ID      int    `json:"id"`
	Content string `json:"content"`
}

var ctx = context.Background()

func main() {
	// Connect to MySQL database
	var err error
	db, err = sql.Open("mysql", "root:password@tcp(127.0.0.1:3306)/contentdb")
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

	rdb := redis.NewClient(&redis.Options{
		Addr: "localhost:6379", // Use your Redis server address
	})

	// Test Redis connection
	_, err = rdb.Ping(ctx).Result()
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Connected to Redis")

	// Example: Publish a notification
	publishNotification(rdb, "New content posted!")
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
		if err := rows.Scan(&content.ID, &content.Content); err != nil {
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
}
