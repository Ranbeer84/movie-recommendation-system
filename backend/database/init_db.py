# Create this file as backend/database/init_db.py

"""
🎬 Movie Recommendation System Database Setup

This script will:
1. Connect to your Neo4j database
2. Create the database structure (constraints and indexes)  
3. Add sample movies, genres, and users for testing
4. Create sample ratings so recommendations work immediately

Run this ONCE after setting up Neo4j to get started!
"""

import sys
import os
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
            
            # Indexes for fast searching
            "CREATE INDEX user_email_index IF NOT EXISTS FOR (u:User) ON (u.email)",
            "CREATE INDEX movie_title_index IF NOT EXISTS FOR (m:Movie) ON (m.title)",
            "CREATE INDEX movie_rating_index IF NOT EXISTS FOR (m:Movie) ON (m.avg_rating)",
        ]
        
        for constraint in constraints:
            try:
                self.neo4j.execute_query(constraint)
                print(f"✅ {constraint}")
            except Exception as e:
                print(f"⚠️  {constraint} - {e}")
        
        print("📋 Database structure created!")
    
    def create_sample_genres(self):
        """Create movie genres"""
        print("\n🎭 Creating movie genres...")
        
        genres = [
            "Action", "Adventure", "Animation", "Comedy", "Crime", 
            "Documentary", "Drama", "Family", "Fantasy", "History",
            "Horror", "Music", "Mystery", "Romance", "Science Fiction",
            "Thriller", "War", "Western"
        ]
        
        for genre in genres:
            self.neo4j.execute_write_query(
                "CREATE (g:Genre {name: $name})",
                {'name': genre}
            )
        
        print(f"✅ Created {len(genres)} genres!")
    
    def create_sample_movies(self):
        """Create sample movies with genres"""
        print("\n🎬 Creating sample movies...")
        
        movies = [
            {
                'id': 'movie_1', 'title': 'The Matrix', 'year': 1999,
                'plot': 'A computer programmer discovers reality is a simulation.',
                'avg_rating': 4.3, 'rating_count': 150,
                'poster_url': 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
                'genres': ['Action', 'Science Fiction']
            },
            {
                'id': 'movie_2', 'title': 'Inception', 'year': 2010,
                'plot': 'A thief steals corporate secrets through dream-sharing technology.',
                'avg_rating': 4.5, 'rating_count': 200,
                'poster_url': 'https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg',
                'genres': ['Action', 'Science Fiction', 'Thriller']
            },
            {
                'id': 'movie_3', 'title': 'The Godfather', 'year': 1972,
                'plot': 'The aging patriarch of an organized crime dynasty transfers control to his reluctant son.',
                'avg_rating': 4.7, 'rating_count': 180,
                'poster_url': 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
                'genres': ['Crime', 'Drama']
            },
            {
                'id': 'movie_4', 'title': 'Pulp Fiction', 'year': 1994,
                'plot': 'The lives of two mob hitmen, a boxer, and other criminals intertwine.',
                'avg_rating': 4.4, 'rating_count': 160,
                'poster_url': 'https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg',
                'genres': ['Crime', 'Drama']
            },
            {
                'id': 'movie_5', 'title': 'Forrest Gump', 'year': 1994,
                'plot': 'The presidencies of Kennedy and Johnson through the eyes of an Alabama man.',
                'avg_rating': 4.2, 'rating_count': 190,
                'poster_url': 'https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg',
                'genres': ['Drama', 'Romance']
            },
            {
                'id': 'movie_6', 'title': 'The Dark Knight', 'year': 2008,
                'plot': 'Batman faces the Joker, a criminal mastermind who wants to plunge Gotham into anarchy.',
                'avg_rating': 4.6, 'rating_count': 220,
                'poster_url': 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
                'genres': ['Action', 'Crime', 'Drama']
            },
            {
                'id': 'movie_7', 'title': 'Interstellar', 'year': 2014,
                'plot': 'A team of explorers travel through a wormhole in space to save humanity.',
                'avg_rating': 4.4, 'rating_count': 170,
                'poster_url': 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
                'genres': ['Adventure', 'Drama', 'Science Fiction']
            },
            {
                'id': 'movie_8', 'title': 'The Shawshank Redemption', 'year': 1994,
                'plot': 'Two imprisoned men bond over years, finding solace and redemption.',
                'avg_rating': 4.8, 'rating_count': 250,
                'poster_url': 'https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
                'genres': ['Drama']
            },
            {
                'id': 'movie_9', 'title': 'Toy Story', 'year': 1995,
                'plot': 'A cowboy doll is profoundly threatened when a new spaceman figure supplants him.',
                'avg_rating': 4.0, 'rating_count': 140,
                'poster_url': 'https://image.tmdb.org/t/p/w500/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg',
                'genres': ['Animation', 'Adventure', 'Family']
            },
            {
                'id': 'movie_10', 'title': 'Avatar', 'year': 2009,
                'plot': 'A paraplegic Marine dispatched to Pandora on a unique mission.',
                'avg_rating': 3.9, 'rating_count': 180,
                'poster_url': 'https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg',
                'genres': ['Action', 'Adventure', 'Fantasy']
            }
        ]
        
        for movie in movies:
            # Create movie node
            self.neo4j.execute_write_query(
                """
                CREATE (m:Movie {
                    id: $id, title: $title, year: $year, plot: $plot,
                    avg_rating: $avg_rating, rating_count: $rating_count,
                    poster_url: $poster_url
                })
                """,
                {k: v for k, v in movie.items() if k != 'genres'}
            )
            
            # Connect movie to genres
            for genre in movie['genres']:
                self.neo4j.execute_write_query(
                    """
                    MATCH (m:Movie {id: $movie_id}), (g:Genre {name: $genre})
                    CREATE (m)-[:HAS_GENRE]->(g)
                    """,
                    {'movie_id': movie['id'], 'genre': genre}
                )
        
        print(f"✅ Created {len(movies)} movies with genre relationships!")
    
    def create_sample_users_and_ratings(self):
        """Create sample users and their movie ratings"""
        print("\n👥 Creating sample users and ratings...")
        
        users_data = [
            {
                'user': {
                    'id': 'user_demo_1',
                    'username': 'alice_movie_fan',
                    'email': 'alice@demo.com',
                    'password': 'demo123'  # Will be hashed
                },
                'ratings': [
                    {'movie_id': 'movie_1', 'rating': 5.0, 'review': 'Mind-blowing!'},
                    {'movie_id': 'movie_2', 'rating': 4.5, 'review': 'Incredible concept!'},
                    {'movie_id': 'movie_6', 'rating': 4.8, 'review': 'Best superhero movie!'},
                    {'movie_id': 'movie_7', 'rating': 4.0, 'review': 'Beautiful and complex'},
                    {'movie_id': 'movie_8', 'rating': 5.0, 'review': 'Perfect movie'}
                ]
            },
            {
                'user': {
                    'id': 'user_demo_2',
                    'username': 'bob_cinema',
                    'email': 'bob@demo.com',
                    'password': 'demo123'
                },
                'ratings': [
                    {'movie_id': 'movie_1', 'rating': 4.0, 'review': 'Great sci-fi'},
                    {'movie_id': 'movie_3', 'rating': 5.0, 'review': 'Masterpiece!'},
                    {'movie_id': 'movie_4', 'rating': 4.5, 'review': 'Tarantino genius'},
                    {'movie_id': 'movie_8', 'rating': 4.7, 'review': 'So inspiring'},
                    {'movie_id': 'movie_5', 'rating': 4.2, 'review': 'Heartwarming'}
                ]
            },
            {
                'user': {
                    'id': 'user_demo_3',
                    'username': 'charlie_critic',
                    'email': 'charlie@demo.com',
                    'password': 'demo123'
                },
                'ratings': [
                    {'movie_id': 'movie_2', 'rating': 5.0, 'review': 'Nolan at his best!'},
                    {'movie_id': 'movie_3', 'rating': 4.9, 'review': 'Cinema perfection'},
                    {'movie_id': 'movie_6', 'rating': 4.6, 'review': 'Dark and brilliant'},
                    {'movie_id': 'movie_7', 'rating': 4.3, 'review': 'Visually stunning'},
                    {'movie_id': 'movie_9', 'rating': 3.8, 'review': 'Good for kids'}
                ]
            }
        ]
        
        for user_data in users_data:
            # Create user with hashed password  
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
            
            # Create ratings
            for rating in user_data['ratings']:
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
                        'movie_id': rating['movie_id'],
                        'rating': rating['rating'],
                        'review': rating['review']
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
    
    def run_full_setup(self, clear_existing=False):
        """Run the complete database setup"""
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
            self.create_constraints_and_indexes()
            self.create_sample_genres()
            self.create_sample_movies()
            self.create_sample_users_and_ratings()
            self.verify_setup()
            
            print("\n" + "="*50)
            print("🎉 DATABASE SETUP COMPLETE!")
            print("="*50)
            print("✅ You can now run the Flask app with: python app.py")
            print("✅ Demo users are ready to test recommendations!")
            print("✅ Try logging in with: alice@demo.com / demo123")
            print("="*50)
            
        except Exception as e:
            print(f"\n❌ Setup failed: {e}")
            raise
        
        finally:
            self.neo4j.close()

def main():
    """Main function to run the setup"""
    setup = DatabaseSetup()
    
    # Ask user if they want to clear existing data
    print("🎬 Movie Recommendation System - Database Setup")
    print("\nOptions:")
    print("1. Set up database (preserve existing data)")
    print("2. Clear database and set up fresh (⚠️  deletes everything)")
    
    choice = input("\nEnter your choice (1 or 2): ").strip()
    
    if choice == '1':
        setup.run_full_setup(clear_existing=False)
    elif choice == '2':
        setup.run_full_setup(clear_existing=True)
    else:
        print("❌ Invalid choice. Please run again and choose 1 or 2.")

if __name__ == "__main__":
    main()