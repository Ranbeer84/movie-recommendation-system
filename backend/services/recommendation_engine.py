# Create this file as backend/services/recommendation_engine.py

import logging
from typing import List, Dict, Any

class RecommendationEngine:
    """
    This is the brain of our recommendation system!
    It uses different algorithms to suggest movies to users.
    
    Think of it like Netflix's recommendation system - it learns from
    what you and similar users like to suggest new movies.
    """
    
    def __init__(self, neo4j_service):
        self.neo4j = neo4j_service
        self.logger = logging.getLogger(__name__)
    
    def get_collaborative_recommendations(self, user_id: str, limit: int = 10) -> List[Dict[str, Any]]:
        """
        COLLABORATIVE FILTERING - "People like you also liked..."
        
        This finds users who have similar taste to you (they rated movies similarly),
        then recommends movies that those similar users liked but you haven't seen yet.
        
        Example: If you and another user both loved "The Matrix" and "Inception",
        and they also loved "Blade Runner" which you haven't seen, we'll recommend
        "Blade Runner" to you.
        """
        
        query = """
        // Step 1: Find users who rated movies similarly to our target user
        MATCH (target:User {id: $userId})-[tr:RATED]->(m:Movie)<-[sr:RATED]-(similar:User)
        WHERE target <> similar AND tr.rating >= 3.0 AND sr.rating >= 3.0
        
        // Step 2: Calculate how similar these users are
        WITH target, similar, 
             COUNT(m) as commonMovies,
             SUM(abs(tr.rating - sr.rating)) as ratingDiff
        WHERE commonMovies >= 3  // Need at least 3 movies in common
        
        // Step 3: Calculate similarity score (higher = more similar)
        WITH similar, commonMovies, 
             (5.0 - (ratingDiff / commonMovies)) as similarity
        WHERE similarity > 2.5  // Only consider reasonably similar users
        ORDER BY similarity DESC
        LIMIT 10  // Top 10 most similar users
        
        // Step 4: Get recommendations from these similar users
        MATCH (similar)-[r:RATED]->(rec:Movie)
        WHERE NOT EXISTS((target)-[:RATED]->(rec))  // User hasn't rated this movie
          AND r.rating >= 4.0  // Similar users liked it (4+ stars)
        
        // Step 5: Score and rank the recommendations
        WITH rec, 
             AVG(r.rating) as avgRating, 
             COUNT(r) as ratingCount,
             SUM(similarity * r.rating) as weightedRating,
             SUM(similarity) as totalSimilarity
        WHERE ratingCount >= 2 AND totalSimilarity > 0
        
        RETURN rec.id as id, 
               rec.title as title, 
               rec.year as year, 
               rec.poster_url as poster_url,
               rec.plot as plot,
               (weightedRating / totalSimilarity) as recommendation_score,
               avgRating as avg_rating
        ORDER BY recommendation_score DESC
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
        CONTENT-BASED FILTERING - "More movies like what you already love..."
        
        This looks at the genres of movies you've rated highly, then finds
        other highly-rated movies in those same genres.
        
        Example: If you gave 5 stars to lots of Science Fiction movies,
        we'll recommend other highly-rated Sci-Fi movies you haven't seen.
        """
        
        query = """
        // Step 1: Find user's favorite genres based on their high ratings
        MATCH (u:User {id: $userId})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WHERE r.rating >= 4.0  // Only consider movies they liked (4+ stars)
        
        // Step 2: Calculate preference for each genre
        WITH u, g, 
             COUNT(m) as genreCount, 
             AVG(r.rating) as avgGenreRating
        ORDER BY genreCount DESC, avgGenreRating DESC
        LIMIT 5  // Top 5 favorite genres
        
        // Step 3: Find good movies in these genres that user hasn't rated
        MATCH (g)<-[:HAS_GENRE]-(rec:Movie)
        WHERE NOT EXISTS((u)-[:RATED]->(rec))  // User hasn't rated it
          AND rec.avg_rating >= 3.5  // It's a good movie (3.5+ average rating)
          AND rec.rating_count >= 10  // It has enough ratings to be reliable
        
        // Step 4: Score based on genre preferences
        WITH rec, 
             SUM(genreCount * avgGenreRating) as contentScore,
             COUNT(DISTINCT g) as genreMatches
        WHERE genreMatches >= 1
        
        RETURN rec.id as id,
               rec.title as title,
               rec.year as year,
               rec.poster_url as poster_url,
               rec.plot as plot,
               contentScore as recommendation_score,
               rec.avg_rating as avg_rating
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
        HYBRID APPROACH - "Best of both worlds!"
        
        This combines collaborative filtering and content-based filtering
        to give you the best possible recommendations.
        
        We give 60% weight to collaborative filtering (what similar users like)
        and 40% weight to content-based filtering (genres you prefer).
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
        Get popular/trending movies - good for new users or browsing
        """
        
        if genre:
            query = """
            MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {name: $genre})
            WHERE m.rating_count > 50  // Movies with enough ratings
            RETURN m.id as id, m.title as title, m.year as year,
                   m.poster_url as poster_url, m.avg_rating as avg_rating,
                   m.rating_count as rating_count, m.plot as plot
            ORDER BY m.avg_rating DESC, m.rating_count DESC
            LIMIT $limit
            """
            params = {'genre': genre, 'limit': limit}
        else:
            query = """
            MATCH (m:Movie)
            WHERE m.rating_count > 100  // Popular movies with lots of ratings
            RETURN m.id as id, m.title as title, m.year as year,
                   m.poster_url as poster_url, m.avg_rating as avg_rating,
                   m.rating_count as rating_count, m.plot as plot
            ORDER BY m.avg_rating DESC, m.rating_count DESC
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