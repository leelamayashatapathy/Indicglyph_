"""Seed script to create initial super_operator user."""
import sys
import os
# Add parent directory to path so we can import backend modules
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from backend.app.db_adapter import users_db
from backend.app.models.user_model import User
from backend.app.auth.password_utils import hash_password
import asyncio


async def seed_super_operator():
    """Create or update super_operator user."""
    print("\n=== Seeding Super Operator User ===\n")
    
    username = "demoadmin"
    email = os.getenv("SUPER_OPERATOR_EMAIL", "demoadmin@taapset.com")
    password = os.getenv("SUPER_OPERATOR_PASSWORD")
    
    if not password:
        print("[ERROR] SUPER_OPERATOR_PASSWORD environment variable not set.")
        return

    try:
        # Check if user exists
        existing_user = await users_db.get(username)
        
        if existing_user:
            print(f"User '{username}' already exists. Deleting...")
            await users_db.delete(username)
            print(f"[OK] Deleted existing user: {username}\n")
        
        # Create new super_operator user
        print(f"Creating super_operator user...")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Role: super_operator\n")
        
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(password),
            roles=["super_operator"],
            languages=["en"],
            is_active=True
        )
        
        await users_db.set(username, user.to_dict())
        
        print(f"[SUCCESS] Super operator user created successfully!")
        print(f"  Username: {username}")
        print(f"  Email: {email}")
        print(f"  Password: [HIDDEN_FROM_LOGS]")
        print(f"  Role: super_operator\n")
        print("You can now login with these credentials.\n")
        
    except Exception as e:
        print(f"\n[ERROR] Error creating super operator user: {e}\n")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(seed_super_operator())
