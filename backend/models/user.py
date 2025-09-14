from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
from typing import Dict, Any, Optional, List

class User:
    """
    User model representing a user in the movie recommendation system
    """
    
    def __init__(self, user_id: str, username: str, email: str, password_hash: str = None, created_at: datetime = None):
        self.id = user_id
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.created_at = created_at or datetime.now()
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'User':
        """Create a User instance from a dictionary (e.g., from Neo4j result)"""
        return cls(
            user_id=data.get('id'),
            username=data.get('username'),
            email=data.get('email'),
            password_hash=data.get('password_hash'),
            created_at=data.get('created_at')
        )
    
    def to_dict(self, include_sensitive=False) -> Dict[str, Any]:
        """Convert User instance to dictionary"""
        result = {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
        
        if include_sensitive:
            result['password_hash'] = self.password_hash
            
        return result
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password for storing in the database"""
        return generate_password_hash(password)
    
    def check_password(self, password: str) -> bool:
        """Check if provided password matches the stored hash"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self) -> str:
        return f"<User {self.username} ({self.email})>"
    
    def __str__(self) -> str:
        return self.username
    
    @classmethod
    def create_user_id(cls, email: str) -> str:
        """Generate a unique user ID from email"""
        return f"user_{abs(hash(email)) % 1000000}"
    
    def validate(self) -> List[str]:
        """Validate user data and return list of errors"""
        errors = []
        
        if not self.username or len(self.username) < 3:
            errors.append("Username must be at least 3 characters long")
        
        if not self.email or '@' not in self.email:
            errors.append("Valid email address is required")
        
        if not self.id:
            errors.append("User ID is required")
            
        return errors
    
    @property
    def is_valid(self) -> bool:
        """Check if user data is valid"""
        return len(self.validate()) == 0