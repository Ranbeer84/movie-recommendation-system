from neo4j import GraphDatabase
import os
import logging

logging.basicConfig(level=logging.INFO)


class Neo4jService:
    def __init__(self):
        self.uri = os.getenv("NEO4J_URI")
        self.user = os.getenv("NEO4J_USER")
        self.password = os.getenv("NEO4J_PASSWORD")
        self.database = os.getenv("NEO4J_DATABASE", "neo4j")

        if not all([self.uri, self.user, self.password]):
            raise RuntimeError(
                "NEO4J_URI, NEO4J_USER and NEO4J_PASSWORD must be set"
            )

        try:
            self.driver = GraphDatabase.driver(
                self.uri, auth=(self.user, self.password)
            )
            with self.driver.session(database=self.database) as session:
                session.run("RETURN 1").consume()
            logging.info("✅ Successfully connected to Neo4j database!")
        except Exception as e:
            logging.error(f"❌ Failed to connect to Neo4j: {e}")
            self.driver = None
            raise

    def close(self):
        if self.driver:
            self.driver.close()

    def execute_query(self, query, parameters=None):
        try:
            with self.driver.session(database=self.database) as session:
                result = session.run(query, parameters or {})
                return [record.data() for record in result]
        except Exception as e:
            logging.error(f"❌ Query execution failed: {e}")
            logging.error(f"Query: {query}")
            raise

    def execute_write_query(self, query, parameters=None):
        try:
            with self.driver.session(database=self.database) as session:
                return session.execute_write(
                    lambda tx: [r.data() for r in tx.run(query, parameters or {})]
                )
        except Exception as e:
            logging.error(f"❌ Write query execution failed: {e}")
            logging.error(f"Query: {query}")
            raise