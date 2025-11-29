"""Migration script to rename admin roles to platform_operator roles."""
import sys
import os
# Add parent directory to path so we can import backend modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from backend.app.db_adapter import users_db
import asyncio


async def migrate_roles():
    """Migrate all users with 'admin' role to 'platform_operator' and 'superadmin' to 'super_operator'."""
    print("\n=== Role Migration Script ===\n")
    
    try:
        # Get all users
        print("Connecting to database...")
        all_users = await users_db.get_all()
        print(f"Found {len(all_users)} user(s) in database.\n")
        
        migrated_count = 0
        for username, user_data in all_users.items():
            roles = user_data.get("roles", [])
            updated = False
            new_roles = roles.copy()
            
            # Replace admin with platform_operator
            if "admin" in new_roles:
                new_roles.remove("admin")
                new_roles.append("platform_operator")
                updated = True
            
            # Replace superadmin with super_operator
            if "superadmin" in new_roles:
                new_roles.remove("superadmin")
                new_roles.append("super_operator")
                updated = True
            
            if updated:
                user_data["roles"] = new_roles
                await users_db.set(username, user_data)
                migrated_count += 1
                print(f"[OK] Migrated user: {username}")
                print(f"  Old roles: {roles}")
                print(f"  New roles: {new_roles}\n")
        
        if migrated_count == 0:
            print("No users found with 'admin' or 'superadmin' roles to migrate.\n")
        else:
            print(f"\n[SUCCESS] Migration complete! Migrated {migrated_count} user(s).\n")
        
    except ConnectionRefusedError:
        print("\n[ERROR] Database connection refused. Please ensure PostgreSQL is running.")
        print("  - Check if Docker containers are running: docker ps")
        print("  - Start database: docker-compose up -d db")
        print("  - Or check DATABASE_URL in config.py\n")
    except Exception as e:
        print(f"\n[ERROR] Error during migration: {e}\n")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(migrate_roles())

