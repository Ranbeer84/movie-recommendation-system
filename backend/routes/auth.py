from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from models.user import User
from services.auth_service import AuthService

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user account"""
    print("📝 New user registration attempt...")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        # Extract user data
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # Validate required fields
        if not all([username, email, password]):
            return jsonify({'message': 'Missing required fields: username, email, password'}), 400
        
        # Create user instance
        user_id = User.create_user_id(email)
        new_user = User(user_id, username, email)
        new_user.password_hash = User.hash_password(password)
        
        # Validate user data
        validation_errors = new_user.validate()
        if validation_errors:
            return jsonify({'message': 'Validation errors', 'errors': validation_errors}), 400
        
        # Use auth service to register user
        auth_service = AuthService(current_app.neo4j_service)
        
        # Check if user already exists
        if auth_service.user_exists(email):
            print(f"❌ Registration failed: User {email} already exists")
            return jsonify({'message': 'User already exists'}), 400
        
        # Create the user
        created_user = auth_service.create_user(new_user)
        if not created_user:
            return jsonify({'message': 'Failed to create user'}), 500
        
        # Create access token
        access_token = create_access_token(identity=created_user.id)
        
        print(f"✅ User {username} registered successfully!")
        return jsonify({
            'access_token': access_token,
            'user': created_user.to_dict()
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'message': 'Registration failed', 'error': str(e)}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Log in an existing user"""
    print("🔐 User login attempt...")
    
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        email = data.get('email')
        password = data.get('password')
        
        if not all([email, password]):
            return jsonify({'message': 'Missing email or password'}), 400
        
        # Use auth service to authenticate user
        auth_service = AuthService(current_app.neo4j_service)
        user = auth_service.authenticate_user(email, password)
        
        if not user:
            print(f"❌ Login failed for {email}: Invalid credentials")
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # Create access token
        access_token = create_access_token(identity=user.id)
        
        print(f"✅ User {user.username} logged in successfully!")
        return jsonify({
            'access_token': access_token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'message': 'Login failed', 'error': str(e)}), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        auth_service = AuthService(current_app.neo4j_service)
        user = auth_service.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify({'user': user.to_dict()}), 200
        
    except Exception as e:
        print(f"❌ Get current user error: {e}")
        return jsonify({'message': 'Failed to get user information'}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required()
def refresh_token():
    """Refresh JWT token"""
    try:
        current_user_id = get_jwt_identity()
        new_token = create_access_token(identity=current_user_id)
        return jsonify({'access_token': new_token}), 200
        
    except Exception as e:
        print(f"❌ Token refresh error: {e}")
        return jsonify({'message': 'Failed to refresh token'}), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_user_profile():
    """Get detailed user profile with statistics"""
    try:
        user_id = get_jwt_identity()
        auth_service = AuthService(current_app.neo4j_service)
        
        # Get basic user info
        user = auth_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Get user statistics
        stats = auth_service.get_user_stats(user_id)
        
        # Get favorite genres
        genres_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)-[:HAS_GENRE]->(g:Genre)
        WHERE r.rating >= 4.0
        WITH g, COUNT(r) as count, AVG(r.rating) as avg_rating
        RETURN g.name as genre, count, avg_rating
        ORDER BY count DESC, avg_rating DESC
        LIMIT 5
        """
        
        favorite_genres = current_app.neo4j_service.execute_query(
            genres_query, {'user_id': user_id}
        )
        
        # Get recently rated movies
        recent_ratings_query = """
        MATCH (u:User {id: $user_id})-[r:RATED]->(m:Movie)
        RETURN m.id as movie_id, m.title as movie_title, m.poster_url as poster_url,
               r.rating as rating, r.timestamp as timestamp
        ORDER BY r.timestamp DESC
        LIMIT 5
        """
        
        recent_ratings = current_app.neo4j_service.execute_query(
            recent_ratings_query, {'user_id': user_id}
        )
        
        profile_data = {
            'user': user.to_dict(),
            'stats': stats,
            'favorite_genres': favorite_genres,
            'recent_ratings': recent_ratings
        }
        
        return jsonify(profile_data), 200
        
    except Exception as e:
        print(f"❌ Error getting user profile: {e}")
        return jsonify({'message': 'Failed to get user profile'}), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_user_profile():
    """Update user profile information"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        auth_service = AuthService(current_app.neo4j_service)
        
        # Get current user
        user = auth_service.get_user_by_id(user_id)
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        # Update allowed fields
        if 'username' in data:
            user.username = data['username']
        
        # Validate updated user
        validation_errors = user.validate()
        if validation_errors:
            return jsonify({'message': 'Validation errors', 'errors': validation_errors}), 400
        
        # Update in database
        success = auth_service.update_user(user)
        if not success:
            return jsonify({'message': 'Failed to update profile'}), 500
        
        print(f"✅ Updated profile for user {user_id}")
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        print(f"❌ Error updating user profile: {e}")
        return jsonify({'message': 'Failed to update profile'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({'message': 'No data provided'}), 400
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not all([current_password, new_password]):
            return jsonify({'message': 'Both current and new passwords are required'}), 400
        
        if len(new_password) < 6:
            return jsonify({'message': 'New password must be at least 6 characters long'}), 400
        
        auth_service = AuthService(current_app.neo4j_service)
        
        # Verify current password
        user = auth_service.get_user_by_id(user_id)
        if not user or not user.check_password(current_password):
            return jsonify({'message': 'Current password is incorrect'}), 401
        
        # Update password
        success = auth_service.update_password(user_id, new_password)
        if not success:
            return jsonify({'message': 'Failed to change password'}), 500
        
        print(f"✅ Password changed for user {user_id}")
        return jsonify({'message': 'Password changed successfully'}), 200
        
    except Exception as e:
        print(f"❌ Error changing password: {e}")
        return jsonify({'message': 'Failed to change password'}), 500