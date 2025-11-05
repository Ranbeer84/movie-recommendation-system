"""
Database Debug Script
Check what's actually in your Neo4j database
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.neo4j_service import Neo4jService
from dotenv import load_dotenv

load_dotenv()

def debug_database():
    print("🔍 DEBUGGING DATABASE CONTENTS")
    print("=" * 50)
    
    neo4j = Neo4jService()
    
    try:
        # Check total nodes
        total_nodes = neo4j.execute_query("MATCH (n) RETURN count(n) as total")[0]['total']
        print(f"📊 Total nodes in database: {total_nodes}")
        
        if total_nodes == 0:
            print("❌ Database is empty! Run the init_db.py script first.")
            return
        
        # Check node types
        print("\n📋 Node types:")
        node_types = neo4j.execute_query(
            "MATCH (n) RETURN labels(n)[0] as label, count(n) as count ORDER BY count DESC"
        )
        for record in node_types:
            print(f"   {record['label']}: {record['count']}")
        
        # Check movies specifically
        print("\n🎬 Movie details:")
        movies = neo4j.execute_query(
            """
            MATCH (m:Movie) 
            RETURN m.id as id, m.title as title, m.year as year, 
                   m.avg_rating as avg_rating, m.imdb_rating as imdb_rating,
                   m.rating_count as rating_count
            ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC 
            LIMIT 5
            """
        )
        
        if not movies:
            print("   ❌ No movies found in database!")
            
            # Check if there are nodes with Movie label but different structure
            movie_nodes = neo4j.execute_query("MATCH (m:Movie) RETURN m LIMIT 3")
            if movie_nodes:
                print("\n🔍 Sample Movie node structure:")
                for i, movie in enumerate(movie_nodes):
                    print(f"   Movie {i+1}: {dict(movie['m'])}")
        else:
            print("   ✅ Sample movies found:")
            for movie in movies:
                rating = movie.get('avg_rating') or movie.get('imdb_rating') or 0
                print(f"   📽️  {movie['title']} ({movie['year']}) - Rating: {rating}")
        
        # Check genres
        print(f"\n🎭 Genres:")
        genres = neo4j.execute_query("MATCH (g:Genre) RETURN g.name as name ORDER BY g.name LIMIT 10")
        if genres:
            genre_list = [g['name'] for g in genres]
            print(f"   ✅ Found {len(genres)} genres: {', '.join(genre_list[:5])}...")
        else:
            print("   ❌ No genres found!")
        
        # Check relationships
        print(f"\n🔗 Relationships:")
        rels = neo4j.execute_query(
            "MATCH ()-[r]->() RETURN type(r) as rel_type, count(r) as count ORDER BY count DESC"
        )
        for rel in rels:
            print(f"   {rel['rel_type']}: {rel['count']}")
        
        # Test the exact query from movies route
        print(f"\n🧪 Testing movies route query:")
        route_query = """
        MATCH (m:Movie)
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.avg_rating DESC
        SKIP 0 LIMIT 5
        """
        
        route_movies = neo4j.execute_query(route_query)
        if route_movies:
            print(f"   ✅ Route query returns {len(route_movies)} movies")
            for movie in route_movies:
                print(f"   📽️  {movie['title']} - avg_rating: {movie['avg_rating']}")
        else:
            print("   ❌ Route query returns no movies!")
            
            # Try alternative query
            print("\n🔄 Trying alternative query with imdb_rating:")
            alt_query = """
            MATCH (m:Movie)
            RETURN m.id as id, m.title as title, m.year as year,
                   m.poster_url as poster_url, 
                   coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
                   m.plot as plot, coalesce(m.rating_count, 0) as rating_count
            ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC
            LIMIT 5
            """
            
            alt_movies = neo4j.execute_query(alt_query)
            if alt_movies:
                print(f"   ✅ Alternative query returns {len(alt_movies)} movies")
                for movie in alt_movies:
                    print(f"   📽️  {movie['title']} - rating: {movie['avg_rating']}")
            else:
                print("   ❌ Even alternative query returns no movies!")
        
    except Exception as e:
        print(f"❌ Error debugging database: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        neo4j.close()
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    debug_database()