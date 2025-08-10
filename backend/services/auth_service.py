from models.user import User
from typing import Optional
import logging

class AuthService:
    """
    Authentication service that handles user-related operations
    """
    
    def __init__(self, neo4j_service):
        self.neo4j = neo4j_service
        self.logger = logging.getLogger(__name__)
    
    def user_exists(self, email: str) -> bool:
        """Check if a user with the given email already exists"""
        try:
            result = self.neo4j.execute_query(
                "MATCH (u:User {email: $email}) RETURN u.id as id",
                {'email': email}
            )
            return len(result) > 0
        except Exception as e:
            self.logger.error(f"Error checking if user exists: {e}")
            return False
    
    def create_user(self, user: User) -> Optional[User]:
        """Create a new user in the database"""
        try:
            # Validate user before creating
            if not user.is_valid:
                self.logger.error(f"Cannot create invalid user: {user.validate()}")
                return None
            
            # Check if user already exists
            if self.user_exists(user.email):
                self.logger.error(f"User with email {user.email} already exists")
                return None
            
            # Create user in database
            self.neo4j.execute_write_query(
                """
                CREATE (u:User {
                    id: $user_id,
                    username: $username,
                    email: $email,
                    password_hash: $password_hash,
                    created_at: datetime()
                })
                """,
                {
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'password_hash': user.password_hash
                }
            )
            
            self.logger.info(f"Created new user: {user.username} ({user.email})")
            return user
            
        except Exception as e:
            self.logger.error(f"Error creating user: {e}")
            return None
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """Authenticate a user with email and password"""
        try:
            # Get user from database
            result = self.neo4j.execute_query(
                """
                MATCH (u:User {email: $email}) 
                RETURN u.id as id, u.username as username, u.email as email,
                       u.password_hash as password_hash, u.created_at as created_at
                """,
                {'email': email}
            )
            
            if not result:
                self.logger.info(f"User not found: {email}")
                return None
            
            user_data = result[0]
            user = User.from_dict(user_data)
            
            # Check password
            if not user.check_password(password):
                self.logger.info(f"Invalid password for user: {email}")
                return None
            
            self.logger.info(f"User authenticated successfully: {email}")
            return user
            
        except Exception as e:
            self.logger.error(f"Error authenticating user: {e}")
            return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """Get a user by their ID"""
        try:
            result = self.neo4j.execute_query(
                """
                MATCH (u:User {id: $user_id}) 
                RETURN u.id as id, u.username as username, u.email as email,
                       u.password_hash as password_hash, u.created_at as created_at
                """,
                {'user_id': user_id}
            )
            
            if not result:
                return None
            
            return User.from_dict(result[0])
            
        except Exception as e:
            self.logger.error(f"Error getting user by ID: {e}")
            return None
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by their email"""
        try:
            result = self.neo4j.execute_query(
                """
                MATCH (u:User {email: $email}) 
                RETURN u.id as id, u.username as username, u.email as email,
                       u.password_hash as password_hash, u.created_at as created_at
                """,
                {'email': email}
            )
            
            if not result:
                return None
            
            return User.from_dict(result[0])
            
        except Exception as e:
            self.logger.error(f"Error getting user by email: {e}")
            return None
    
    def update_user(self, user: User) -> bool:
        """Update user information"""
        try:
            if not user.is_valid:
                self.logger.error(f"Cannot update invalid user: {user.validate()}")
                return False
            
            self.neo4j.execute_write_query(
                """
                MATCH (u:User {id: $user_id})
                SET u.username = $username, u.email = $email
                """,
                {
                    'user_id': user.id,
                    'username': user.username,
                    'email': user.email
                }
            )
            
            self.logger.info(f"Updated user: {user.username}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating user: {e}")
            return False
    
    def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user's password"""
        try:
            password_hash = User.hash_password(new_password)
            
            self.neo4j.execute_write_query(
                """
                MATCH (u:User {id: $user_id})
                SET u.password_hash = $password_hash
                """,
                {
                    'user_id': user_id,
                    'password_hash': password_hash
                }
            )
            
            self.logger.info(f"Updated password for user: {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"Error updating password: {e}")
            return False
    
    def delete_user(self, user_id: str) -> bool:
        """Delete a user and all their ratings"""
        try:
            # First delete all ratings by this user
            self.neo4j.execute_write_query(
                "MATCH (u:User {id: $user_id})-[r:RATED]->() DELETE r",
                {'user_id': user_id}
            )
            
            # Then delete the user
            result = self.neo4j.execute_write_query(
                "MATCH (u:User {id: $user_id}) DELETE u RETURN count(u) as deleted",
                {'user_id': user_id}
            )
            
            deleted_count = result[0]['deleted'] if result else 0
            
            if deleted_count > 0:
                self.logger.info(f"Deleted user: {user_id}")
                return True
            else:
                self.logger.info(f"User not found for deletion: {user_id}")
                return False
            
        except Exception as e:
            self.logger.error(f"Error deleting user: {e}")
            return False
    
    def get_user_stats(self, user_id: str) -> dict:
        """Get statistics about a user's activity"""
        try:
            result = self.neo4j.execute_query(
                """
                MATCH (u:User {id: $user_id})
                OPTIONAL MATCH (u)-[r:RATED]->(m:Movie)
                RETURN u.username as username,
                       COUNT(r) as total_ratings,
                       AVG(r.rating) as avg_rating,
                       MIN(r.rating) as min_rating,
                       MAX(r.rating) as max_rating
                """,
                {'user_id': user_id}
            )
            
            if not result:
                return {}
            
            stats = result[0]
            return {
                'username': stats['username'],
                'total_ratings': stats['total_ratings'] or 0,
                'avg_rating': float(stats['avg_rating']) if stats['avg_rating'] else 0.0,
                'min_rating': stats['min_rating'],
                'max_rating': stats['max_rating']
            }
            
        except Exception as e:
            self.logger.error(f"Error getting user stats: {e}")
            return {}