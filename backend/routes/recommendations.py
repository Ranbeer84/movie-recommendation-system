from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

recommendations_bp = Blueprint('recommendations', __name__)

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
        rec_type = request.args.get('type', 'hybrid')  # hybrid, collaborative, content
        
        # Validate parameters
        if limit < 1 or limit > 50:
            limit = 15
        
        if rec_type not in ['hybrid', 'collaborative', 'content']:
            rec_type = 'hybrid'
        
        # Get recommendations based on type
        if rec_type == 'collaborative':
            recommendations = current_app.recommendation_engine.get_collaborative_recommendations(user_id, limit)
        elif rec_type == 'content':
            recommendations = current_app.recommendation_engine.get_content_based_recommendations(user_id, limit)
        else:  # hybrid
            recommendations = current_app.recommendation_engine.get_hybrid_recommendations(user_id, limit)
        
        print(f"🎯 Generated {len(recommendations)} {rec_type} recommendations for logged-in user {user_id}")
        
        return jsonify({
            'recommendations': recommendations,
            'user_id': user_id,
            'type': rec_type,
            'count': len(recommendations)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting personal recommendations: {e}")
        return jsonify({'message': 'Error generating personalized recommendations'}), 500

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

@recommendations_bp.route('/new-releases', methods=['GET'])
def get_new_releases():
    """Get recent movies (from the last few years)"""
    try:
        limit = int(request.args.get('limit', 20))
        years_back = int(request.args.get('years_back', 5))
        
        # Validate parameters
        if limit < 1 or limit > 100:
            limit = 20
        if years_back < 1 or years_back > 20:
            years_back = 5
        
        from datetime import datetime
        current_year = datetime.now().year
        min_year = current_year - years_back
        
        query = """
        MATCH (m:Movie)
        WHERE m.year >= $min_year AND m.avg_rating >= 3.0
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.year DESC, m.avg_rating DESC
        LIMIT $limit
        """
        
        movies = current_app.neo4j_service.execute_query(
            query, 
            {'min_year': min_year, 'limit': limit}
        )
        
        print(f"🆕 Found {len(movies)} recent movies from {min_year} onwards")
        
        return jsonify({
            'movies': movies,
            'min_year': min_year,
            'years_back': years_back,
            'count': len(movies)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting new releases: {e}")
        return jsonify({'message': 'Error retrieving new releases'}), 500

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