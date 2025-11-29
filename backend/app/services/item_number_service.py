"""Service for managing sequential item numbers per dataset type."""
try:
    from backend.app.db_adapter import db_adapter
except ModuleNotFoundError:
    from app.db_adapter import db_adapter


class ItemNumberService:
    """Manages sequential item numbering for dataset items."""
    
    @staticmethod
    async def get_next_number(dataset_type_id: str) -> int:
        """
        Get the next sequential number for a dataset type.
        Uses a counter stored in DB with key: item_counter:{dataset_type_id}
        """
        counter_key = f"item_counter:{dataset_type_id}"
        counter_doc = await db_adapter.get("counters", counter_key)
        
        if not counter_doc:
            # Initialize counter at 1
            counter_doc = {
                "_id": counter_key,
                "dataset_type_id": dataset_type_id,
                "current": 1
            }
            await db_adapter.insert("counters", counter_doc)
            return 1
        
        # Increment and return
        current = counter_doc.get("current", 0)
        next_num = current + 1
        await db_adapter.update("counters", counter_key, {"current": next_num})
        return next_num
    
    @staticmethod
    async def assign_numbers_to_existing_items():
        """
        One-time migration: Assign numbers to items that don't have them.
        Groups by dataset_type_id and assigns sequential numbers.
        """
        all_items = await db_adapter.find("dataset_items", lambda x: True)
        
        # Group by dataset type
        by_type = {}
        for item in all_items:
            type_id = item.get("dataset_type_id")
            if type_id:
                if type_id not in by_type:
                    by_type[type_id] = []
                by_type[type_id].append(item)
        
        # Assign numbers per type (sorted by created_at if available)
        updated_count = 0
        for type_id, items in by_type.items():
            # Sort by created_at to maintain chronological order
            items.sort(key=lambda x: x.get("created_at", ""))
            
            for idx, item in enumerate(items, start=1):
                if item.get("item_number") is None:
                    await db_adapter.update("dataset_items", item["_id"], {"item_number": idx})
                    updated_count += 1
            
            # Update counter to highest number + 1
            max_number = len(items)
            counter_key = f"item_counter:{type_id}"
            await db_adapter.upsert("counters", counter_key, {
                "_id": counter_key,
                "dataset_type_id": type_id,
                "current": max_number
            })
        
        return updated_count


item_number_service = ItemNumberService()
