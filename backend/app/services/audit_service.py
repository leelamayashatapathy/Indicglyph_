"""Admin Audit Logging Service - tracks all admin actions."""
import logging
from datetime import datetime
from typing import Optional, Dict, Any
from backend.app.db_adapter import db_adapter

logger = logging.getLogger(__name__)


class AuditService:
    """Service for logging admin actions for security and compliance."""
    
    @staticmethod
    async def log_action(
        admin_username: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        success: bool = True,
        error_message: Optional[str] = None
    ) -> str:
        """
        Log an admin action.
        
        Args:
            admin_username: Username of admin performing action
            action: Action type (create, update, delete, export, process_payout, etc.)
            resource_type: Type of resource (dataset_type, user, system_config, etc.)
            resource_id: ID of the resource affected (optional)
            details: Additional details about the action (optional)
            success: Whether action succeeded
            error_message: Error message if action failed
            
        Returns:
            Audit log ID
        """
        audit_log = {
            "admin_username": admin_username,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
            "success": success,
            "error_message": error_message,
            "timestamp": datetime.utcnow().isoformat(),
            "ip_address": None,  # TODO: Add IP tracking if needed
        }
        
        try:
            log_id = await db_adapter.insert("admin_audit_logs", audit_log)
            return log_id
        except Exception as exc:
            logger.error("Failed to persist audit log for action %s on %s: %s", action, resource_type, exc)
            raise
    
    @staticmethod
    async def get_audit_logs(
        limit: int = 100,
        offset: int = 0,
        admin_username: Optional[str] = None,
        action: Optional[str] = None,
        resource_type: Optional[str] = None,
        success: Optional[bool] = None
    ) -> Dict[str, Any]:
        """
        Retrieve audit logs with filtering and pagination.
        
        Args:
            limit: Maximum number of logs to return
            offset: Number of logs to skip
            admin_username: Filter by admin username
            action: Filter by action type
            resource_type: Filter by resource type
            success: Filter by success status
            
        Returns:
            Dict with logs, total count, and pagination info
        """
        def predicate(log: dict) -> bool:
            if admin_username and log.get("admin_username") != admin_username:
                return False
            if action and log.get("action") != action:
                return False
            if resource_type and log.get("resource_type") != resource_type:
                return False
            if success is not None and log.get("success") != success:
                return False
            return True
        
        try:
            all_logs = await db_adapter.find("admin_audit_logs", predicate)
        except Exception as exc:
            logger.error("Failed to fetch audit logs: %s", exc)
            raise
        
        all_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        total_count = len(all_logs)
        paginated_logs = all_logs[offset:offset + limit]
        
        return {
            "logs": paginated_logs,
            "total": total_count,
            "limit": limit,
            "offset": offset,
            "has_more": (offset + limit) < total_count
        }
    
    @staticmethod
    async def get_recent_activity(admin_username: str, limit: int = 10):
        """Get recent activity for a specific admin."""
        try:
            all_logs = await db_adapter.find(
                "admin_audit_logs",
                lambda log: log.get("admin_username") == admin_username
            )
        except Exception as exc:
            logger.error("Failed to fetch recent audit activity for %s: %s", admin_username, exc)
            raise
        
        all_logs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return all_logs[:limit]
