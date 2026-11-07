# backend/seed_data.py
import os
import sys
import random
from datetime import date, timedelta
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
import django
django.setup()

from django.contrib.auth import get_user_model
from finances.models import Category, Transaction, Budget

User = get_user_model()

def seed():
    print("🌱 Iniciando generación de datos de prueba...")

    email = "laura@ejemplo.com"
    password = "Password123!"
    name = "Laura Álvarez"

    user, created = User.objects.get_or_create(
        email=email,
        defaults={"name": name}
    )
    user.set_password(password)
    user.save()
    print(f"✅ Usuario listo: {email} / Contraseña: {password}")

    categories_data = [
        {"name": "Alimentación", "type": "expense", "color": "#D93829"},
        {"name": "Transporte", "type": "expense", "color": "#E67E22"},
        {"name": "Vivienda & Servicios", "type": "expense", "color": "#8E44AD"},
        {"name": "Ocio & Restaurantes", "type": "expense", "color": "#D35400"},
        {"name": "Salud & Bienestar", "type": "expense", "color": "#16A085"},
        {"name": "Educación", "type": "expense", "color": "#2980B9"},
        {"name": "Suscripciones", "type": "expense", "color": "#7F8C8D"},
        {"name": "Salario", "type": "income", "color": "#274E2A"},
        {"name": "Freelance / Consultoría", "type": "income", "color": "#2ECC71"},
        {"name": "Inversiones", "type": "income", "color": "#1ABC9C"},
        {"name": "Ventas & Extras", "type": "income", "color": "#3498DB"},
    ]

    cat_objs = {}
    for cdata in categories_data:
        cat, _ = Category.objects.get_or_create(
            user=user,
            name=cdata["name"],
            defaults={"type": cdata["type"], "color": cdata["color"]}
        )
        cat_objs[cat.name] = cat

    print(f"✅ {len(cat_objs)} Categorías verificadas/creadas para {email}.")

    Transaction.objects.filter(user=user).delete()
    print("🧹 Transacciones anteriores limpiadas.")

    today = date.today()
    transactions_to_create = []

    sample_expenses = [
        ("Alimentación", ["Supermercado Éxito semanal", "Mercado de frutas y verduras", "Almuerzo de trabajo", "Panadería artesanal", "Snacks y café"]),
        ("Transporte", ["Recarga tarjeta de metro/bus", "Gasolina", "Uber reunión cliente", "Mantenimiento preventivo", "Peaje fin de semana"]),
        ("Vivienda & Servicios", ["Factura de luz e internet", "Servicio de agua", "Administración edificio", "Artículos de limpieza"]),
        ("Ocio & Restaurantes", ["Cena con amigos", "Cine y palomitas", "Boletas de concierto", "Salida de café el domingo"]),
        ("Salud & Bienestar", ["Farmacia y medicamentos", "Mensualidad gimnasio", "Consulta médica especializada"]),
        ("Suscripciones", ["Spotify Premium", "Netflix Familiar", "iCloud Storage", "Gimnasio app"]),
    ]

    for months_back in range(3):
        for day in [15, 30]:
            tx_date = today - timedelta(days=(months_back * 30) + (30 - day))
            if tx_date <= today:
                transactions_to_create.append(
                    Transaction(
                        user=user,
                        category=cat_objs["Salario"],
                        amount=Decimal("3500000.00"),
                        type="income",
                        transaction_date=tx_date,
                        description="Pago de nómina quincenal"
                    )
                )

    for _ in range(4):
        days_ago = random.randint(5, 75)
        tx_date = today - timedelta(days=days_ago)
        amount = Decimal(random.choice([650000, 1200000, 850000, 450000]))
        transactions_to_create.append(
            Transaction(
                user=user,
                category=cat_objs["Freelance / Consultoría"],
                amount=amount,
                type="income",
                transaction_date=tx_date,
                description=random.choice(["Diseño web para cliente", "Asesoría financiera proyecto", "Revisión técnica de software"])
            )
        )

    for _ in range(45):
        days_ago = random.randint(1, 60)
        tx_date = today - timedelta(days=days_ago)
        cat_name, descriptions = random.choice(sample_expenses)
        
        if cat_name == "Alimentación":
            amount = Decimal(random.randint(35000, 240000))
        elif cat_name == "Transporte":
            amount = Decimal(random.randint(12000, 95000))
        elif cat_name == "Vivienda & Servicios":
            amount = Decimal(random.randint(90000, 380000))
        elif cat_name == "Ocio & Restaurantes":
            amount = Decimal(random.randint(45000, 180000))
        elif cat_name == "Salud & Bienestar":
            amount = Decimal(random.randint(50000, 220000))
        else:
            amount = Decimal(random.randint(22000, 65000))

        transactions_to_create.append(
            Transaction(
                user=user,
                category=cat_objs[cat_name],
                amount=amount,
                type="expense",
                transaction_date=tx_date,
                description=random.choice(descriptions)
            )
        )

    Transaction.objects.bulk_create(transactions_to_create)
    print(f"🎉 Se generaron con éxito {len(transactions_to_create)} transacciones.")

    Budget.objects.filter(user=user, month=today.month, year=today.year).delete()
    Budget.objects.create(user=user, category=cat_objs["Alimentación"], amount_limit=Decimal("900000"), month=today.month, year=today.year)
    Budget.objects.create(user=user, category=cat_objs["Transporte"], amount_limit=Decimal("350000"), month=today.month, year=today.year)
    Budget.objects.create(user=user, category=cat_objs["Ocio & Restaurantes"], amount_limit=Decimal("400000"), month=today.month, year=today.year)

    print("🎯 Presupuestos configurados.")
    print("\n-----------------------------------------------------------")
    print(" LISTO PARA INICIAR SESIÓN")
    print(f" 📧 Correo:     {email}")
    print(f" 🔑 Contraseña: {password}")
    print("-----------------------------------------------------------")

if __name__ == "__main__":
    seed()