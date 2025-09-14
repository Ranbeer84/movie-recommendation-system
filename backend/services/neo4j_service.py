from neo4j import GraphDatabase
import os
import logging

# Set up logging to help us debug
logging.basicConfig(level=logging.INFO)

class Neo4jService:
    """
    This class handles all connections to our Neo4j database.
    Think of it as a bridge between our Flask app and the database.
    """
    
    def __init__(self):
        # Get database connection details from environment variables
        self.uri = os.getenv('NEO4J_URI', 'neo4j://127.0.0.1:7687')
        self.user = os.getenv('NEO4J_USER', 'neo4j')
        self.password = os.getenv('NEO4J_PASSWORD', 'password')
        
        try:
            # Create connection to Neo4j
            self.driver = GraphDatabase.driver(
                self.uri,
                auth=(self.user, self.password)
            )
            
            # Test the connection
            with self.driver.session() as session:
                session.run("RETURN 1")
            logging.info("✅ Successfully connected to Neo4j database!")
            
        except Exception as e:
            logging.error(f"❌ Failed to connect to Neo4j: {e}")
            self.driver = None
            raise

    def close(self):
        """Close the database connection"""
        if self.driver:
            self.driver.close()

    def execute_query(self, query, parameters=None):
        """
        Execute a read query (like finding movies or users)
        
        Args:
            query: The Cypher query to execute
            parameters: Dictionary of parameters for the query
        
        Returns:
            List of results from the query
        """
        try:
            with self.driver.session() as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logging.error(f"❌ Query execution failed: {e}")
            logging.error(f"Query: {query}")
            logging.error(f"Parameters: {parameters}")
            raise

    def execute_write_query(self, query, parameters=None):
        """
        Execute a write query (like creating or updating data)
        
        Args:
            query: The Cypher query to execute
            parameters: Dictionary of parameters for the query
        
        Returns:
            List of results from the query
        """
        try:
            with self.driver.session() as session:
                with session.begin_transaction() as tx:
                    result = tx.run(query, parameters or {})
                    return [record.data() for record in result]
        except Exception as e:
            logging.error(f"❌ Write query execution failed: {e}")
            logging.error(f"Query: {query}")
            logging.error(f"Parameters: {parameters}")
            raise