from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

recommendations_bp = Blueprint('recommendations', __name__)

# Add this route to your recommendations_bp.py to check user data

@recommendations_bp.route('/debug/user-stats/<user_id>', methods=['GET'])
def debug_user_stats(user_id):
    """Debug endpoint to check user's rating statistics"""
    try:
        # Check user's rating count
        rating_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        RETURN count(r) as total_ratings,
               avg(r.rating) as avg_rating,
               collect(DISTINCT m.title)[0..5] as sample_movies
        """
        
        rating_stats = current_app.neo4j_service.execute_query(
            rating_query, 
            {'user_id': user_id}
        )
        
        # Check user's genre preferences
        genre_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WHERE r.rating >= 4.0
        RETURN g.name as genre, count(m) as movie_count, avg(r.rating) as avg_rating
        ORDER BY movie_count DESC, avg_rating DESC
        LIMIT 5
        """
        
        genre_stats = current_app.neo4j_service.execute_query(
            genre_query,
            {'user_id': user_id}
        )
        
        # Check if user exists
        user_query = """
        MATCH (u:User {id: $user_id})
        RETURN u.username as username, u.id as id
        """
        
        user_info = current_app.neo4j_service.execute_query(
            user_query,
            {'user_id': user_id}
        )
        
        return jsonify({
            'user_id': user_id,
            'user_exists': len(user_info) > 0,
            'user_info': user_info[0] if user_info else None,
            'rating_stats': rating_stats[0] if rating_stats else {'total_ratings': 0},
            'favorite_genres': genre_stats,
            'recommendations_possible': {
                'collaborative': rating_stats[0]['total_ratings'] >= 5 if rating_stats else False,
                'content_based': len(genre_stats) >= 2,
                'hybrid': rating_stats[0]['total_ratings'] >= 3 if rating_stats else False
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e),
            'user_id': user_id
        }), 500
    
