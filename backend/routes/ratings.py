from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.rating import Rating
from datetime import datetime

ratings_bp = Blueprint('ratings', __name__)

@ratings_bp.route('/rate', methods=['POST'])
@jwt_required()
def rate_movie():
    """Rate a movie"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        movie_id = data.get('movie_id')
        rating_value = data.get('rating')
        review = data.get('review', '')
        
        # Validate input
        if not movie_id:
            return jsonify({'message': 'Movie ID is required'}), 400
        
        if not rating_value or not (1.0 <= rating_value <= 5.0):
            return jsonify({'message': 'Rating must be between 1.0 and 5.0'}), 400
        
        # Create rating object
        rating = Rating(user_id, movie_id, rating_value, review)
        
        # Validate rating
        validation_errors = rating.validate()
        if validation_errors:
            return jsonify({'message': 'Validation errors', 'errors': validation_errors}), 400
        
        # Check if movie exists
        movie_check = current_app.neo4j_service.execute_query(
            "MATCH (m:Movie {id: $movie_id}) RETURN m.id",
            {'movie_id': movie_id}
        )
        
        if not movie_check:
            return jsonify({'message': 'Movie not found'}), 404
        
        # Check if user already rated this movie
        existing_rating = current_app.neo4j_service.execute_query(
            "MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id}) RETURN r",
            {'user_id': user_id, 'movie_id': movie_id}
        )
        
        if existing_rating:
            # Update existing rating
            current_app.neo4j_service.execute_write_query(
                """
                MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
                SET r.rating = $rating,
                    r.review = $review,
                    r.timestamp = datetime()
                """,
                {
                    'user_id': user_id,
                    'movie_id': movie_id,
                    'rating': rating_value,
                    'review': review
                }
            )
            print(f"✅ Updated rating for movie {movie_id} by user {user_id}")
        else:
            # Create new rating
            current_app.neo4j_service.execute_write_query(
                """
                MATCH (u:User {id: $user_id}), (m:Movie {id: $movie_id})
                CREATE (u)-[:RATED {
                    rating: $rating,
                    review: $review,
                    timestamp: datetime()
                }]->(m)
                """,
                {
                    'user_id': user_id,
                    'movie_id': movie_id,
                    'rating': rating_value,
                    'review': review
                }
            )
            print(f"✅ Created new rating for movie {movie_id} by user {user_id}")
        
        # Update movie's average rating and count
        update_movie_stats(current_app.neo4j_service, movie_id)
        
        return jsonify({
            'message': 'Rating saved successfully',
            'rating': rating.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Error saving rating: {e}")
        return jsonify({'message': 'Error saving rating'}), 500

@ratings_bp.route('/my-ratings', methods=['GET'])
@jwt_required()
def get_my_ratings():
    """Get current user's ratings"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # Validate parameters
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
        
        skip = (page - 1) * limit
        
        query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        RETURN m.id as movie_id, m.title as movie_title, m.year as movie_year,
               m.poster_url as poster_url, r.rating as rating, 
               r.review as review, r.timestamp as timestamp
        ORDER BY r.timestamp DESC
        SKIP $skip LIMIT $limit
        """
        
        ratings = current_app.neo4j_service.execute_query(
            query, 
            {'user_id': user_id, 'skip': skip, 'limit': limit}
        )
        
        print(f"📊 Retrieved {len(ratings)} ratings for user {user_id}")
        
        return jsonify({
            'ratings': ratings,
            'page': page,
            'limit': limit,
            'count': len(ratings)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting user ratings: {e}")
        return jsonify({'message': 'Error retrieving ratings'}), 500

@ratings_bp.route('/movie/<movie_id>', methods=['GET'])
def get_movie_ratings(movie_id):
    """Get all ratings for a specific movie"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        # Validate parameters
        if page < 1:
            page = 1
        if limit < 1 or limit > 50:
            limit = 10
        
        skip = (page - 1) * limit
        
        query = """
        MATCH (u:User)-[r:RATED]->(m:Movie {id: $movie_id})
        RETURN u.username as username, r.rating as rating,
               r.review as review, r.timestamp as timestamp
        ORDER BY r.timestamp DESC
        SKIP $skip LIMIT $limit
        """
        
        ratings = current_app.neo4j_service.execute_query(
            query, 
            {'movie_id': movie_id, 'skip': skip, 'limit': limit}
        )
        
        # Get movie rating statistics
        stats_query = """
        MATCH (m:Movie {id: $movie_id})
        OPTIONAL MATCH (u:User)-[r:RATED]->(m)
        RETURN m.title as title, m.avg_rating as avg_rating, 
               COUNT(r) as total_ratings
        """
        
        stats = current_app.neo4j_service.execute_query(stats_query, {'movie_id': movie_id})
        
        if not stats:
            return jsonify({'message': 'Movie not found'}), 404
        
        return jsonify({
            'movie_id': movie_id,
            'movie_title': stats[0]['title'],
            'avg_rating': stats[0]['avg_rating'],
            'total_ratings': stats[0]['total_ratings'],
            'ratings': ratings,
            'page': page,
            'limit': limit,
            'count': len(ratings)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting movie ratings: {e}")
        return jsonify({'message': 'Error retrieving movie ratings'}), 500

@ratings_bp.route('/check/<movie_id>', methods=['GET'])
@jwt_required()
def check_user_rating(movie_id):
    """Check if current user has rated a specific movie"""
    try:
        user_id = get_jwt_identity()
        
        query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id})
        RETURN r.rating as rating, r.review as review, r.timestamp as timestamp
        """
        
        result = current_app.neo4j_service.execute_query(
            query, 
            {'user_id': user_id, 'movie_id': movie_id}
        )
        
        if result:
            return jsonify({
                'has_rated': True,
                'rating': result[0]
            }), 200
        else:
            return jsonify({'has_rated': False}), 200
        
    except Exception as e:
        print(f"❌ Error checking user rating: {e}")
        return jsonify({'message': 'Error checking rating'}), 500

@ratings_bp.route('/delete/<movie_id>', methods=['DELETE'])
@jwt_required()
def delete_rating(movie_id):
    """Delete a user's rating for a movie"""
    try:
        user_id = get_jwt_identity()
        
        # Check if rating exists
        existing_rating = current_app.neo4j_service.execute_query(
            "MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id}) RETURN r",
            {'user_id': user_id, 'movie_id': movie_id}
        )
        
        if not existing_rating:
            return jsonify({'message': 'Rating not found'}), 404
        
        # Delete the rating
        current_app.neo4j_service.execute_write_query(
            "MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie {id: $movie_id}) DELETE r",
            {'user_id': user_id, 'movie_id': movie_id}
        )
        
        # Update movie statistics
        update_movie_stats(current_app.neo4j_service, movie_id)
        
        print(f"✅ Deleted rating for movie {movie_id} by user {user_id}")
        
        return jsonify({'message': 'Rating deleted successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error deleting rating: {e}")
        return jsonify({'message': 'Error deleting rating'}), 500

@ratings_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_user_rating_stats():
    """Get rating statistics for the current user"""
    try:
        user_id = get_jwt_identity()
        
        query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
        RETURN COUNT(r) as total_ratings,
               AVG(r.rating) as avg_rating,
               MIN(r.rating) as min_rating,
               MAX(r.rating) as max_rating,
               collect(DISTINCT g.name) as rated_genres
        """
        
        stats = current_app.neo4j_service.execute_query(query, {'user_id': user_id})
        
        if not stats:
            return jsonify({
                'total_ratings': 0,
                'avg_rating': 0,
                'min_rating': None,
                'max_rating': None,
                'rated_genres': []
            }), 200
        
        result = stats[0]
        return jsonify({
            'total_ratings': result['total_ratings'] or 0,
            'avg_rating': float(result['avg_rating']) if result['avg_rating'] else 0,
            'min_rating': result['min_rating'],
            'max_rating': result['max_rating'],
            'rated_genres': [g for g in result['rated_genres'] if g]
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting rating stats: {e}")
        return jsonify({'message': 'Error retrieving rating statistics'}), 500

def update_movie_stats(neo4j_service, movie_id):
    """Update a movie's average rating and rating count"""
    try:
        neo4j_service.execute_write_query(
            """
            MATCH (m:Movie {id: $movie_id})
            OPTIONAL MATCH (u:User)-[r:RATED]->(m)
            WITH m, AVG(r.rating) as avg_rating, COUNT(r) as rating_count
            SET m.avg_rating = COALESCE(avg_rating, 0.0),
                m.rating_count = rating_count
            """,
            {'movie_id': movie_id}
        )
    except Exception as e:
        print(f"❌ Error updating movie stats: {e}")