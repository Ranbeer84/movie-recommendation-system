"""
Services package for the Movie Recommendation System

This package contains all the business logic services:
- neo4j_service: Database connection and query execution
- recommendation_engine: Machine learning recommendation algorithms
- auth_service: User authentication and management
"""

from .neo4j_service import Neo4jService
from .recommendation_engine import RecommendationEngine
from .auth_service import AuthService

__all__ = ['Neo4jService', 'RecommendationEngine', 'AuthService']