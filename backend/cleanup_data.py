#!/usr/bin/env python3
"""
Clean slate script - Removes all dummy data while preserving system structure.
Keeps: Users, System Config, Audit Logs
Deletes: Dataset Types, Dataset Items, Counters, Payouts, OCR Jobs, Audio Jobs
"""
import sys
sys.path.insert(0, '/home/runner/workspace')

from app.db_adapter import db_adapter

def cleanup_all_data():
    """Remove all data for fresh start while preserving users and config."""
    
    print("=" * 60)
    print("🧹 CLEAN SLATE - Data Cleanup Script")
    print("=" * 60)
    
    collections_to_clean = {
        'dataset_types': 'Dataset Types',
        'dataset_items': 'Dataset Items',
        'counters': 'Item Number Counters',
        'payouts': 'Payout Records',
        'ocr_jobs': 'OCR Jobs',
        'audio_jobs': 'Audio Jobs'
    }
    
    preserved = {
        'users': 'User Accounts',
        'system_config': 'System Configuration',
        'audit_logs': 'Audit Logs'
    }
    
    print("\n📦 Collections to PRESERVE:")
    for key, name in preserved.items():
        items = db_adapter.find(key)
        print(f"  ✓ {name}: {len(items)} items")
    
    print("\n🗑️  Collections to DELETE:")
    deletion_summary = {}
    
    for collection, name in collections_to_clean.items():
        items = db_adapter.find(collection)
        count = len(items)
        deletion_summary[name] = count
        print(f"  ✗ {name}: {count} items")
    
    print("\n⚠️  WARNING: This will permanently delete all data above!")
    print("Type 'DELETE' to confirm: ", end='')
    
    # Auto-confirm for script execution (remove in production)
    confirmation = "DELETE"
    print(confirmation)
    
    if confirmation != "DELETE":
        print("\n❌ Cleanup cancelled.")
        return False
    
    print("\n🔥 Starting deletion...")
    
    for collection, name in collections_to_clean.items():
        items = db_adapter.find(collection)
        deleted = 0
        
        for item in items:
            if db_adapter.delete(collection, item['_id']):
                deleted += 1
        
        print(f"  ✓ Deleted {deleted} {name}")
    
    print("\n✅ Cleanup complete!")
    print("\n📊 Summary:")
    print(f"  Total items deleted: {sum(deletion_summary.values())}")
    
    print("\n🔍 Verification:")
    for collection, name in collections_to_clean.items():
        remaining = db_adapter.find(collection)
        status = "✓" if len(remaining) == 0 else "⚠️"
        print(f"  {status} {name}: {len(remaining)} remaining")
    
    print("\n🛡️  Preserved collections:")
    for key, name in preserved.items():
        items = db_adapter.find(key)
        print(f"  ✓ {name}: {len(items)} items preserved")
    
    print("\n🎉 Clean slate ready! You can now add fresh data.")
    return True

if __name__ == "__main__":
    try:
        cleanup_all_data()
    except Exception as e:
        print(f"\n❌ Error during cleanup: {str(e)}")
        sys.exit(1)
