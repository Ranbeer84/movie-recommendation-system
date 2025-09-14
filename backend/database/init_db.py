# Create this file as backend/database/init_db.py

"""
🎬 Movie Recommendation System Database Setup with CSV Import

This script will:
1. Connect to your Neo4j database
2. Create the database structure (constraints and indexes)  
3. Import movies from your CSV file
4. Create sample users and ratings for testing
5. Handle genres, directors, and actors from the CSV

Place your CSV file in: backend/data/movies.csv
"""

import sys
import os
import pandas as pd
import uuid
from datetime import datetime
# Add the parent directory to the path so we can import our services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.neo4j_service import Neo4jService
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Load environment variables
load_dotenv()

class DatabaseSetup:
    def __init__(self):
        print("🔌 Connecting to Neo4j database...")
        self.neo4j = Neo4jService()
        print("✅ Connected successfully!")
    
    def clear_database(self):
        """⚠️ WARNING: This deletes ALL data in the database!"""
        print("\n⚠️  CLEARING ALL DATABASE DATA...")
        self.neo4j.execute_query("MATCH (n) DETACH DELETE n")
        print("🗑️  Database cleared!")
    
    def create_constraints_and_indexes(self):
        """Create database constraints and indexes for better performance"""
        print("\n📋 Creating database constraints and indexes...")
        
        constraints = [
            # Unique constraints (prevent duplicates)
            "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE",
            "CREATE CONSTRAINT movie_id_unique IF NOT EXISTS FOR (m:Movie) REQUIRE m.id IS UNIQUE", 
            "CREATE CONSTRAINT genre_name_unique IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE",
            "CREATE CONSTRAINT director_name_unique IF NOT EXISTS FOR (d:Director) REQUIRE d.name IS UNIQUE",
            "CREATE CONSTRAINT actor_name_unique IF NOT EXISTS FOR (a:Actor) REQUIRE a.name IS UNIQUE",
            
            # Indexes for fast searching
            "CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)",
            "CREATE INDEX movie_title_index IF NOT EXISTS FOR (m:Movie) ON (m.title)",
            "CREATE INDEX movie_rating_index IF NOT EXISTS FOR (m:Movie) ON (m.imdb_rating)",
            "CREATE INDEX movie_year_index IF NOT EXISTS FOR (m:Movie) ON (m.year)",
        ]
        
        for constraint in constraints:
            try:
                self.neo4j.execute_query(constraint)
                print(f"✅ {constraint}")
            except Exception as e:
                print(f"⚠️  {constraint} - {e}")
        
        print("📋 Database structure created!")
    
    def load_csv_data(self, csv_path="backend/data/movies.csv"):
        """Load and validate CSV data"""
        print(f"\n📄 Loading CSV data from: {csv_path}")
        
        if not os.path.exists(csv_path):
            print(f"❌ CSV file not found: {csv_path}")
            print("📁 Please place your CSV file at: backend/data/movies.csv")
            return None
        
        try:
            df = pd.read_csv(csv_path)
            print(f"✅ Loaded {len(df)} movies from CSV")
            
            # Show sample data
            print("\n📊 Sample data:")
            print(df.head(2)[['Series_Title', 'Released_Year', 'Genre', 'IMDB_Rating']].to_string())
            
            return df
            
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            return None
    
    def clean_and_parse_data(self, df):
        """Clean and prepare the CSV data for Neo4j"""
        print("\n🧹 Cleaning and parsing data...")
        
        # Clean numeric fields (using exact CSV column names)
        df['IMDB_Rating'] = pd.to_numeric(df['IMDB_Rating'], errors='coerce')
        df['Released_Year'] = pd.to_numeric(df['Released_Year'], errors='coerce')
        df['Meta_score'] = pd.to_numeric(df['Meta_score'], errors='coerce')
        
        # Clean votes (remove commas)
        df['No_of_Votes'] = df['No_of_Votes'].astype(str).str.replace(',', '').replace('', '0')
        df['No_of_Votes'] = pd.to_numeric(df['No_of_Votes'], errors='coerce')
        
        # Clean string fields (using exact CSV column names)
        df['Series_Title'] = df['Series_Title'].fillna('Unknown Title')
        df['Overview'] = df['Overview'].fillna('No overview available')
        df['Director'] = df['Director'].fillna('Unknown Director')
        df['Poster_Link'] = df['Poster_Link'].fillna('')
        
        # Parse runtime to minutes (FIXED: using raw string)
        df['Runtime_Minutes'] = df['Runtime'].str.extract(r'(\d+)').astype(float)
        
        # Parse genres (split by comma)
        df['Genre_List'] = df['Genre'].apply(lambda x: [g.strip() for g in str(x).split(',')] if pd.notna(x) else [])
        
        # Parse cast
        cast_columns = ['Star1', 'Star2', 'Star3', 'Star4']
        df['Cast_List'] = df[cast_columns].apply(
            lambda row: [actor for actor in row if pd.notna(actor) and str(actor).strip()], 
            axis=1
        )
        
        # Remove rows with missing critical data (using exact CSV column names)
        df = df.dropna(subset=['Series_Title', 'IMDB_Rating'])
        
        print(f"✅ Cleaned data: {len(df)} valid movies")
        return df
    
    def create_genres_from_csv(self, df):
        """Extract and create all unique genres from the CSV"""
        print("\n🎭 Creating genres from CSV data...")
        
        all_genres = set()
        for genre_list in df['Genre_List']:
            all_genres.update(genre_list)
        
        all_genres = [g for g in all_genres if g and g != 'nan']
        
        for genre in all_genres:
            self.neo4j.execute_write_query(
                "MERGE (g:Genre {name: $name})",
                {'name': genre}
            )
        
        print(f"✅ Created {len(all_genres)} genres!")
        return all_genres
    
    def create_directors_from_csv(self, df):
        """Create director nodes"""
        print("\n🎬 Creating directors...")
        
        directors = df['Director'].dropna().unique()
        
        for director in directors:
            if director and str(director).strip():
                self.neo4j.execute_write_query(
                    "MERGE (d:Director {name: $name})",
                    {'name': str(director).strip()}
                )
        
        print(f"✅ Created {len(directors)} directors!")
    
    def create_actors_from_csv(self, df):
        """Create actor nodes"""
        print("\n🎭 Creating actors...")
        
        all_actors = set()
        for cast_list in df['Cast_List']:
            all_actors.update(cast_list)
        
        all_actors = [actor for actor in all_actors if actor and str(actor).strip()]
        
        for actor in all_actors:
            self.neo4j.execute_write_query(
                "MERGE (a:Actor {name: $name})",
                {'name': str(actor).strip()}
            )
        
        print(f"✅ Created {len(all_actors)} actors!")
    
    def create_movies_from_csv(self, df):
        """Create movie nodes from CSV data"""
        print(f"\n🎬 Creating {len(df)} movies from CSV...")
        
        created_count = 0
        
        for idx, row in df.iterrows():
            try:
                # Generate unique movie ID
                # movie_id = f"movie_{uuid.uuid4().hex[:8]}"
                movie_id = str(row.iloc[0])
                
                # Extract cast data from the row
                cast_list = row['Cast_List']  # This is already parsed in clean_and_parse_data
                
                # Prepare movie data (using exact CSV column names)
                movie_data = {
                    'id': movie_id,
                    'title': str(row['Series_Title']),
                    'year': int(row['Released_Year']) if pd.notna(row['Released_Year']) else None,
                    'plot': str(row['Overview']) if pd.notna(row['Overview']) else 'No overview available',
                    'imdb_rating': float(row['IMDB_Rating']) if pd.notna(row['IMDB_Rating']) else None,
                    'meta_score': int(row['Meta_score']) if pd.notna(row['Meta_score']) else None,
                    'runtime_minutes': int(row['Runtime_Minutes']) if pd.notna(row['Runtime_Minutes']) else None,
                    'certificate': str(row['Certificate']) if pd.notna(row['Certificate']) else None,
                    'poster_url': str(row['Poster_Link']) if pd.notna(row['Poster_Link']) else None,
                    'votes_count': int(row['No_of_Votes']) if pd.notna(row['No_of_Votes']) else 0,
                    'gross': str(row['Gross']) if pd.notna(row['Gross']) else None,
                    
                    # ADD CAST DATA AS PROPERTIES (for frontend compatibility)
                    'Star1': str(row['Star1']) if pd.notna(row['Star1']) else None,
                    'Star2': str(row['Star2']) if pd.notna(row['Star2']) else None,
                    'Star3': str(row['Star3']) if pd.notna(row['Star3']) else None,
                    'Star4': str(row['Star4']) if pd.notna(row['Star4']) else None,
                    'stars': ', '.join(cast_list) if cast_list else None,  # CSV format for frontend
                    'cast': ', '.join(cast_list) if cast_list else None    # Alternative field name
                }
                
                # Create movie node with cast properties
                self.neo4j.execute_write_query(
                    """
                    CREATE (m:Movie {
                        id: $id, title: $title, year: $year, plot: $plot,
                        imdb_rating: $imdb_rating, meta_score: $meta_score,
                        runtime_minutes: $runtime_minutes, certificate: $certificate,
                        poster_url: $poster_url, votes_count: $votes_count, gross: $gross,
                        avg_rating: $imdb_rating, rating_count: 0,
                        Star1: $Star1, Star2: $Star2, Star3: $Star3, Star4: $Star4,
                        stars: $stars, cast: $cast
                    })
                    """,
                    movie_data
                )
                
                # Connect to genres (keep existing code)
                for genre in row['Genre_List']:
                    if genre and genre.strip():
                        self.neo4j.execute_write_query(
                            """
                            MATCH (m:Movie {id: $movie_id}), (g:Genre {name: $genre})
                            MERGE (m)-[:HAS_GENRE]->(g)
                            """,
                            {'movie_id': movie_id, 'genre': genre.strip()}
                        )
                
                # Connect to director (keep existing code)
                if pd.notna(row['Director']) and str(row['Director']).strip():
                    self.neo4j.execute_write_query(
                        """
                        MATCH (m:Movie {id: $movie_id}), (d:Director {name: $director})
                        MERGE (m)-[:DIRECTED_BY]->(d)
                        """,
                        {'movie_id': movie_id, 'director': str(row['Director']).strip()}
                    )
                
                # Connect to actors (keep existing relationship code for advanced queries)
                for actor in cast_list:
                    if actor and str(actor).strip():
                        self.neo4j.execute_write_query(
                            """
                            MATCH (m:Movie {id: $movie_id}), (a:Actor {name: $actor})
                            MERGE (m)-[:STARS]->(a)
                            """,
                            {'movie_id': movie_id, 'actor': str(actor).strip()}
                        )
                
                created_count += 1
                
                # Progress indicator
                if created_count % 50 == 0:
                    print(f"  📊 Progress: {created_count}/{len(df)} movies created")
                    
            except Exception as e:
                print(f"❌ Error creating movie {row.get('Series_Title', 'Unknown')}: {e}")
                continue
        
        print(f"✅ Successfully created {created_count} movies with cast data!")
    
    def create_sample_users_and_ratings(self):
        """Create sample users with ratings for testing recommendations"""
        print("\n👥 Creating sample users and ratings...")
        
        # Get some random movies for ratings
        movies_result = self.neo4j.execute_query(
            "MATCH (m:Movie) WHERE m.imdb_rating >= 8.0 RETURN m.id as id, m.title as title LIMIT 20"
        )
        
        if not movies_result:
            print("⚠️  No movies found for creating sample ratings")
            return
        
        movie_ids = [record['id'] for record in movies_result]
        
        users_data = [
            {
                'user': {
                    'id': 'user_demo_1',
                    'username': 'alice_movie_fan',
                    'email': 'alice@demo.com',
                    'password': 'demo123'
                },
                'movie_ratings': movie_ids[:8]  # Rate first 8 movies
            },
            {
                'user': {
                    'id': 'user_demo_2',
                    'username': 'bob_cinema',
                    'email': 'bob@demo.com',
                    'password': 'demo123'
                },
                'movie_ratings': movie_ids[5:13]  # Rate movies 5-13
            },
            {
                'user': {
                    'id': 'user_demo_3',
                    'username': 'charlie_critic',
                    'email': 'charlie@demo.com',
                    'password': 'demo123'
                },
                'movie_ratings': movie_ids[10:18]  # Rate movies 10-18
            }
        ]
        
        for user_data in users_data:
            # Create user
            user_info = user_data['user'].copy()
            user_info['password_hash'] = generate_password_hash(user_info.pop('password'))
            
            self.neo4j.execute_write_query(
                """
                CREATE (u:User {
                    id: $id, username: $username, email: $email,
                    password_hash: $password_hash, created_at: datetime()
                })
                """,
                user_info
            )
            
            # Create ratings (random ratings between 3.5 and 5.0)
            import random
            for movie_id in user_data['movie_ratings']:
                rating = round(random.uniform(3.5, 5.0), 1)
                reviews = [
                    "Great movie!", "Loved it!", "Amazing cinematography",
                    "Excellent story", "Must watch", "Brilliant acting",
                    "Very engaging", "Masterpiece"
                ]
                
                self.neo4j.execute_write_query(
                    """
                    MATCH (u:User {id: $user_id}), (m:Movie {id: $movie_id})
                    CREATE (u)-[:RATED {
                        rating: $rating,
                        review: $review,
                        timestamp: datetime()
                    }]->(m)
                    """,
                    {
                        'user_id': user_data['user']['id'],
                        'movie_id': movie_id,
                        'rating': rating,
                        'review': random.choice(reviews)
                    }
                )
        
        print(f"✅ Created {len(users_data)} demo users with ratings!")
        print("\n🔐 Demo user credentials:")
        for user_data in users_data:
            print(f"   📧 {user_data['user']['email']} / 🔑 demo123")
    
    def verify_setup(self):
        """Check that everything was created successfully"""
        print("\n🔍 Verifying database setup...")
        
        # Count nodes
        result = self.neo4j.execute_query(
            """
            MATCH (n) RETURN labels(n)[0] as label, count(n) as count
            ORDER BY label
            """
        )
        
        print("📊 Database contents:")
        total_nodes = 0
        for record in result:
            print(f"   {record['label']}: {record['count']} nodes")
            total_nodes += record['count']
        
        # Count relationships
        rel_result = self.neo4j.execute_query(
            "MATCH ()-[r]->() RETURN type(r) as rel_type, count(r) as count ORDER BY rel_type"
        )
        
        print("🔗 Relationships:")
        total_rels = 0
        for record in rel_result:
            print(f"   {record['rel_type']}: {record['count']} relationships")
            total_rels += record['count']
        
        print(f"\n✅ Setup complete! Total: {total_nodes} nodes, {total_rels} relationships")
        
        # Show some sample data
        sample_movies = self.neo4j.execute_query(
            """
            MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre)
            RETURN m.title as title, m.year as year, m.imdb_rating as rating, 
                   collect(g.name) as genres
            ORDER BY m.imdb_rating DESC LIMIT 3
            """
        )
        
        print("\n🎬 Top 3 movies in database:")
        for movie in sample_movies:
            genres_str = ", ".join(movie['genres'])
            print(f"   📽️  {movie['title']} ({movie['year']}) - {movie['rating']} - {genres_str}")
    
    def run_full_setup(self, clear_existing=False, csv_path="backend/data/movies.csv"):
        """Run the complete database setup with CSV import"""
        print("🎬 MOVIE RECOMMENDATION DATABASE SETUP")
        print("="*50)
        
        if clear_existing:
            response = input("\n⚠️  This will DELETE ALL existing data! Continue? (yes/no): ")
            if response.lower() != 'yes':
                print("❌ Setup cancelled.")
                return
            self.clear_database()
        
        print("\n🚀 Starting database setup...")
        
        try:
            # Load CSV data
            df = self.load_csv_data(csv_path)
            if df is None:
                return
            
            # Clean and parse data
            df = self.clean_and_parse_data(df)
            if df.empty:
                print("❌ No valid data found in CSV")
                return
            
            # Create database structure
            self.create_constraints_and_indexes()
            
            # Create entities from CSV
            self.create_genres_from_csv(df)
            self.create_directors_from_csv(df)
            self.create_actors_from_csv(df)
            self.create_movies_from_csv(df)
            
            # Create sample users for testing
            self.create_sample_users_and_ratings()
            
            # Verify everything worked
            self.verify_setup()
            
            print("\n" + "="*50)
            print("🎉 DATABASE SETUP COMPLETE!")
            print("="*50)
            print(f"✅ Imported {len(df)} movies from CSV")
            print("✅ Created genres, directors, and actors")
            print("✅ Demo users are ready to test recommendations!")
            print("✅ Try logging in with: alice@demo.com / demo123")
            print("✅ You can now run the Flask app with: python app.py")
            print("="*50)
            
        except Exception as e:
            print(f"\n❌ Setup failed: {e}")
            import traceback
            traceback.print_exc()
            raise
        
        finally:
            self.neo4j.close()

def main():
    """Main function to run the setup"""
    setup = DatabaseSetup()
    
    # Ask user for CSV file path
    print("🎬 Movie Recommendation System - Database Setup with CSV Import")
    print("\n📁 CSV File Location:")
    csv_path = input("Enter CSV file path (default: backend/data/movies.csv): ").strip()
    if not csv_path:
        csv_path = "backend/data/movies.csv"
    
    print(f"\n📄 Using CSV file: {csv_path}")
    
    # Ask about clearing existing data
    print("\nOptions:")
    print("1. Import CSV and preserve existing data")
    print("2. Clear database and import CSV fresh (⚠️  deletes everything)")
    
    choice = input("\nEnter your choice (1 or 2): ").strip()
    
    if choice == '1':
        setup.run_full_setup(clear_existing=False, csv_path=csv_path)
    elif choice == '2':
        setup.run_full_setup(clear_existing=True, csv_path=csv_path)
    else:
        print("❌ Invalid choice. Please run again and choose 1 or 2.")

if __name__ == "__main__":
    main()