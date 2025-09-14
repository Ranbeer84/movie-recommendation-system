"""
Models package for the Movie Recommendation System

This package contains all the data models that represent our domain objects:
- User: Represents a user account
- Movie: Represents a movie with its details
- Rating: Represents a user's rating of a movie
"""

from .user import User
from .movie import Movie
from .rating import Rating

__all__ = ['User', 'Movie', 'Rating']