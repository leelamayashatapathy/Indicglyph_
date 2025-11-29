"""Seed script for sample data - dataset types, items, system config."""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure local .env is loaded before importing config/db adapter
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.app.db_adapter import db_adapter
from backend.app.models.dataset_type_model import dataset_type_to_dict
from backend.app.models.dataset_item_model import dataset_item_to_dict


async def seed_system_config():
    """Seed system configuration."""
    config = {
        "_id": "config",
        "payout_rate_default": 0.002,
        "skip_threshold_default": 5,
        "lock_timeout_sec": 180,
        "finalize_review_count": 3,
    }

    await db_adapter.insert("system_config", config)
    print("System config seeded")


async def seed_dataset_types():
    """Seed dataset types."""
    types = [
        {
            "name": "News Headlines",
            "description": "Review and verify news headlines for accuracy",
            "fields": [
                {"key": "headline", "type": "text", "required": True, "label": "Headline"},
                {"key": "source", "type": "text", "required": False, "label": "Source"},
            ],
            "languages": ["en", "hi", "es"],
            "payout_rate": 0.003,
            "active": True,
        },
        {
            "name": "Product Descriptions",
            "description": "Review product descriptions for quality and completeness",
            "fields": [
                {"key": "title", "type": "text", "required": True, "label": "Product Title"},
                {"key": "description", "type": "textarea", "required": True, "label": "Description"},
                {"key": "price", "type": "number", "required": False, "label": "Price"},
            ],
            "languages": ["en"],
            "payout_rate": 0.005,
            "active": True,
        },
    ]

    type_ids = []
    for type_data in types:
        dt = dataset_type_to_dict(type_data)
        type_id = await db_adapter.insert("dataset_types", dt)
        type_ids.append(type_id)
        print(f"Dataset type created: {type_data['name']} (ID: {type_id})")

    return type_ids


def build_news_items(news_type_id: str):
    """Return clean dummy news items."""
    news_samples = [
        {
            "language": "en",
            "headline": "Breaking: Major Tech Company Announces AI Breakthrough",
            "source": "TechNews Daily",
            "category": "technology",
        },
        {
            "language": "en",
            "headline": "Global Markets Rally on Economic Recovery Signs",
            "source": "Financial Ledger",
            "category": "finance",
        },
        {
            "language": "en",
            "headline": "City Council Approves New Public Transit Plan",
            "source": "Metro Bulletin",
            "category": "policy",
        },
        {
            "language": "en",
            "headline": "Scientists Map Ocean Floor at Record Speed",
            "source": "Research Weekly",
            "category": "science",
        },
        {
            "language": "en",
            "headline": "Healthcare Startup Raises Series B Funding",
            "source": "Venture Signal",
            "category": "health",
        },
        {
            "language": "hi",
            "headline": "Hindi News Desk Reports Rise In Solar Projects",
            "source": "Dainik Sandesh",
            "category": "energy",
        },
        {
            "language": "en",
            "headline": "Researchers Develop Low Cost Solar Panels",
            "source": "Green Wire",
            "category": "energy",
        },
        {
            "language": "es",
            "headline": "Liga Nacional Confirma Calendario Expandido",
            "source": "Deporte Hoy",
            "category": "sports",
        },
        {
            "language": "en",
            "headline": "Local Community Garden Celebrates Five Years",
            "source": "Neighborhood Post",
            "category": "community",
        },
        {
            "language": "en",
            "headline": "University Launches Online Cybersecurity Program",
            "source": "Campus Update",
            "category": "education",
        },
        {
            "language": "hi",
            "headline": "Hindi Business Review Covers Retail Expansion",
            "source": "Bazaar Patrika",
            "category": "business",
        },
        {
            "language": "hi",
            "headline": "Hindi Health Journal Tracks New Wellness Clinics",
            "source": "Swasthya Times",
            "category": "health",
        },
        {
            "language": "en",
            "headline": "New Battery Design Promises Faster Charging",
            "source": "Gadget Report",
            "category": "technology",
        },
        {
            "language": "es",
            "headline": "Biblioteca Publica Abre Laboratorio De Innovacion",
            "source": "Ciudad Diario",
            "category": "community",
        },
        {
            "language": "en",
            "headline": "Cloud Provider Unveils Carbon Neutral Data Center",
            "source": "Compute Weekly",
            "category": "sustainability",
        },
        {
            "language": "hi",
            "headline": "Agriculture Desk Predicts Strong Wheat Harvest",
            "source": "Kisan Mail",
            "category": "agriculture",
        },
        {
            "language": "en",
            "headline": "Airline Introduces Flexible Ticket Policy",
            "source": "Travel Daily",
            "category": "travel",
        },
        {
            "language": "es",
            "headline": "Banco Central Mantiene Tasas Sin Cambios",
            "source": "Economia Hoy",
            "category": "finance",
        },
        {
            "language": "hi",
            "headline": "Startup Launches Portable Air Quality Monitor",
            "source": "Nayi Soch",
            "category": "technology",
        },
        {
            "language": "en",
            "headline": "Art Museum Debuts Modern Sculpture Exhibit",
            "source": "Culture Line",
            "category": "arts",
        },
    ]

    return [
        {
            "dataset_type_id": news_type_id,
            "language": sample["language"],
            "content": {"headline": sample["headline"], "source": sample["source"]},
            "meta": {"source": "seed_script", "category": sample["category"]},
        }
        for sample in news_samples
    ]


