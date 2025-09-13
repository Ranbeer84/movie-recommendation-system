import logging
from typing import List, Dict, Any

class RecommendationEngine:
    """
    Fixed recommendation system based on your actual Neo4j data structure
    """
    
    def __init__(self, neo4j_service):
        self.neo4j = neo4j_service
        self.logger = logging.getLogger(__name__)
    
    def get_collaborative_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        SIMPLIFIED Collaborative Filtering - works with your data structure
        """
        
        query = """
        // Find users who have similar ratings to our target user
        MATCH (target:User {id: $userId})-[tr:RATED]->(m:Movie)<-[sr:RATED]-(similar:User)
        WHERE target <> similar 
          AND tr.rating >= 3.0 
          AND sr.rating >= 3.5
          AND abs(tr.rating - sr.rating) <= 1.5
        
        // Count common movies and calculate similarity
        WITH target, similar, 
             COUNT(m) as commonMovies,
             AVG(abs(tr.rating - sr.rating)) as avgDiff
        WHERE commonMovies >= 2  // Reduced from 3 for your smaller dataset
        
        // Get recommendations from similar users
        MATCH (similar)-[r:RATED]->(rec:Movie)
        WHERE NOT EXISTS((target)-[:RATED]->(rec))  // User hasn't rated this movie
          AND r.rating >= 4.0  // Similar user liked it
        
        // Score and return results
        WITH rec, 
             AVG(r.rating) as avgRating, 
             COUNT(r) as voteCount,
             AVG(commonMovies) as avgSimilarity
        WHERE voteCount >= 1
        
        RETURN rec.id as id, 
               rec.title as title, 
               CASE WHEN rec.year IS NOT NULL THEN rec.year ELSE 0 END as year,
               rec.poster_url as poster_url,
               rec.plot as plot,
               avgRating as recommendation_score,
               rec.avg_rating as avg_rating,
               voteCount as vote_count
        ORDER BY avgRating DESC, rec.avg_rating DESC
        LIMIT $limit
        """
        
        try:
            results = self.neo4j.execute_query(query, {'userId': user_id, 'limit': limit})
            self.logger.info(f"🎯 Found {len(results)} collaborative recommendations for user {user_id}")
            return results
        except Exception as e:
            self.logger.error(f"❌ Error getting collaborative recommendations: {e}")
            return []
    
    def get_content_based_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        SIMPLIFIED Content-Based Filtering - works with your data structure
        """
        
        query = """
        // Find user's favorite genres (rating 4.0+)
        MATCH (u:User {id: $userId})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WHERE r.rating >= 4.0
        
        // Calculate genre preferences
        WITH u, g, 
             COUNT(m) as genreCount, 
             AVG(r.rating) as avgGenreRating
        ORDER BY genreCount DESC, avgGenreRating DESC
        LIMIT 3  // Top 3 favorite genres
        
        // Find good movies in these genres that user hasn't rated
        MATCH (g)<-[:HAS_GENRE]-(rec:Movie)
        WHERE NOT EXISTS((u)-[:RATED]->(rec))  // User hasn't rated it
          AND rec.avg_rating >= 3.5  // It's a good movie
        
        // Score based on genre preferences
        WITH rec, 
             SUM(genreCount * avgGenreRating) as contentScore,
             COUNT(DISTINCT g) as genreMatches,
             AVG(avgGenreRating) as avgUserGenreRating
        WHERE genreMatches >= 1
        
        RETURN rec.id as id,
               rec.title as title,
               CASE WHEN rec.year IS NOT NULL THEN rec.year ELSE 0 END as year,
               rec.poster_url as poster_url,
               rec.plot as plot,
               contentScore as recommendation_score,
               rec.avg_rating as avg_rating,
               genreMatches as genre_match_count
        ORDER BY contentScore DESC, rec.avg_rating DESC
        LIMIT $limit
        """
        
        try:
            results = self.neo4j.execute_query(query, {'userId': user_id, 'limit': limit})
            self.logger.info(f"🎬 Found {len(results)} content-based recommendations for user {user_id}")
            return results
        except Exception as e:
            self.logger.error(f"❌ Error getting content-based recommendations: {e}")
            return []
    
    def get_hybrid_recommendations(self, user_id: str, limit: int = 15) -> List[Dict[str, Any]]:
        """
        HYBRID APPROACH - Best of both worlds!
        """
        
        # Get recommendations from both methods
        collab_recs = self.get_collaborative_recommendations(user_id, limit * 2)
        content_recs = self.get_content_based_recommendations(user_id, limit * 2)
        
        # Combine and weight the recommendations
        movie_scores = {}
        
        # Add collaborative filtering recommendations (60% weight)
        for rec in collab_recs:
            movie_id = rec['id']
            score = rec.get('recommendation_score', 3.0) * 0.6
            movie_scores[movie_id] = {
                'score': score,
                'movie': rec,
                'sources': ['collaborative']
            }
        
        # Add content-based recommendations (40% weight)
        for rec in content_recs:
            movie_id = rec['id']
            score = rec.get('recommendation_score', 3.0) * 0.4
            
            if movie_id in movie_scores:
                # Movie appears in both - combine scores!
                movie_scores[movie_id]['score'] += score
                movie_scores[movie_id]['sources'].append('content')
            else:
                movie_scores[movie_id] = {
                    'score': score,
                    'movie': rec,
                    'sources': ['content']
                }
        
        # Sort by combined score and return top recommendations
        sorted_movies = sorted(
            movie_scores.items(), 
            key=lambda x: x[1]['score'], 
            reverse=True
        )
        
        hybrid_results = []
        for movie_id, data in sorted_movies[:limit]:
            movie_data = data['movie'].copy()
            movie_data['recommendation_score'] = data['score']
            movie_data['recommendation_sources'] = data['sources']
            hybrid_results.append(movie_data)
        
        self.logger.info(f"🚀 Generated {len(hybrid_results)} hybrid recommendations for user {user_id}")
        return hybrid_results
    
    def get_popular_movies(self, genre: str = None, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Get popular movies - FIXED for your data structure (no rating_count property)
        """
        
        if genre:
            query = """
            MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {name: $genre})
            WHERE m.avg_rating >= 3.5  // Removed rating_count filter
            RETURN m.id as id, m.title as title, 
                   CASE WHEN m.year IS NOT NULL THEN m.year ELSE 0 END as year,
                   m.poster_url as poster_url, m.avg_rating as avg_rating,
                   m.plot as plot
            ORDER BY m.avg_rating DESC
            LIMIT $limit
            """
            params = {'genre': genre, 'limit': limit}
        else:
            query = """
            MATCH (m:Movie)
            WHERE m.avg_rating >= 4.0  // Only very good movies
            RETURN m.id as id, m.title as title, 
                   CASE WHEN m.year IS NOT NULL THEN m.year ELSE 0 END as year,
                   m.poster_url as poster_url, m.avg_rating as avg_rating,
                   m.plot as plot
            ORDER BY m.avg_rating DESC
            LIMIT $limit
            """
            params = {'limit': limit}
        
        try:
            results = self.neo4j.execute_query(query, params)
            self.logger.info(f"📈 Found {len(results)} popular movies")
            return results
        except Exception as e:
            self.logger.error(f"❌ Error getting popular movies: {e}")
            return []
    
    def test_user_data(self, user_id: str):
        """Debug method to check what data exists for a user"""
        
        try:
            # Check if user exists
            user_check = """
            MATCH (u:User {id: $user_id})
            RETURN u.id as id, u.username as username
            """
            user_result = self.neo4j.execute_query(user_check, {'user_id': user_id})
            print(f"🔍 User exists: {len(user_result) > 0}")
            if user_result:
                print(f"🔍 User data: {user_result[0]}")
            
            # Check user ratings
            rating_check = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
            RETURN count(r) as total_ratings, avg(r.rating) as avg_rating,
                   collect(m.title)[0..5] as sample_movies
            """
            rating_result = self.neo4j.execute_query(rating_check, {'user_id': user_id})
            print(f"🔍 Rating data: {rating_result}")
            
            # Check genre preferences
            genre_check = """
            MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
            WHERE r.rating >= 4.0
            RETURN g.name as genre, count(*) as count, avg(r.rating) as avg_rating
            ORDER BY count DESC
            LIMIT 5
            """
            genre_result = self.neo4j.execute_query(genre_check, {'user_id': user_id})
            print(f"🔍 Genre preferences: {genre_result}")
            
            # Test collaborative data
            collab_check = """
            MATCH (target:User {id: $user_id})-[tr:RATED]->(m:Movie)<-[sr:RATED]-(similar:User)
            WHERE target <> similar
            RETURN count(DISTINCT similar) as similar_users, count(m) as common_movies
            """
            collab_result = self.neo4j.execute_query(collab_check, {'user_id': user_id})
            print(f"🔍 Collaborative data: {collab_result}")
            
            return {
                'user_exists': len(user_result) > 0,
                'user_data': user_result[0] if user_result else None,
                'ratings': rating_result[0] if rating_result else {'total_ratings': 0},
                'genres': genre_result,
                'collaborative': collab_result[0] if collab_result else {'similar_users': 0}
            }
            
        except Exception as e:
            print(f"❌ Error in test_user_data: {e}")
            return {'error': str(e)}
    
    def get_simple_recommendations(self, user_id: str, limit: int = 10):
        """
        SUPER SIMPLE recommendation for debugging - just get highly rated movies 
        in genres the user likes, excluding movies they've already rated
        """
        
        query = """
        // Get user's top genres
        MATCH (u:User {id: $userId})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WHERE r.rating >= 3.5
        WITH u, g, count(*) as genre_count
        ORDER BY genre_count DESC
        LIMIT 2
        
        // Find good movies in these genres user hasn't rated
        MATCH (g)<-[:HAS_GENRE]-(rec:Movie)
        WHERE NOT EXISTS((u)-[:RATED]->(rec))
          AND rec.avg_rating >= 4.0
        
        RETURN DISTINCT rec.id as id, rec.title as title,
               CASE WHEN rec.year IS NOT NULL THEN rec.year ELSE 0 END as year,
               rec.poster_url as poster_url,
               rec.plot as plot,
               rec.avg_rating as avg_rating,
               g.name as matching_genre
        ORDER BY rec.avg_rating DESC
        LIMIT $limit
        """
        
        try:
            results = self.neo4j.execute_query(query, {'userId': user_id, 'limit': limit})
            self.logger.info(f"🔍 Simple recommendations found: {len(results)}")
            return results
        except Exception as e:
            self.logger.error(f"❌ Error in simple recommendations: {e}")
            return []