from typing import Dict, Any, List, Optional
from datetime import datetime

class Rating:
    """
    Rating model representing a user's rating of a movie
    """
    
    def __init__(self, user_id: str, movie_id: str, rating: float, 
                 review: str = "", timestamp: datetime = None):
        self.user_id = user_id
        self.movie_id = movie_id
        self.rating = rating
        self.review = review
        self.timestamp = timestamp or datetime.now()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Rating':
        """Create a Rating instance from a dictionary (e.g., from Neo4j result)"""
        timestamp = data.get('timestamp')
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
        
        return cls(
            user_id=data.get('user_id'),
            movie_id=data.get('movie_id'),
            rating=float(data.get('rating')),
            review=data.get('review', ''),
            timestamp=timestamp
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert Rating instance to dictionary"""
        return {
            'user_id': self.user_id,
            'movie_id': self.movie_id,
            'rating': self.rating,
            'review': self.review,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }
    
    @property
    def is_positive(self) -> bool:
        """Check if this is a positive rating (3+ stars)"""
        return self.rating >= 3.0
    
    @property
    def is_high_rating(self) -> bool:
        """Check if this is a high rating (4+ stars)"""
        return self.rating >= 4.0
    
    @property
    def stars_display(self) -> str:
        """Get a string representation of the rating as stars"""
        full_stars = int(self.rating)
        half_star = self.rating - full_stars >= 0.5
        return "★" * full_stars + ("☆" if half_star else "") + "☆" * (5 - full_stars - (1 if half_star else 0))
    
    def validate(self) -> List[str]:
        """Validate rating data and return list of errors"""
        errors = []
        
        if not self.user_id:
            errors.append("User ID is required")
        
        if not self.movie_id:
            errors.append("Movie ID is required")
        
        if self.rating is None or self.rating < 1.0 or self.rating > 5.0:
            errors.append("Rating must be between 1.0 and 5.0")
        
        if self.review and len(self.review) > 1000:
            errors.append("Review must be 1000 characters or less")
            
        return errors
    
    @property
    def is_valid(self) -> bool:
        """Check if rating data is valid"""
        return len(self.validate()) == 0
    
    def __repr__(self) -> str:
        return f"<Rating {self.user_id} -> {self.movie_id}: {self.rating}★>"
    
    def __str__(self) -> str:
        return f"{self.rating}★"
    
    @classmethod
    def calculate_average(cls, ratings: List['Rating']) -> float:
        """Calculate average rating from a list of ratings"""
        if not ratings:
            return 0.0
        return sum(r.rating for r in ratings) / len(ratings)
    
    @classmethod
    def filter_by_rating(cls, ratings: List['Rating'], min_rating: float) -> List['Rating']:
        """Filter ratings by minimum rating value"""
        return [r for r in ratings if r.rating >= min_rating]
    
    @classmethod
    def group_by_user(cls, ratings: List['Rating']) -> Dict[str, List['Rating']]:
        """Group ratings by user ID"""
        user_ratings = {}
        for rating in ratings:
            if rating.user_id not in user_ratings:
                user_ratings[rating.user_id] = []
            user_ratings[rating.user_id].append(rating)
        return user_ratings
    
    @classmethod
    def group_by_movie(cls, ratings: List['Rating']) -> Dict[str, List['Rating']]:
        """Group ratings by movie ID"""
        movie_ratings = {}
        for rating in ratings:
            if rating.movie_id not in movie_ratings:
                movie_ratings[rating.movie_id] = []
            movie_ratings[rating.movie_id].append(rating)
        return movie_ratings