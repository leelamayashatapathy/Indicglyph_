"""
PostgreSQL Adapter - Storage abstraction layer
Provides MongoDB-like API over PostgreSQL using JSONB
"""
import json
import uuid
import logging
from typing import Any, Dict, List, Optional, Callable, Sequence
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import text, bindparam, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
try:
    from backend.app.config import config
except ImportError:
    from app.config import config

logger = logging.getLogger(__name__)


class DBAdapter:
    """
    Adapter that wraps PostgreSQL with MongoDB-like operations.
    Uses a single table with collection and JSONB document storage.
    """
    
    def __init__(self):
        self.engine = create_async_engine(config.DATABASE_URL, echo=config.DEBUG)
        self.SessionFactory = async_sessionmaker(self.engine, class_=AsyncSession, expire_on_commit=False)
        self.prefix = "curation"
        self._initialized = False
    
    async def _ensure_schema(self):
        """Create table if it doesn't exist"""
        if self._initialized:
            return
        
        async with self.engine.begin() as conn:
            # Create table
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS documents (
                    id SERIAL PRIMARY KEY,
                    collection_name VARCHAR(255) NOT NULL,
                    doc_id VARCHAR(255) NOT NULL,
                    data JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(collection_name, doc_id)
                )
            """))
            # Create indexes separately (asyncpg doesn't support multiple statements in one execute)
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_collection_doc ON documents(collection_name, doc_id)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_collection ON documents(collection_name)"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS idx_data_gin ON documents USING GIN (data)"))
        self._initialized = True
    
    def _key(self, collection: str, doc_id: str) -> str:
        """Generate namespaced key (for compatibility, not used in PostgreSQL)"""
        return f"{self.prefix}:{collection}:{doc_id}"

    @asynccontextmanager
    async def transaction(self) -> AsyncSession:
        """Async transactional context yielding a shared session."""
        await self._ensure_schema()
        async with self.SessionFactory() as session:
            async with session.begin():
                yield session
    
    async def insert(self, collection: str, document: Dict[str, Any]) -> str:
        """Insert document, generate ID if not present"""
        await self._ensure_schema()
        doc_id = document.get("_id") or str(uuid.uuid4())
        document["_id"] = doc_id
        
        async with self.SessionFactory() as session:
            await session.execute(
                text("""
                    INSERT INTO documents (collection_name, doc_id, data, updated_at)
                    VALUES (:collection, :doc_id, CAST(:data AS jsonb), CURRENT_TIMESTAMP)
                    ON CONFLICT (collection_name, doc_id) 
                    DO UPDATE SET data = CAST(:data AS jsonb), updated_at = CURRENT_TIMESTAMP
                """),
                {"collection": collection, "doc_id": doc_id, "data": json.dumps(document)}
            )
            await session.commit()
        return doc_id
    
    async def get(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        await self._ensure_schema()
        async with self.SessionFactory() as session:
            result = await session.execute(
                text("SELECT data FROM documents WHERE collection_name = :collection AND doc_id = :doc_id"),
                {"collection": collection, "doc_id": doc_id}
            )
            row = result.fetchone()
            if row:
                return row[0]
            return None

    async def get_for_update(self, session: AsyncSession, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get document by ID with FOR UPDATE lock using an existing session."""
        await self._ensure_schema()
        result = await session.execute(
            text("""
                SELECT data FROM documents 
                WHERE collection_name = :collection AND doc_id = :doc_id
                FOR UPDATE
            """),
            {"collection": collection, "doc_id": doc_id}
        )
        row = result.fetchone()
        return row[0] if row else None
    
    async def update(self, collection: str, doc_id: str, updates: Dict[str, Any]) -> bool:
        """
        Update document fields.
        Supports dotted field notation (e.g., "review_state.status").
        """
        doc = await self.get(collection, doc_id)
        if not doc:
            return False
        
        # Apply updates (handle nested fields)
        for field, value in updates.items():
            parts = field.split(".")
            current = doc
            
            for i, part in enumerate(parts[:-1]):
                if part not in current:
                    current[part] = {}
                current = current[part]
            
            last_key = parts[-1]
            current[last_key] = value
        
        # Save updated document
        async with self.SessionFactory() as session:
            await session.execute(
                text("""
                    UPDATE documents 
                    SET data = CAST(:data AS jsonb), updated_at = CURRENT_TIMESTAMP
                    WHERE collection_name = :collection AND doc_id = :doc_id
                """),
                {"collection": collection, "doc_id": doc_id, "data": json.dumps(doc)}
            )
            await session.commit()
        return True

    async def _upsert_with_session(self, session: AsyncSession, collection: str, document: Dict[str, Any]) -> str:
        """Internal helper to upsert using an existing session."""
        doc_id = document.get("_id") or str(uuid.uuid4())
        document["_id"] = doc_id
        await session.execute(
            text("""
                INSERT INTO documents (collection_name, doc_id, data, updated_at)
                VALUES (:collection, :doc_id, CAST(:data AS jsonb), CURRENT_TIMESTAMP)
                ON CONFLICT (collection_name, doc_id)
                DO UPDATE SET data = CAST(:data AS jsonb), updated_at = CURRENT_TIMESTAMP
            """),
            {"collection": collection, "doc_id": doc_id, "data": json.dumps(document)}
        )
        return doc_id

    async def upsert_document(self, session: AsyncSession, collection: str, document: Dict[str, Any]) -> str:
        """Public helper to upsert within an existing transaction."""
        await self._ensure_schema()
        return await self._upsert_with_session(session, collection, document)

    async def insert_document(self, session: AsyncSession, collection: str, document: Dict[str, Any]) -> str:
        """Insert document using an existing session (upsert semantics)."""
        await self._ensure_schema()
        return await self._upsert_with_session(session, collection, document)
    
    async def upsert(self, collection: str, doc_id: str, document: Dict[str, Any]) -> str:
        """Insert or update document"""
        document["_id"] = doc_id
        await self.insert(collection, document)
        return doc_id
    
    async def delete(self, collection: str, doc_id: str) -> bool:
        """Delete document"""
        await self._ensure_schema()
        async with self.SessionFactory() as session:
            result = await session.execute(
                text("DELETE FROM documents WHERE collection_name = :collection AND doc_id = :doc_id"),
                {"collection": collection, "doc_id": doc_id}
            )
            await session.commit()
            return result.rowcount > 0
    
    async def find(self, collection: str, predicate: Optional[Callable[[Dict], bool]] = None) -> List[Dict[str, Any]]:
        """
        Find documents matching predicate.
        Predicate is a function that takes a document and returns True/False.
        If no predicate, returns all documents in collection.
        """
        await self._ensure_schema()
        async with self.SessionFactory() as session:
            result = await session.execute(
                text("SELECT data FROM documents WHERE collection_name = :collection"),
                {"collection": collection}
            )
            rows = result.fetchall()
            documents = [row[0] for row in rows]
            
            if predicate:
                documents = [doc for doc in documents if predicate(doc)]
            
            return documents
    
    async def find_one(self, collection: str, predicate: Callable[[Dict], bool]) -> Optional[Dict[str, Any]]:
        """Find first document matching predicate"""
        results = await self.find(collection, predicate)
        return results[0] if results else None
    
    async def inc(self, collection: str, doc_id: str, field: str, amount: float = 1.0) -> bool:
        """Increment numeric field"""
        doc = await self.get(collection, doc_id)
        if not doc:
            return False
        
        # Handle nested fields
        parts = field.split(".")
        current = doc
        
        for i, part in enumerate(parts[:-1]):
            if part not in current:
                current[part] = {}
            current = current[part]
        
        last_key = parts[-1]
        current[last_key] = current.get(last_key, 0) + amount
        
        # Save updated document
        async with self.SessionFactory() as session:
            await session.execute(
                text("""
                    UPDATE documents 
                    SET data = CAST(:data AS jsonb), updated_at = CURRENT_TIMESTAMP
                    WHERE collection_name = :collection AND doc_id = :doc_id
                """),
                {"collection": collection, "doc_id": doc_id, "data": json.dumps(doc)}
            )
            await session.commit()
        return True
    
    async def list_collection(self, collection: str) -> List[Dict[str, Any]]:
        """List all documents in collection"""
        return await self.find(collection)
    
    async def count(self, collection: str, predicate: Optional[Callable[[Dict], bool]] = None) -> int:
        """Count documents matching predicate"""
        results = await self.find(collection, predicate)
        return len(results)

    async def _build_filtered_query(
        self,
        collection: str,
        filters: Optional[Dict[str, Any]] = None
    ):
        """
        Build SQL WHERE clause parts and params for common filters.
        Supported filters: dataset_type_id, language, status, finalized, uploader_id, reviewer_id.
        """
        where_clauses = ["collection_name = :collection"]
        params: Dict[str, Any] = {"collection": collection}
        filters = filters or {}

        def _json_equals(path: str, key: str, value: Any):
            where_clauses.append(f"{path} = :{key}")
            params[key] = value

        def _json_in(path: str, key: str, values: Sequence[Any]):
            where_clauses.append(f"{path} = ANY(:{key})")
            params[key] = list(values)

        if "dataset_type_id" in filters and filters["dataset_type_id"]:
            _json_equals("data->>'dataset_type_id'", "dataset_type_id", filters["dataset_type_id"])

        if "language" in filters and filters["language"]:
            langs = filters["language"]
            if isinstance(langs, (list, tuple, set)):
                _json_in("data->>'language'", "language", langs)
            else:
                _json_equals("data->>'language'", "language", langs)

        if "status" in filters and filters["status"]:
            _json_equals("data->'review_state'->>'status'", "status", filters["status"])

        if "finalized" in filters and filters["finalized"] is not None:
            where_clauses.append("(data->'review_state'->>'finalized')::boolean = :finalized")
            params["finalized"] = bool(filters["finalized"])

        if "uploader_id" in filters and filters["uploader_id"]:
            _json_equals("data->>'uploader_id'", "uploader_id", filters["uploader_id"])

        if "reviewer_id" in filters and filters["reviewer_id"]:
            _json_equals("data->>'reviewer_id'", "reviewer_id", filters["reviewer_id"])

        if "flagged" in filters and filters["flagged"] is not None:
            where_clauses.append("(data->>'flagged')::boolean = :flagged")
            params["flagged"] = bool(filters["flagged"])

        if "is_gold" in filters and filters["is_gold"] is not None:
            where_clauses.append("(data->>'is_gold')::boolean = :is_gold")
            params["is_gold"] = bool(filters["is_gold"])

        return where_clauses, params

    async def query_collection(
        self,
        collection: str,
        filters: Optional[Dict[str, Any]] = None,
        sort_by: str = "created_at",
        sort_dir: str = "desc",
        limit: Optional[int] = None,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        Server-side filtered, sorted, paginated query.
        New code should prefer this over in-Python scans.
        If filters/limits are not provided, falls back to list_collection behavior.
        """
        await self._ensure_schema()
        if not filters and limit is None and offset == 0 and sort_by == "created_at":
            items = await self.list_collection(collection)
            return {"items": items, "total": len(items)}

        where_clauses, params = await self._build_filtered_query(collection, filters)

        # Sorting
        sort_dir_sql = "DESC" if str(sort_dir).lower() == "desc" else "ASC"
        if sort_by == "updated_at":
            order_expr = "updated_at"
        elif sort_by == "item_number":
            order_expr = "(data->>'item_number')::bigint"
        else:
            # default to created_at from data or fallback to created_at column
            order_expr = "COALESCE((data->>'created_at')::timestamptz, created_at)"

        where_sql = " AND ".join(where_clauses)

        count_sql = text(f"""
            SELECT COUNT(*) FROM documents
            WHERE {where_sql}
        """)

        query_sql = text(f"""
            SELECT data FROM documents
            WHERE {where_sql}
            ORDER BY {order_expr} {sort_dir_sql}
            LIMIT :limit OFFSET :offset
        """)

        params["limit"] = limit if limit is not None else 1000
        params["offset"] = offset

        async with self.SessionFactory() as session:
            count_result = await session.execute(count_sql, params)
            total = count_result.scalar() or 0

            result = await session.execute(query_sql, params)
            rows = result.fetchall()
            items = [row[0] for row in rows]

        return {"items": items, "total": total}

    async def count_documents(self, collection: str, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count documents server-side using common filters."""
        await self._ensure_schema()
        where_clauses, params = await self._build_filtered_query(collection, filters)
        where_sql = " AND ".join(where_clauses)
        count_sql = text(f"SELECT COUNT(*) FROM documents WHERE {where_sql}")
        async with self.SessionFactory() as session:
            result = await session.execute(count_sql, params)
            return result.scalar() or 0

    async def claim_next_dataset_item(
        self,
        languages: Optional[Sequence[str]],
        lock_owner: str,
        lock_timeout_sec: int = 180,
        dataset_type_id: Optional[str] = None
    ) -> Optional[Dict[str, Any]]:
        """
        Atomically claim the next eligible dataset item using SQL (no in-Python scan).
        
        Eligibility:
        - Not finalized
        - Language matches provided list (if any)
        - Status pending OR stale in_review lock older than lock_timeout_sec
        - Optional dataset_type_id filter
        """
        await self._ensure_schema()
        languages = list(languages) if languages else []
        lang_filter = bool(languages)
        now = datetime.utcnow()
        stale_cutoff = now - timedelta(seconds=lock_timeout_sec)

        async with self.SessionFactory() as session:
            stmt = text("""
                WITH candidate AS (
                    SELECT id, data
                    FROM documents
                    WHERE collection_name = 'dataset_items'
                      AND COALESCE((data->'review_state'->>'finalized')::boolean, false) = false
                      AND (:dataset_type_id IS NULL OR data->>'dataset_type_id' = :dataset_type_id)
                      AND (
                          :lang_filter = false OR data->>'language' = ANY(:languages)
                      )
                      AND NOT ((data->'review_state'->'reviewed_by') @> :reviewer_ids_jsonb)
                      AND (
                          data->'review_state'->>'status' = 'pending' OR
                          (
                              data->'review_state'->>'status' = 'in_review' AND
                              COALESCE((data->'review_state'->>'lock_time')::timestamptz, to_timestamp(0)) < :stale_cutoff
                          )
                      )
                    ORDER BY (data->>'created_at')::timestamptz NULLS FIRST, id
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED
                )
                UPDATE documents d
                  SET data = jsonb_set(
                      jsonb_set(
                          jsonb_set(d.data, '{review_state,lock_owner}', :lock_owner_jsonb, true),
                          '{review_state,lock_time}', :now_ts_jsonb, true
                      ),
                      '{review_state,status}', '"in_review"'::jsonb, true
                  ),
                  updated_at = CURRENT_TIMESTAMP
                FROM candidate c
                WHERE d.id = c.id
                RETURNING d.data;
            """)

            stmt = stmt.bindparams(
                bindparam("languages", type_=ARRAY(String)),
                bindparam("reviewer_ids_jsonb", type_=JSONB),
                bindparam("lock_owner_jsonb", type_=JSONB),
                bindparam("now_ts_jsonb", type_=JSONB),
                bindparam("dataset_type_id", type_=String),
            )

            params = {
                "languages": languages,
                "lang_filter": lang_filter,
                "lock_owner_jsonb": lock_owner,
                "reviewer_ids_jsonb": [lock_owner],
                "now_ts_jsonb": now.isoformat(),
                "stale_cutoff": stale_cutoff,
                "dataset_type_id": dataset_type_id,
            }
            logger.debug(
                "claim_next_dataset_item executing with params=%s param_types=%s",
                params,
                {k: type(v).__name__ for k, v in params.items()},
            )

            try:
                result = await session.execute(stmt, params)
            except Exception:
                logger.exception("claim_next_dataset_item failed with params=%s", params)
                raise

            row = result.fetchone()
            logger.debug("claim_next_dataset_item fetchone -> %s", "hit" if row else "none")
            return row[0] if row else None


# Global instance
db_adapter = DBAdapter()


# Database adapter - PostgreSQL-based with backward-compatible API
class DatabaseAdapter:
    """PostgreSQL adapter providing unified database interface."""
    
    def __init__(self, prefix: str = ""):
        """Initialize adapter with optional prefix for namespacing."""
        self.prefix = prefix
        self.collection = prefix.rstrip(":") if prefix else "default"
    
    async def _ensure_schema(self):
        """Ensure schema exists"""
        await db_adapter._ensure_schema()
    
    async def get(self, key: str, default: Any = None) -> Any:
        """Get value by key."""
        await self._ensure_schema()
        doc = await db_adapter.get(self.collection, key)
        return doc if doc else default
    
    async def set(self, key: str, value: Any) -> None:
        """Set value for key."""
        await self._ensure_schema()
        if isinstance(value, dict):
            await db_adapter.upsert(self.collection, key, value)
        else:
            await db_adapter.upsert(self.collection, key, {"value": value, "_id": key})
    
    async def delete(self, key: str) -> bool:
        """Delete key. Returns True if existed."""
        await self._ensure_schema()
        return await db_adapter.delete(self.collection, key)
    
    async def exists(self, key: str) -> bool:
        """Check if key exists."""
        await self._ensure_schema()
        doc = await db_adapter.get(self.collection, key)
        return doc is not None
    
    async def list_keys(self, pattern: str = "") -> List[str]:
        """List all keys matching pattern."""
        await self._ensure_schema()
        docs = await db_adapter.list_collection(self.collection)
        keys = [doc.get("_id", "") for doc in docs if doc.get("_id", "").startswith(pattern)]
        return keys
    
    async def get_all(self, pattern: str = "") -> Dict[str, Any]:
        """Get all key-value pairs matching pattern."""
        keys = await self.list_keys(pattern)
        result = {}
        for key in keys:
            result[key] = await self.get(key)
        return result
    
    async def clear_all(self, pattern: str = "") -> int:
        """Delete all keys matching pattern. Returns count deleted."""
        keys = await self.list_keys(pattern)
        count = 0
        for key in keys:
            if await self.delete(key):
                count += 1
        return count


# Singleton instances for different namespaces (for backward compatibility)
users_db = DatabaseAdapter(prefix="user")
datasets_db = DatabaseAdapter(prefix="dataset")
dataset_types_db = DatabaseAdapter(prefix="dataset_type")
dataset_items_db = DatabaseAdapter(prefix="dataset_item")
reviews_db = DatabaseAdapter(prefix="review")
payouts_db = DatabaseAdapter(prefix="payout")
queue_db = DatabaseAdapter(prefix="queue")
