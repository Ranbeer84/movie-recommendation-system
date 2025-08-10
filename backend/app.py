from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from services.neo4j_service import Neo4jService
from services.recommendation_engine import RecommendationEngine
# Import routes after creating the app to avoid circular imports
# We'll import them inside the function
import os

def create_app(config_name=None):
    """Application factory pattern"""
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'development')
    
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    CORS(app, origins=app.config['CORS_ORIGINS'])
    jwt = JWTManager(app)
    
    # Initialize services
    print("🔌 Connecting to Neo4j database...")
    neo4j_service = Neo4jService()
    print("🧠 Initializing recommendation engine...")
    recommendation_engine = RecommendationEngine(neo4j_service)
    print("✅ Backend services initialized successfully!")
    
    # Make services available to routes
    app.neo4j_service = neo4j_service
    app.recommendation_engine = recommendation_engine
    
    # Import routes here to avoid circular imports
    from routes.auth import auth_bp
    from routes.movies import movies_bp
    from routes.ratings import ratings_bp
    from routes.recommendations import recommendations_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(movies_bp, url_prefix='/api/movies')
    app.register_blueprint(ratings_bp, url_prefix='/api/ratings')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    
    # Health check route
    @app.route('/api/health')
    def health_check():
        return {
            'status': 'healthy',
            'message': 'Movie Recommendation API is running!',
            'database': 'connected' if neo4j_service.driver else 'disconnected'
        }
    
    @app.route('/')
    def home():
        return {
            'message': 'Welcome to the Movie Recommendation System API!',
            'endpoints': {
                'health': '/api/health',
                'auth': '/api/auth',
                'movies': '/api/movies',
                'ratings': '/api/ratings',
                'recommendations': '/api/recommendations'
            }
        }
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return {'message': 'Endpoint not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        return {'message': 'Internal server error'}, 500
    
    return app

if __name__ == '__main__':
    app = create_app()
    
    print("\n" + "="*50)
    print("🎬 MOVIE RECOMMENDATION SYSTEM")
    print("="*50)
    print("🚀 Starting Flask server...")
    print("📍 API will be available at: http://localhost:5001")
    print("📍 Test the API at: http://localhost:5001/api/health")
    print("="*50 + "\n")
    
    app.run(host='0.0.0.0', port=5001, debug=True)