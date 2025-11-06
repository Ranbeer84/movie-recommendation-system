from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from services.neo4j_service import Neo4jService
from services.recommendation_engine import RecommendationEngine
import os

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # CORS configuration
    # CORS(app, 
    #      origins=app.config['CORS_ORIGINS'],
    #      allow_headers=['Content-Type', 'Authorization'],
    #      methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

    allowed_origins = [
        r"https://popcorn-flax.vercel.app",
        "http://localhost:3000"
    ]

    CORS(app, resources={
        r"/api/*": {
        "origins" : allowed_origins} },
        supports_credentials=True,
        methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allow_headers=["Content-Type", "Authorization"])
    
    jwt = JWTManager(app)
    
    # JWT Error handlers
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'Token has expired'}), 401
    
    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Invalid token'}), 401
    
    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Authorization token is required'}), 401
    
    # Initialize services
    print("🔌 Connecting to Neo4j database...")
    neo4j_service = Neo4jService()
    print("🧠 Initializing recommendation engine...")
    recommendation_engine = RecommendationEngine(neo4j_service)
    print("✅ Backend services initialized successfully!")
    
    # Make services available to routes
    app.neo4j_service = neo4j_service
    app.recommendation_engine = recommendation_engine
    
    # Import and register blueprints
    from routes.auth import auth_bp
    from routes.movies import movies_bp
    from routes.ratings import ratings_bp
    from routes.recommendations import recommendations_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(movies_bp, url_prefix='/api/movies')
    app.register_blueprint(ratings_bp, url_prefix='/api/ratings')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': 'Movie Recommendation API is running!',
            'database': 'connected' if neo4j_service.driver else 'disconnected',
            'version': '1.0.0'
        })
    
    @app.route('/')
    def home():
        return jsonify({
            'message': 'Welcome to the Movie Recommendation System API!',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'movies': '/api/movies',
                'ratings': '/api/ratings',
                'recommendations': '/api/recommendations'
            }
        })
    
    # error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({'message': 'Bad request', 'error': str(error)}), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'message': 'Unauthorized access'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'message': 'Forbidden'}), 403
    
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'message': 'Endpoint not found'}), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'message': 'Method not allowed'}), 405
    
    @app.errorhandler(500)
    def internal_error(error):
        return jsonify({'message': 'Internal server error'}), 500
    
    # Cleanup on app teardown
    @app.teardown_appcontext
    def close_db(error):
        if hasattr(app, 'neo4j_service'):
            app.neo4j_service.close()
    
    return app

if __name__ == '__main__':
    app = create_app()
    print("\n" + "="*50)
    print("🎬 MOVIE RECOMMENDATION SYSTEM")
    print("="*50)
    print("🚀 Starting Flask server...")
    print("📍 API will be available at: http://localhost:5001")
    print("📍 Test the API at: http://localhost:5001/api/health")
    print("📍 Frontend should run on: http://localhost:3000")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)