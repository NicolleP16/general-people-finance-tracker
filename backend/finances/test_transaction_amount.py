"""HU-02 Record a transaction: boundary values for the amount - Steven Candela.

Acceptance criterion: an amount of 0 or less is rejected and nothing is saved.
Boundary value analysis: 0.00 is the last invalid value and 0.01 the first valid one.
"""
from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from finances.models import Category, Transaction

URL = "/api/finances/transactions/"


@pytest.fixture
def user(db):
    return get_user_model().objects.create_user(
        email="steven@example.com", name="Steven", password="StrongPassword123!"
    )


@pytest.fixture
def api_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def food(user):
    return Category.objects.create(user=user, name="Food", type="expense", color="#E53935")


def expense(category, amount):
    return {
        "category": category.id,
        "amount": amount,
        "type": "expense",
        "transaction_date": str(date.today()),
        "description": "Lunch",
    }


def test_zero_amount_is_invalid(api_client, food):
    response = api_client.post(URL, expense(food, "0.00"), format="json")

    assert response.status_code == 400
    assert response.data["amount"] == ["El monto debe ser mayor que cero"]
    assert Transaction.objects.count() == 0


def test_smallest_positive_amount_is_valid(api_client, food):
    response = api_client.post(URL, expense(food, "0.01"), format="json")

    assert response.status_code == 201
    assert Transaction.objects.get().amount == Decimal("0.01")
