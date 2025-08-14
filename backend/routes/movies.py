from flask import Blueprint, request, jsonify, current_app
from models.movie import Movie

movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/', methods=['GET'])
def get_movies():
    """Get movies with pagination and optional genre filtering"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        genre = request.args.get('genre')
        sort_by = request.args.get('sort_by', 'avg_rating')  # avg_rating, year, title
        
        # Validate parameters
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
            
        skip = (page - 1) * limit
        
        # Build query based on filters
        if genre:
            query = f"""
            MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {{name: $genre}})
            RETURN m.id as id, m.title as title, m.year as year, 
                   m.poster_url as poster_url, m.avg_rating as avg_rating,
                   m.plot as plot, m.rating_count as rating_count
            ORDER BY m.{sort_by} DESC
            SKIP $skip LIMIT $limit
            """
            params = {'genre': genre, 'skip': skip, 'limit': limit}
        else:
            query = f"""
            MATCH (m:Movie)
            RETURN m.id as id, m.title as title, m.year as year,
                   m.poster_url as poster_url, m.avg_rating as avg_rating,
                   m.plot as plot, m.rating_count as rating_count
            ORDER BY m.{sort_by} DESC
            SKIP $skip LIMIT $limit
            """
            params = {'skip': skip, 'limit': limit}
        
        movies_data = current_app.neo4j_service.execute_query(query, params)
        
        # Convert to Movie objects
        movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
        print(f"📽️ Retrieved {len(movies)} movies (page {page}, genre: {genre or 'all'})")
        
        return jsonify({
            'movies': movies,
            'page': page,
            'limit': limit,
            'count': len(movies)
        }), 200
        
    except ValueError as e:
        return jsonify({'message': 'Invalid parameter values'}), 400
    except Exception as e:
        print(f"❌ Error getting movies: {e}")
        return jsonify({'message': 'Error retrieving movies'}), 500

@movies_bp.route('/search', methods=['GET'])
def search_movies():
    """Search movies by title"""
    try:
        query_term = request.args.get('q', '').strip()
        if not query_term:
            return jsonify({'movies': [], 'query': query_term}), 200
        
        limit = int(request.args.get('limit', 20))
        
        search_query = """
        MATCH (m:Movie)
        WHERE toLower(m.title) CONTAINS toLower($query)
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.avg_rating DESC
        LIMIT $limit
        """
        
        movies_data = current_app.neo4j_service.execute_query(
            search_query, 
            {'query': query_term, 'limit': limit}
        )
        
        movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
        print(f"🔍 Found {len(movies)} movies matching '{query_term}'")
        
        return jsonify({
            'movies': movies,
            'query': query_term,
            'count': len(movies)
        }), 200
        
    except Exception as e:
        print(f"❌ Error searching movies: {e}")
        return jsonify({'message': 'Error searching movies'}), 500

@movies_bp.route('/<movie_id>', methods=['GET'])
def get_movie_details(movie_id):
    """Get detailed information about a specific movie"""
    try:
        # Get movie details
        movie_query = """
        MATCH (m:Movie {id: $movie_id})
        OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count,
               collect(g.name) as genres
        """
        
        movie_data = current_app.neo4j_service.execute_query(
            movie_query, 
            {'movie_id': movie_id}
        )
        
        if not movie_data:
            return jsonify({'message': 'Movie not found'}), 404
        
        movie_info = movie_data[0]
        movie = Movie.from_dict(movie_info)
        movie.genres = movie_info.get('genres', [])
        
        # Get recent reviews
        reviews_query = """
        MATCH (u:User)-[r:RATED]->(m:Movie {id: $movie_id})
        RETURN u.username as username, r.rating as rating, 
               r.review as review, r.timestamp as timestamp
        ORDER BY r.timestamp DESC
        LIMIT 10
        """
        
        reviews_data = current_app.neo4j_service.execute_query(
            reviews_query, 
            {'movie_id': movie_id}
        )
        
        result = movie.to_dict()
        result['reviews'] = reviews_data
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error getting movie details: {e}")
        return jsonify({'message': 'Error retrieving movie details'}), 500

@movies_bp.route('/genres', methods=['GET'])
def get_genres():
    """Get all available movie genres"""
    try:
        query = "MATCH (g:Genre) RETURN g.name as name ORDER BY g.name"
        genres_data = current_app.neo4j_service.execute_query(query)
        
        genres = [{'name': genre['name']} for genre in genres_data]
        
        print(f"🎭 Retrieved {len(genres)} genres")
        return jsonify({'genres': genres}), 200
        
    except Exception as e:
        print(f"❌ Error getting genres: {e}")
        return jsonify({'message': 'Error retrieving genres'}), 500

@movies_bp.route('/popular', methods=['GET'])
def get_popular_movies():
    """Get popular movies"""
    try:
        genre = request.args.get('genre')
        limit = int(request.args.get('limit', 20))
        
        movies = current_app.recommendation_engine.get_popular_movies(genre, limit)
        
        print(f"📈 Retrieved {len(movies)} popular movies")
        return jsonify({
            'movies': movies,
            'genre': genre,
            'count': len(movies)
        }), 200
        
    except Exception as e:
        print(f"❌ Error getting popular movies: {e}")
        return jsonify({'message': 'Error retrieving popular movies'}), 500

@movies_bp.route('/featured', methods=['GET'])
def get_featured_movies():
    """Get featured/trending movies for homepage"""
    try:
        limit = int(request.args.get('limit', 8))
        
        query = """
        MATCH (m:Movie)
        WHERE m.rating_count >= 50 AND m.avg_rating >= 4.0
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.avg_rating DESC, m.rating_count DESC
        LIMIT $limit
        """
        
        movies_data = current_app.neo4j_service.execute_query(query, {'limit': limit})
        movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
        print(f"🌟 Retrieved {len(movies)} featured movies")
        return jsonify({'movies': movies}), 200
        
    except Exception as e:
        print(f"❌ Error getting featured movies: {e}")
        return jsonify({'message': 'Error retrieving featured movies'}), 500

@movies_bp.route('/recent', methods=['GET'])
def get_recent_movies():
    """Get recently added movies"""
    try:
        limit = int(request.args.get('limit', 12))
        current_year = 2024
        min_year = current_year - 5  # Last 5 years
        
        query = """
        MATCH (m:Movie)
        WHERE m.year >= $min_year AND m.avg_rating >= 3.0
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.year DESC, m.avg_rating DESC
        LIMIT $limit
        """
        
        movies_data = current_app.neo4j_service.execute_query(
            query, {'min_year': min_year, 'limit': limit}
        )
        movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
        print(f"🆕 Retrieved {len(movies)} recent movies")
        return jsonify({'movies': movies}), 200
        
    except Exception as e:
        print(f"❌ Error getting recent movies: {e}")
        return jsonify({'message': 'Error retrieving recent movies'}), 500

@movies_bp.route('/top-rated', methods=['GET'])
def get_top_rated_movies():
    """Get top-rated movies"""
    try:
        limit = int(request.args.get('limit', 12))
        
        query = """
        MATCH (m:Movie)
        WHERE m.rating_count >= 20 AND m.avg_rating >= 4.0
        RETURN m.id as id, m.title as title, m.year as year,
               m.poster_url as poster_url, m.avg_rating as avg_rating,
               m.plot as plot, m.rating_count as rating_count
        ORDER BY m.avg_rating DESC, m.rating_count DESC
        LIMIT $limit
        """
        
        movies_data = current_app.neo4j_service.execute_query(query, {'limit': limit})
        movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
        print(f"🏆 Retrieved {len(movies)} top-rated movies")
        return jsonify({'movies': movies}), 200
        
    except Exception as e:
        print(f"❌ Error getting top-rated movies: {e}")
        return jsonify({'message': 'Error retrieving top-rated movies'}), 500