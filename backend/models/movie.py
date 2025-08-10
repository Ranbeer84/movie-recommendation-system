from typing import Dict, Any, List, Optional
from datetime import datetime

class Movie:
    """
    Movie model representing a movie in the recommendation system
    """
    
    def __init__(self, movie_id: str, title: str, year: int, plot: str = "", 
                 poster_url: str = "", avg_rating: float = 0.0, rating_count: int = 0,
                 genres: List[str] = None):
        self.id = movie_id
        self.title = title
        self.year = year
        self.plot = plot
        self.poster_url = poster_url
        self.avg_rating = avg_rating
        self.rating_count = rating_count
        self.genres = genres or []
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Movie':
        """Create a Movie instance from a dictionary (e.g., from Neo4j result)"""
        return cls(
            movie_id=data.get('id'),
            title=data.get('title'),
            year=data.get('year'),
            plot=data.get('plot', ''),
            poster_url=data.get('poster_url', ''),
            avg_rating=float(data.get('avg_rating', 0.0)),
            rating_count=int(data.get('rating_count', 0)),
            genres=data.get('genres', [])
        )
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert Movie instance to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'year': self.year,
            'plot': self.plot,
            'poster_url': self.poster_url,
            'avg_rating': self.avg_rating,
            'rating_count': self.rating_count,
            'genres': self.genres
        }
    
    @property
    def display_title(self) -> str:
        """Get movie title with year for display"""
        return f"{self.title} ({self.year})"
    
    @property
    def is_highly_rated(self) -> bool:
        """Check if movie is highly rated (4+ stars with decent rating count)"""
        return self.avg_rating >= 4.0 and self.rating_count >= 10
    
    @property
    def is_popular(self) -> bool:
        """Check if movie is popular (many ratings)"""
        return self.rating_count >= 50
    
    def has_genre(self, genre: str) -> bool:
        """Check if movie belongs to a specific genre"""
        return genre.lower() in [g.lower() for g in self.genres]
    
    def validate(self) -> List[str]:
        """Validate movie data and return list of errors"""
        errors = []
        
        if not self.id:
            errors.append("Movie ID is required")
        
        if not self.title or len(self.title.strip()) < 1:
            errors.append("Movie title is required")
        
        if not self.year or self.year < 1888 or self.year > datetime.now().year + 5:
            errors.append("Valid movie year is required")
        
        if self.avg_rating < 0 or self.avg_rating > 5:
            errors.append("Average rating must be between 0 and 5")
        
        if self.rating_count < 0:
            errors.append("Rating count cannot be negative")
            
        return errors
    
    @property
    def is_valid(self) -> bool:
        """Check if movie data is valid"""
        return len(self.validate()) == 0
    
    def __repr__(self) -> str:
        return f"<Movie '{self.title}' ({self.year})>"
    
    def __str__(self) -> str:
        return self.display_title
    
    @classmethod
    def create_movie_id(cls, title: str, year: int) -> str:
        """Generate a unique movie ID from title and year"""
        clean_title = ''.join(c.lower() for c in title if c.isalnum())
        return f"movie_{clean_title}_{year}_{abs(hash(f'{title}{year}')) % 10000}"