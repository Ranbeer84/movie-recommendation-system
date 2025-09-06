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
            "MATCH (m:Movie {id: $movie_id}) RETURN m.id as id, m.title as title",
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
            action = "updated"
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
            action = "created"
        
        # Update movie's average rating and count
        update_movie_stats(current_app.neo4j_service, movie_id)
        
        return jsonify({
            'message': f'Rating {action} successfully',
            'rating': rating.to_dict(),
            'movie_title': movie_check[0]['title'] if movie_check else None
        }), 201
        
    except Exception as e:
        print(f"❌ Error saving rating: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': 'Error saving rating', 'error': str(e)}), 500

@ratings_bp.route('/my-ratings', methods=['GET'])
@jwt_required()
def get_my_ratings():
    """Get current user's ratings"""
    try:
        user_id = get_jwt_identity()
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        print(f"🔍 Fetching ratings for user {user_id}, page {page}, limit {limit}")
        
        # Validate parameters
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
        
        skip = (page - 1) * limit
        
        # Updated query with better error handling and field mapping
        query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        RETURN m.id as movie_id, 
               m.title as movie_title, 
               m.year as movie_year,
               m.poster_url as poster_url, 
               r.rating as rating, 
               r.review as review, 
               r.timestamp as timestamp,
               m.avg_rating as movie_avg_rating,
               m.rating_count as movie_rating_count
        ORDER BY r.timestamp DESC
        SKIP $skip LIMIT $limit
        """
        
        print(f"🔍 Executing query with params: user_id={user_id}, skip={skip}, limit={limit}")
        
        ratings = current_app.neo4j_service.execute_query(
            query, 
            {'user_id': user_id, 'skip': skip, 'limit': limit}
        )
        
        print(f"📊 Raw query result: {ratings}")
        
        # Process the ratings to ensure consistent data structure
        processed_ratings = []
        for rating in ratings:
            processed_rating = {
                'movie_id': rating.get('movie_id'),
                'movie_title': rating.get('movie_title'),
                'movie_year': rating.get('movie_year'),
                'poster_url': rating.get('poster_url'),
                'rating': float(rating.get('rating', 0)) if rating.get('rating') is not None else 0.0,
                'review': rating.get('review') or '',
                'timestamp': rating.get('timestamp'),
                'movie_avg_rating': float(rating.get('movie_avg_rating', 0)) if rating.get('movie_avg_rating') is not None else 0.0,
                'movie_rating_count': int(rating.get('movie_rating_count', 0)) if rating.get('movie_rating_count') is not None else 0
            }
            
            # Handle datetime conversion if needed
            if processed_rating['timestamp']:
                # If timestamp is a Neo4j datetime object, convert to ISO string
                try:
                    if hasattr(processed_rating['timestamp'], 'iso_format'):
                        processed_rating['timestamp'] = processed_rating['timestamp'].iso_format()
                    elif hasattr(processed_rating['timestamp'], 'isoformat'):
                        processed_rating['timestamp'] = processed_rating['timestamp'].isoformat()
                    else:
                        processed_rating['timestamp'] = str(processed_rating['timestamp'])
                except Exception as e:
                    print(f"⚠️ Warning: Could not process timestamp {processed_rating['timestamp']}: {e}")
                    processed_rating['timestamp'] = datetime.now().isoformat()
            
            processed_ratings.append(processed_rating)
        
        print(f"📊 Retrieved {len(processed_ratings)} ratings for user {user_id}")
        print(f"📊 Sample rating: {processed_ratings[0] if processed_ratings else 'None'}")
        
        # Get total count for pagination
        count_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        RETURN COUNT(r) as total
        """
        
        total_result = current_app.neo4j_service.execute_query(count_query, {'user_id': user_id})
        total_count = total_result[0]['total'] if total_result else 0
        
        return jsonify({
            'ratings': processed_ratings,
            'page': page,
            'limit': limit,
            'count': len(processed_ratings),
            'total': total_count,
            'has_more': len(processed_ratings) == limit
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting user ratings: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'message': 'Error retrieving ratings', 
            'error': str(e),
            'ratings': [],
            'count': 0,
            'total': 0
        }), 500

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
            'avg_rating': float(stats[0]['avg_rating']) if stats[0]['avg_rating'] else 0.0,
            'total_ratings': stats[0]['total_ratings'],
            'ratings': ratings,
            'page': page,
            'limit': limit,
            'count': len(ratings)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting movie ratings: {e}")
        import traceback
        traceback.print_exc()
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
            rating_data = {
                'rating': float(result[0]['rating']) if result[0]['rating'] else 0.0,
                'review': result[0]['review'] or '',
                'timestamp': result[0]['timestamp']
            }
            
            # Handle timestamp conversion
            if rating_data['timestamp']:
                try:
                    if hasattr(rating_data['timestamp'], 'iso_format'):
                        rating_data['timestamp'] = rating_data['timestamp'].iso_format()
                    elif hasattr(rating_data['timestamp'], 'isoformat'):
                        rating_data['timestamp'] = rating_data['timestamp'].isoformat()
                    else:
                        rating_data['timestamp'] = str(rating_data['timestamp'])
                except Exception as e:
                    print(f"⚠️ Warning: Could not process timestamp: {e}")
                    rating_data['timestamp'] = datetime.now().isoformat()
            
            return jsonify({
                'has_rated': True,
                'rating': rating_data
            }), 200
        else:
            return jsonify({'has_rated': False}), 200
        
    except Exception as e:
        print(f"❌ Error checking user rating: {e}")
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
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
        import traceback
        traceback.print_exc()
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
        print(f"✅ Updated movie stats for {movie_id}")
    except Exception as e:
        print(f"❌ Error updating movie stats: {e}")
        import traceback
        traceback.print_exc()