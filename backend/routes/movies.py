from flask import Blueprint, request, jsonify, current_app
from models.movie import Movie

# Create blueprint without url_prefix since it's handled in app.py
movies_bp = Blueprint('movies', __name__)

@movies_bp.route('/', methods=['GET'])
def get_movies():
    """Get movies with pagination and optional genre filtering"""
    try:
        # Parse query parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        genre = request.args.get('genre')
        sort_by = request.args.get('sort_by', 'rating')  # rating, year, title
        
        # Validate parameters
        if page < 1:
            page = 1
        if limit < 1 or limit > 100:
            limit = 20
            
        skip = (page - 1) * limit
        
        # Map sort_by to actual database fields (use normalized names from init_db.py)
        sort_field_map = {
            'rating': 'coalesce(m.avg_rating, m.imdb_rating, 0)',
            'year': 'm.year',
            'title': 'm.title'
        }
        sort_field = sort_field_map.get(sort_by, sort_field_map['rating'])
        
        # Build query based on filters - Use normalized field names
        if genre:
            query = f"""
            MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {{name: $genre}})
            RETURN m.id as id, 
                   m.title as title, 
                   m.year as year,
                   m.poster_url as poster_url, 
                   coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
                   m.plot as plot, 
                   coalesce(m.rating_count, 0) as rating_count,
                   m.imdb_rating as imdb_rating
            ORDER BY {sort_field} DESC
            SKIP $skip LIMIT $limit
            """
            params = {'genre': genre, 'skip': skip, 'limit': limit}
        else:
            query = f"""
            MATCH (m:Movie)
            RETURN m.id as id, 
                   m.title as title, 
                   m.year as year,
                   m.poster_url as poster_url, 
                   coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
                   m.plot as plot, 
                   coalesce(m.rating_count, 0) as rating_count,
                   m.imdb_rating as imdb_rating
            ORDER BY {sort_field} DESC
            SKIP $skip LIMIT $limit
            """
            params = {'skip': skip, 'limit': limit}
        
        print(f"🔍 Executing query: {query}")
        print(f"📋 Parameters: {params}")
        
        movies_data = current_app.neo4j_service.execute_query(query, params)
        
        if not movies_data:
            print("⚠️  No movies returned from query")
            # Try a simpler query to debug
            debug_query = "MATCH (m:Movie) RETURN count(m) as total"
            total_result = current_app.neo4j_service.execute_query(debug_query)
            total_movies = total_result[0]['total'] if total_result else 0
            print(f"📊 Total movies in database: {total_movies}")
        
        # Convert to Movie objects
        movies = []
        for movie_data in movies_data:
            try:
                # Handle missing fields gracefully
                movie_dict = {
                    'id': movie_data.get('id'),
                    'title': movie_data.get('title', 'Unknown Title'),
                    'year': movie_data.get('year', 0),
                    'poster_url': movie_data.get('poster_url', ''),
                    'avg_rating': float(movie_data.get('avg_rating', 0)),
                    'plot': movie_data.get('plot', 'No plot available'),
                    'rating_count': int(movie_data.get('rating_count', 0))
                }
                
                movie = Movie.from_dict(movie_dict)
                movies.append(movie.to_dict())
                
            except Exception as e:
                print(f"❌ Error processing movie data: {movie_data}, Error: {e}")
                continue
        
        print(f"📽️ Retrieved {len(movies)} movies (page {page}, genre: {genre or 'all'})")
        
        return jsonify({
            'movies': movies,
            'page': page,
            'limit': limit,
            'count': len(movies)
        }), 200
        
    except ValueError as e:
        print(f"❌ ValueError in get_movies: {e}")
        return jsonify({'message': 'Invalid parameter values'}), 400
    except Exception as e:
        print(f"❌ Error getting movies: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': 'Error retrieving movies'}), 500

@movies_bp.route('/search', methods=['GET'])
def search_movies():
    """Search movies by title"""
    try:
        query_term = request.args.get('q', '').strip()
        if not query_term:
            return jsonify({'movies': [], 'query': query_term}), 200
        
        limit = int(request.args.get('limit', 20))
        
        # Use normalized field names
        search_query = """
        MATCH (m:Movie)
        WHERE toLower(m.title) CONTAINS toLower($query)
        RETURN m.id as id, 
               m.title as title, 
               m.year as year,
               m.poster_url as poster_url, 
               coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
               m.plot as plot, 
               coalesce(m.rating_count, 0) as rating_count
        ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC
        LIMIT $limit
        """
        
        movies_data = current_app.neo4j_service.execute_query(
            search_query, 
            {'query': query_term, 'limit': limit}
        )
        
        movies = []
        for movie_data in movies_data:
            try:
                movie = Movie.from_dict(movie_data)
                movies.append(movie.to_dict())
            except Exception as e:
                print(f"❌ Error processing search result: {e}")
                continue
        
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
    try:
        print(f"🎬 Fetching details for movie ID: {movie_id} (type: {type(movie_id)})")
        
        # Use normalized field names that match init_db.py schema + cast properties
        movie_query = """
        MATCH (m:Movie {id: $movie_id})
        OPTIONAL MATCH (m)-[:HAS_GENRE]->(g:Genre)
        OPTIONAL MATCH (m)-[:DIRECTED_BY]->(d:Director)
        OPTIONAL MATCH (m)-[:STARS]->(a:Actor)
        RETURN m.id as id, 
               m.title as title, 
               m.year as year,
               m.poster_url as poster_url, 
               coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
               m.plot as plot, 
               coalesce(m.rating_count, 0) as rating_count,
               m.imdb_rating as imdb_rating, 
               m.meta_score as meta_score,
               m.runtime_minutes as runtime_minutes, 
               m.certificate as certificate,
               collect(DISTINCT g.name) as genres,
               collect(DISTINCT d.name) as directors,
               collect(DISTINCT a.name) as actors,
               m.Star1 as star1, m.Star2 as star2, m.Star3 as star3, m.Star4 as star4
        """
        
        # Use movie_id directly as string
        movie_data = current_app.neo4j_service.execute_query(
            movie_query, 
            {'movie_id': str(movie_id)}  # Ensure it's a string
        )
        
        if not movie_data:
            print(f"❌ Movie not found: {movie_id}")
            # Add debug query to check if movie exists with different casing/format
            debug_query = "MATCH (m:Movie) WHERE toLower(m.id) CONTAINS toLower($movie_id) RETURN m.id as id LIMIT 5"
            debug_results = current_app.neo4j_service.execute_query(debug_query, {'movie_id': movie_id})
            print(f"🔍 Similar movie IDs found: {debug_results}")
            return jsonify({'message': 'Movie not found'}), 404
            
        movie_info = movie_data[0]
        print(f"✅ Found movie: {movie_info.get('title')}")
        
        movie = Movie.from_dict(movie_info)
        
        # Handle genres from relationships (should work) or fallback to CSV format
        movie.genres = [g for g in movie_info.get('genres', []) if g]
        
        # FIXED: Get recent reviews with proper datetime handling
        reviews_query = """
        MATCH (u:User)-[r:RATED]->(m:Movie {id: $movie_id})
        RETURN u.username as username, 
               r.rating as rating, 
               coalesce(r.review, '') as review, 
               coalesce(toString(r.timestamp), toString(datetime())) as timestamp
        ORDER BY coalesce(r.timestamp, datetime()) DESC
        LIMIT 10
        """
        
        reviews_data = current_app.neo4j_service.execute_query(
            reviews_query, 
            {'movie_id': movie_id}
        )
        
        result = movie.to_dict()
        result['reviews'] = reviews_data or []
        result['directors'] = [d for d in movie_info.get('directors', []) if d]
        result['actors'] = [a for a in movie_info.get('actors', []) if a]
        
        # Add cast from properties (Star1-Star4) as fallback
        stars = [movie_info.get('star1'), movie_info.get('star2'), 
                movie_info.get('star3'), movie_info.get('star4')]
        stars = [s for s in stars if s and s.strip()]
        if stars and not result['actors']:
            result['actors'] = stars
        
        result['imdb_rating'] = movie_info.get('imdb_rating')
        result['meta_score'] = movie_info.get('meta_score')
        result['runtime_minutes'] = movie_info.get('runtime_minutes')
        result['certificate'] = movie_info.get('certificate')
        
        print(f"📤 Returning movie details for: {result.get('title')}")
        return jsonify(result), 200
        
    except Exception as e:
        print(f"❌ Error getting movie details for ID {movie_id}: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'message': 'Error retrieving movie details'}), 500

@movies_bp.route('/genres', methods=['GET'])
def get_genres():
    """Get all available movie genres"""
    try:
        # Use Genre nodes created by init_db.py
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
        
        # Use recommendation engine if available, otherwise fallback to simple query
        if hasattr(current_app, 'recommendation_engine'):
            movies = current_app.recommendation_engine.get_popular_movies(genre, limit)
        else:
            # Use normalized field names
            if genre:
                query = """
                MATCH (m:Movie)-[:HAS_GENRE]->(g:Genre {name: $genre})
                WHERE coalesce(m.avg_rating, m.imdb_rating, 0) >= 7.0
                RETURN m.id as id, 
                       m.title as title, 
                       m.year as year,
                       m.poster_url as poster_url, 
                       coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
                       m.plot as plot, 
                       coalesce(m.rating_count, 0) as rating_count
                ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC
                LIMIT $limit
                """
                params = {'genre': genre, 'limit': limit}
            else:
                query = """
                MATCH (m:Movie)
                WHERE coalesce(m.avg_rating, m.imdb_rating, 0) >= 7.0
                RETURN m.id as id, 
                       m.title as title, 
                       m.year as year,
                       m.poster_url as poster_url, 
                       coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
                       m.plot as plot, 
                       coalesce(m.rating_count, 0) as rating_count
                ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC
                LIMIT $limit
                """
                params = {'limit': limit}
            
            movies_data = current_app.neo4j_service.execute_query(query, params)
            movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
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
        
        # Use normalized field names
        query = """
        MATCH (m:Movie)
        WHERE coalesce(m.avg_rating, m.imdb_rating, 0) >= 8.0
        RETURN m.id as id, 
               m.title as title, 
               m.year as year,
               m.poster_url as poster_url, 
               coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
               m.plot as plot, 
               coalesce(m.rating_count, 0) as rating_count
        ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC
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
        min_year = current_year - 10  # Last 10 years
        
        # Use normalized field names
        query = """
        MATCH (m:Movie)
        WHERE m.year >= $min_year AND coalesce(m.avg_rating, m.imdb_rating, 0) >= 6.0
        RETURN m.id as id, 
               m.title as title, 
               m.year as year,
               m.poster_url as poster_url, 
               coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
               m.plot as plot, 
               coalesce(m.rating_count, 0) as rating_count
        ORDER BY m.year DESC, coalesce(m.avg_rating, m.imdb_rating, 0) DESC
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
        
        # Use normalized field names
        query = """
        MATCH (m:Movie)
        WHERE coalesce(m.avg_rating, m.imdb_rating, 0) >= 8.5
        RETURN m.id as id, 
               m.title as title, 
               m.year as year,
               m.poster_url as poster_url, 
               coalesce(m.avg_rating, m.imdb_rating, 0) as avg_rating,
               m.plot as plot, 
               coalesce(m.rating_count, 0) as rating_count
        ORDER BY coalesce(m.avg_rating, m.imdb_rating, 0) DESC
        LIMIT $limit
        """
        
        movies_data = current_app.neo4j_service.execute_query(query, {'limit': limit})
        movies = [Movie.from_dict(movie_data).to_dict() for movie_data in movies_data]
        
        print(f"🏆 Retrieved {len(movies)} top-rated movies")
        return jsonify({'movies': movies}), 200
        
    except Exception as e:
        print(f"❌ Error getting top-rated movies: {e}")
        return jsonify({'message': 'Error retrieving top-rated movies'}), 500

# Debug endpoint to check database status
@movies_bp.route('/debug', methods=['GET'])
def debug_movies():
    """Debug endpoint to check movie data in database"""
    try:
        # Count total movies
        total_count = current_app.neo4j_service.execute_query("MATCH (m:Movie) RETURN count(m) as total")[0]['total']
        
        # Get sample movies with normalized field names
        sample_movies = current_app.neo4j_service.execute_query(
            """
            MATCH (m:Movie) 
            RETURN m.id as id, 
                   m.title as title, 
                   m.year as year, 
                   m.avg_rating as avg_rating, 
                   m.imdb_rating as imdb_rating
            LIMIT 5
            """
        )
        
        return jsonify({
            'total_movies': total_count,
            'sample_movies': sample_movies,
            'database_status': 'connected' if total_count > 0 else 'empty'
        }), 200
        
    except Exception as e:
        print(f"❌ Error in debug endpoint: {e}")
        return jsonify({'error': str(e)}), 500