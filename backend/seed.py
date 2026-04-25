from sqlmodel import Session, create_engine, select
from main import Property, engine, create_db_and_tables

def seed_data():
    create_db_and_tables()
    with Session(engine) as session:
        # Check if data already exists
        statement = select(Property)
        results = session.exec(statement).first()
        if results:
            print("Database already seeded.")
            return

        properties = [
            Property(
                title="Modern Luxury Villa",
                description="A stunning modern villa with panoramic ocean views, infinity pool, and open-plan living space.",
                price=1250000.0,
                location="Malibu, CA",
                image_url="https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
                bedrooms=5,
                bathrooms=4,
                area_sqft=4500
            ),
            Property(
                title="Charming Downtown Loft",
                description="Industrial-style loft in the heart of the city, featuring exposed brick, high ceilings, and large windows.",
                price=675000.0,
                location="Denver, CO",
                image_url="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80",
                bedrooms=2,
                bathrooms=2,
                area_sqft=1800
            ),
            Property(
                title="Cozy Mountain Retreat",
                description="Escape to the mountains in this handcrafted log cabin with a stone fireplace and wrap-around deck.",
                price=450000.0,
                location="Aspen, CO",
                image_url="https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=800&q=80",
                bedrooms=3,
                bathrooms=2,
                area_sqft=2200
            ),
            Property(
                title="Sleek Penthouse Suite",
                description="Top-floor luxury with city-skyline views, designer finishes, and a private rooftop garden.",
                price=2100000.0,
                location="New York, NY",
                image_url="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
                bedrooms=3,
                bathrooms=3,
                area_sqft=3200
            ),
            Property(
                title="Suburban Family Home",
                description="Spacious four-bedroom home with a large backyard, perfect for a growing family in a quiet neighborhood.",
                price=525000.0,
                location="Austin, TX",
                image_url="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80",
                bedrooms=4,
                bathrooms=3,
                area_sqft=2800
            ),
            Property(
                title="Beachside Bungalow",
                description="Steps from the sand, this breezy bungalow features coastal decor and a sun-drenched patio.",
                price=890000.0,
                location="Miami, FL",
                image_url="https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80",
                bedrooms=2,
                bathrooms=1,
                area_sqft=1200
            ),
        ]

        for p in properties:
            session.add(p)
        
        session.commit()
        print("Successfully seeded 6 properties.")

if __name__ == "__main__":
    seed_data()
