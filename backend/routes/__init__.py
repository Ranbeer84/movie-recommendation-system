"""
Routes package for the Movie Recommendation System

This package contains all the Flask route blueprints organized by functionality:
- auth: Authentication routes (login, register)
- movies: Movie-related routes (browse, search)
- ratings: Rating-related routes (rate movies, get user ratings)
- recommendations: Recommendation routes (get personalized recommendations)
"""

# Note: We import blueprints in the app.py to avoid circular import issues
from .auth import auth_bp
from .movies import movies_bp
from .ratings import ratings_bp
from .recommendations import recommendations_bp

__all__ = ['auth_bp', 'movies_bp', 'ratings_bp', 'recommendations_bp']