@recommendations_bp.route('/collaborative/<user_id>', methods=['GET'])
def get_collaborative_recommendations(user_id):
    """Get collaborative filtering recommendations"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Validate limit
        if limit < 1 or limit > 50:
            limit = 10
        
        recommendations = current_app.recommendation_engine.get_collaborative_recommendations(user_id, limit)
        
        print(f"🤝 Generated {len(recommendations)} collaborative recommendations for user {user_id}")
        
        return jsonify({
            'recommendations': recommendations,
            'user_id': user_id,
            'type': 'collaborative',
            'count': len(recommendations)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting collaborative recommendations: {e}")
        return jsonify({'message': 'Error generating collaborative recommendations'}), 500

@recommendations_bp.route('/content/<user_id>', methods=['GET'])
def get_content_recommendations(user_id):
    """Get content-based recommendations"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Validate limit
        if limit < 1 or limit > 50:
            limit = 10
        
        recommendations = current_app.recommendation_engine.get_content_based_recommendations(user_id, limit)
        
        print(f"🎬 Generated {len(recommendations)} content-based recommendations for user {user_id}")
        
        return jsonify({
            'recommendations': recommendations,
            'user_id': user_id,
            'type': 'content',
            'count': len(recommendations)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting content-based recommendations: {e}")
        return jsonify({'message': 'Error generating content-based recommendations'}), 500

@recommendations_bp.route('/hybrid/<user_id>', methods=['GET'])
def get_hybrid_recommendations(user_id):
    """Get hybrid recommendations (collaborative + content-based)"""
    try:
        limit = int(request.args.get('limit', 15))
        
        # Validate limit
        if limit < 1 or limit > 50:
            limit = 15
        
        recommendations = current_app.recommendation_engine.get_hybrid_recommendations(user_id, limit)
        
        print(f"🚀 Generated {len(recommendations)} hybrid recommendations for user {user_id}")
        
        return jsonify({
            'recommendations': recommendations,
            'user_id': user_id,
            'type': 'hybrid',
            'count': len(recommendations)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting hybrid recommendations: {e}")
        return jsonify({'message': 'Error generating hybrid recommendations'}), 500

@recommendations_bp.route('/for-me', methods=['GET'])
@jwt_required()
def get_my_recommendations():
    """Get personalized recommendations for the current logged-in user"""
    try:
        user_id = get_jwt_identity()
        limit = int(request.args.get('limit', 15))
        rec_type = request.args.get('type', 'hybrid')
        
        # DEBUGGING: Log all the details
        print(f"🔍 DEBUG - User ID from JWT: {user_id}")
        print(f"🔍 DEBUG - User ID type: {type(user_id)}")
        print(f"🔍 DEBUG - Recommendation type: {rec_type}")
        print(f"🔍 DEBUG - Limit: {limit}")
        
        # Validate parameters
        if limit < 1 or limit > 50:
            limit = 15
        
        if rec_type not in ['hybrid', 'collaborative', 'content']:
            rec_type = 'hybrid'
        
        # TEST: First check if user has any ratings at all
        test_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        RETURN count(r) as rating_count, u.username as username
        """
        
        test_result = current_app.neo4j_service.execute_query(
            test_query, 
            {'user_id': user_id}
        )
        
        print(f"🔍 DEBUG - User rating check: {test_result}")
        
        if not test_result or test_result[0]['rating_count'] == 0:
            print(f"⚠️ DEBUG - User {user_id} has no ratings!")
            return jsonify({
                'recommendations': [],
                'user_id': user_id,
                'type': rec_type,
                'count': 0,
                'message': f'No ratings found for user. Please rate some movies first.',
                'debug_info': {
                    'user_found': len(test_result) > 0,
                    'rating_count': test_result[0]['rating_count'] if test_result else 0,
                    'username': test_result[0]['username'] if test_result else 'Not found'
                }
            }), 200
        
        # Get recommendations based on type
        if rec_type == 'collaborative':
            recommendations = current_app.recommendation_engine.get_collaborative_recommendations(user_id, limit)
        elif rec_type == 'content':
            recommendations = current_app.recommendation_engine.get_content_based_recommendations(user_id, limit)
        else:  # hybrid
            recommendations = current_app.recommendation_engine.get_hybrid_recommendations(user_id, limit)
        
        print(f"🔍 DEBUG - Recommendations returned: {len(recommendations)}")
        if recommendations:
            print(f"🔍 DEBUG - First recommendation: {recommendations[0]}")
        
        return jsonify({
            'recommendations': recommendations,
            'user_id': user_id,
            'type': rec_type,
            'count': len(recommendations),
            'debug_info': {
                'user_rating_count': test_result[0]['rating_count'],
                'username': test_result[0]['username']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ DEBUG - Error getting personal recommendations: {e}")
        print(f"❌ DEBUG - Error type: {type(e)}")
        import traceback
        print(f"❌ DEBUG - Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'message': 'Error generating personalized recommendations',
            'error': str(e),
            'recommendations': [],
            'user_id': user_id if 'user_id' in locals() else None,
            'type': rec_type if 'rec_type' in locals() else 'unknown',
            'count': 0
        }), 500

@recommendations_bp.route('/popular', methods=['GET'])
def get_popular_recommendations():
    """Get popular/trending movies - good for new users or browsing"""
    try:
        genre = request.args.get('genre')
        limit = int(request.args.get('limit', 20))
        
        # Validate limit
        if limit < 1 or limit > 100:
            limit = 20
        
        movies = current_app.recommendation_engine.get_popular_movies(genre, limit)
        
        print(f"📈 Retrieved {len(movies)} popular movies")
        
        return jsonify({
            'movies': movies,
            'genre': genre,
            'type': 'popular',
            'count': len(movies)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting popular movies: {e}")
        return jsonify({'message': 'Error retrieving popular movies'}), 500

@recommendations_bp.route('/similar/<movie_id>', methods=['GET'])
def get_similar_movies(movie_id):
    """Get movies similar to a specific movie"""
    try:
        limit = int(request.args.get('limit', 10))
        
        # Validate limit
        if limit < 1 or limit > 50:
            limit = 10
        
        # Find movies with similar genres and high ratings
        query = """
        MATCH (target:Movie {id: $movie_id})-[:HAS_GENRE]->(g:Genre)<-[:HAS_GENRE]-(similar:Movie)
        WHERE target <> similar AND similar.avg_rating >= 3.5
        WITH similar, COUNT(g) as commonGenres, similar.avg_rating as rating
        WHERE commonGenres >= 1
        RETURN similar.id as id, similar.title as title, similar.year as year,
               similar.poster_url as poster_url, similar.avg_rating as avg_rating,
               similar.plot as plot, similar.rating_count as rating_count,
               commonGenres as similarity_score
        ORDER BY commonGenres DESC, rating DESC
        LIMIT $limit
        """
        
        similar_movies = current_app.neo4j_service.execute_query(
            query, 
            {'movie_id': movie_id, 'limit': limit}
        )
        
        print(f"🎭 Found {len(similar_movies)} movies similar to {movie_id}")
        
        return jsonify({
            'similar_movies': similar_movies,
            'movie_id': movie_id,
            'count': len(similar_movies)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting similar movies: {e}")
        return jsonify({'message': 'Error finding similar movies'}), 500

@recommendations_bp.route('/by-genre/<genre>', methods=['GET'])
def get_recommendations_by_genre(genre):
    """Get highly-rated movies from a specific genre"""
    try:
        limit = int(request.args.get('limit', 20))
        min_rating = float(request.args.get('min_rating', 3.5))
        
        # Validate parameters
        if limit < 1 or limit > 100:
            limit = 20
        if min_rating < 0 or min_rating > 5:
            min_rating = 3.5
        
        query = """
        MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {name: $genre})
        WHERE m.avg_rating >= $min_rating AND m.rating_count >= 10
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.avg_rating DESC, m.rating_count DESC
        LIMIT $limit
        """
        
        movies = current_app.neo4j_service.execute_query(
            query, 
            {'genre': genre, 'min_rating': min_rating, 'limit': limit}
        )
        
        print(f"🎭 Found {len(movies)} highly-rated {genre} movies")
        
        return jsonify({
            'movies': movies,
            'genre': genre,
            'min_rating': min_rating,
            'count': len(movies)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting genre recommendations: {e}")
        return jsonify({'message': 'Error retrieving genre recommendations'}), 500

# The issue is likely in your new-releases route. Replace it with this safer version:

@recommendations_bp.route('/new-releases', methods=['GET'])
def get_new_releases():
    """Get recent movies (from the last few years)"""
    try:
        limit = int(request.args.get('limit', 20))
        years_back = int(request.args.get('years_back', 5))
        
        print(f"🆕 DEBUG: Getting new releases with limit={limit}, years_back={years_back}")
        
        # Validate parameters
        if limit < 1 or limit > 100:
            limit = 20
        if years_back < 1 or years_back > 20:
            years_back = 5
        
        # Use a fixed current year instead of datetime to avoid import issues
        current_year = 2024  # Adjust this to your current year
        min_year = current_year - years_back
        
        print(f"🆕 DEBUG: Searching for movies from {min_year} onwards")
        
        # Simplified query that should work
        query = """
        MATCH (m:Movie)
        WHERE m.year >= $min_year AND m.avg_rating >= 3.0
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.year DESC, m.avg_rating DESC
        LIMIT $limit
        """
        
        print(f"🆕 DEBUG: Executing query with params: min_year={min_year}, limit={limit}")
        
        # Check if neo4j_service exists
        if not hasattr(current_app, 'neo4j_service'):
            print("❌ ERROR: neo4j_service not found in current_app")
            return jsonify({
                'movies': [],
                'min_year': min_year,
                'years_back': years_back,
                'count': 0,
                'error': 'Database service not available'
            }), 500
        
        movies = current_app.neo4j_service.execute_query(
            query, 
            {'min_year': min_year, 'limit': limit}
        )
        
        print(f"🆕 DEBUG: Query returned {len(movies)} movies")
        
        # Ensure movies is a list
        if not isinstance(movies, list):
            print(f"⚠️ WARNING: Query result is not a list: {type(movies)}")
            movies = []
        
        return jsonify({
            'movies': movies,
            'min_year': min_year,
            'years_back': years_back,
            'count': len(movies)
        }), 200
        
    except Exception as e:
        print(f"❌ ERROR in get_new_releases: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        print(f"❌ Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'movies': [],
            'min_year': 2019,  # fallback values
            'years_back': 5,
            'count': 0,
            'error': str(e)
        }), 500

@recommendations_bp.route('/explain/<user_id>/<movie_id>', methods=['GET'])
def explain_recommendation(user_id, movie_id):
    """Explain why a movie was recommended to a user"""
    try:
        # Get user's rating patterns
        user_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WHERE r.rating >= 4.0
        WITH u, g, AVG(r.rating) as avg_rating, COUNT(r) as count
        RETURN g.name as genre, avg_rating, count
        ORDER BY avg_rating DESC, count DESC
        LIMIT 5
        """
        
        user_genres = current_app.neo4j_service.execute_query(
            user_query, 
            {'user_id': user_id}
        )
        
        # Get movie details and genres
        movie_query = """
        MATCH (m:Movie {id: $movie_id})
        OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
        RETURN m.title as title, m.avg_rating as avg_rating,
               collect(g.name) as genres
        """
        
        movie_data = current_app.neo4j_service.execute_query(
            movie_query, 
            {'movie_id': movie_id}
        )
        
        if not movie_data:
            return jsonify({'message': 'Movie not found'}), 404
        
        movie_info = movie_data[0]
        
        # Find similar users who liked this movie
        similar_users_query = """
        MATCH (target:User {id: $user_id})-[tr:RATED]->(m:Movie)<-[sr:RATED]-(similar:User)
        WHERE target <> similar AND tr.rating >= 3.0 AND sr.rating >= 3.0
        WITH similar, COUNT(m) as commonMovies
        WHERE commonMovies >= 3
        MATCH (similar)-[r:RATED]->(rec:Movie {id: $movie_id})
        WHERE r.rating >= 4.0
        RETURN similar.username as username, r.rating as rating
        LIMIT 5
        """
        
        similar_users = current_app.neo4j_service.execute_query(
            similar_users_query, 
            {'user_id': user_id, 'movie_id': movie_id}
        )
        
        # Generate explanation
        explanation = {
            'movie_id': movie_id,
            'movie_title': movie_info['title'],
            'movie_rating': movie_info['avg_rating'],
            'movie_genres': movie_info['genres'],
            'user_favorite_genres': [g['genre'] for g in user_genres],
            'genre_matches': list(set(movie_info['genres']) & set([g['genre'] for g in user_genres])),
            'similar_users_who_liked': similar_users,
            'explanation_text': f"This movie was recommended because it matches your favorite genres and users with similar taste rated it highly."
        }
        
        return jsonify(explanation), 200
        
    except Exception as e:
        print(f"❌ Error explaining recommendation: {e}")
        return jsonify({'message': 'Error generating explanation'}), 500
    
    # Add this route to your recommendations_bp.py file

@recommendations_bp.route('/debug/test-user/<user_id>', methods=['GET'])
def debug_test_user(user_id):
    """Test what data exists for a specific user"""
    try:
        # Test the recommendation engine debugging
        debug_data = current_app.recommendation_engine.test_user_data(user_id)
        
        return jsonify({
            'user_id': user_id,
            'debug_data': debug_data,
            'recommendations_test': {
                'simple': current_app.recommendation_engine.get_simple_recommendations(user_id, 5),
                'collaborative': current_app.recommendation_engine.get_collaborative_recommendations(user_id, 5),
                'content': current_app.recommendation_engine.get_content_based_recommendations(user_id, 5)
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug test: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': str(e),
            'user_id': user_id,
            'traceback': traceback.format_exc()
        }), 500

@recommendations_bp.route('/debug/jwt-info', methods=['GET'])
@jwt_required()
def debug_jwt_info():
    """Debug what's in your JWT token"""
    try:
        user_id = get_jwt_identity()
        
        # Also check different ways to get user info
        from flask_jwt_extended import get_current_user
        try:
            current_user_data = get_current_user()
        except:
            current_user_data = None
        
        # Test if this user ID exists in Neo4j
        user_check = """
        MATCH (u:User {id: $user_id})
        RETURN u.id as id, u.username as username, u.email as email
        """
        
        neo4j_user = current_app.neo4j_service.execute_query(user_check, {'user_id': user_id})
        
        # List all users in Neo4j for comparison
        all_users = """
        MATCH (u:User)
        RETURN u.id as id, u.username as username, u.email as email
        LIMIT 10
        """
        
        all_neo4j_users = current_app.neo4j_service.execute_query(all_users, {})
        
        return jsonify({
            'jwt_identity': user_id,
            'jwt_identity_type': str(type(user_id)),
            'current_user_data': current_user_data,
            'neo4j_user_found': len(neo4j_user) > 0,
            'neo4j_user_data': neo4j_user[0] if neo4j_user else None,
            'all_neo4j_users': all_neo4j_users,
            'possible_id_formats': {
                'current': user_id,
                'as_string': str(user_id),
                'demo_format': f'user_demo_{user_id}' if str(user_id).isdigit() else user_id
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error in JWT debug: {e}")
        import traceback
        traceback.print_exc()
        
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500