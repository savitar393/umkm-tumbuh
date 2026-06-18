package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	dbURL := "postgres://umkm_user:umkm_password@localhost:5432/umkm_tumbuh?sslmode=disable"
	db, err := sql.Open("pgx", dbURL)
	if err != nil {
		log.Fatalf("Failed to open db: %v", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping db: %v", err)
	}

	queries := []string{
		"ALTER TABLE user_service.umkm_profiles ADD COLUMN IF NOT EXISTS omzet NUMERIC(14,2) DEFAULT 0;",
		"ALTER TABLE user_service.products ADD COLUMN IF NOT EXISTS category VARCHAR(100);",
	}

	for _, q := range queries {
		_, err := db.Exec(q)
		if err != nil {
			log.Printf("Query failed: %v\nQuery: %s", err, q)
		} else {
			fmt.Printf("Successfully executed: %s\n", q)
		}
	}
	fmt.Println("Migration done!")
}