def build_product_items(product_type_id: str):
    """Return clean dummy product items."""
    product_samples = [
        {
            "title": "Wireless Bluetooth Headphones",
            "description": "Premium noise canceling headphones with 30 hour battery life",
            "price": 199.99,
            "category": "electronics",
        },
        {
            "title": "Organic Cotton T Shirt",
            "description": "Comfortable 100 percent organic cotton tee in neutral colors",
            "price": 29.99,
            "category": "clothing",
        },
        {
            "title": "Smart Home Hub",
            "description": "Voice controlled hub that connects lights, locks, and speakers",
            "price": 149.00,
            "category": "electronics",
        },
        {
            "title": "Stainless Steel Water Bottle",
            "description": "Insulated bottle that keeps drinks cold for 24 hours",
            "price": 24.50,
            "category": "outdoors",
        },
        {
            "title": "Noise Cancelling Earbuds",
            "description": "Compact earbuds with ambient sound control and fast charging",
            "price": 119.95,
            "category": "electronics",
        },
        {
            "title": "Portable Laptop Stand",
            "description": "Foldable aluminum stand with adjustable height and angle",
            "price": 42.00,
            "category": "office",
        },
        {
            "title": "Fitness Tracker Wristband",
            "description": "Tracks steps, heart rate, and sleep with a seven day battery",
            "price": 69.00,
            "category": "fitness",
        },
        {
            "title": "LED Desk Lamp With USB Port",
            "description": "Touch control lamp with dimmer, timer, and charging port",
            "price": 35.75,
            "category": "home",
        },
        {
            "title": "Travel Backpack 30L",
            "description": "Lightweight backpack with padded laptop sleeve and organizer",
            "price": 88.00,
            "category": "travel",
        },
        {
            "title": "Ceramic Coffee Mug Set",
            "description": "Set of four matte finish mugs safe for microwave and dishwasher",
            "price": 32.00,
            "category": "kitchen",
        },
        {
            "title": "Mechanical Keyboard Compact",
            "description": "Hot swappable keyboard with tactile switches and white backlight",
            "price": 115.00,
            "category": "electronics",
        },
        {
            "title": "Reusable Grocery Tote Bag",
            "description": "Durable canvas bag with reinforced handles for daily shopping",
            "price": 12.00,
            "category": "home",
        },
        {
            "title": "Electric Kettle Rapid Boil",
            "description": "1.7 liter glass kettle with auto shutoff and boil dry protection",
            "price": 49.99,
            "category": "kitchen",
        },
        {
            "title": "Camping Sleeping Bag",
            "description": "Three season sleeping bag rated to 30 degrees Fahrenheit",
            "price": 79.50,
            "category": "outdoors",
        },
        {
            "title": "Adjustable Phone Tripod",
            "description": "Flexible tripod with bluetooth remote and universal mount",
            "price": 27.00,
            "category": "photography",
        },
        {
            "title": "Yoga Mat With Carry Strap",
            "description": "Non slip mat with cushioned support and easy carry strap",
            "price": 39.99,
            "category": "fitness",
        },
        {
            "title": "Wireless Charger Pad",
            "description": "Slim charger compatible with Qi enabled phones and earbuds",
            "price": 25.00,
            "category": "electronics",
        },
        {
            "title": "Minimalist Leather Wallet",
            "description": "Slim wallet with RFID blocking and four card slots",
            "price": 45.00,
            "category": "accessories",
        },
        {
            "title": "Air Purifier Desktop",
            "description": "Compact purifier with HEPA filter for small rooms and offices",
            "price": 99.00,
            "category": "home",
        },
        {
            "title": "Bluetooth Shower Speaker",
            "description": "Water resistant speaker with suction mount and 12 hour playtime",
            "price": 34.00,
            "category": "electronics",
        },
    ]

    return [
        {
            "dataset_type_id": product_type_id,
            "language": "en",
            "content": {
                "title": sample["title"],
                "description": sample["description"],
                "price": sample["price"],
            },
            "meta": {"source": "seed_script", "category": sample["category"]},
        }
        for sample in product_samples
    ]


async def seed_dataset_items(type_ids):
    """Seed dataset items."""
    if len(type_ids) < 2:
        print("Not enough dataset types to seed items")
        return

    news_type_id = type_ids[0]
    product_type_id = type_ids[1]

    items = build_news_items(news_type_id) + build_product_items(product_type_id)

    for item_data in items:
        item = dataset_item_to_dict(item_data)
        item_id = await db_adapter.insert("dataset_items", item)
        print(f"Dataset item created: {item['language']} - {item_id[:8]}...")


async def main():
    """Run all seed functions."""
    print("\n=== Seeding Data ===\n")

    try:
        await seed_system_config()
        type_ids = await seed_dataset_types()
        await seed_dataset_items(type_ids)

        print("\nSeeding complete!\n")
    except Exception as e:
        print(f"\nError seeding data: {e}\n")
        import traceback

        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
