import pytest
from datetime import date
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from finances.models import Category, Transaction

User = get_user_model()

@pytest.mark.django_db
class TestTransactions:
    @pytest.fixture(autouse=True)
    def setup(self):
        # Usamos el cliente API de DRF
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="testuser@example.com",
            name="Test User",
            password="StrongPassword123!"
        )
        self.category_expense = Category.objects.create(
            name="Alimentación",
            type="expense",
            color="#E53935"
        )
        self.category_income = Category.objects.create(
            name="Salario",
            type="income",
            color="#43A047"
        )

    def test_create_valid_transaction(self):
        self.client.force_authenticate(user=self.user)
        payload = {
            "category": self.category_income.id,
            "amount": "1500.00",
            "type": "income",
            "transaction_date": str(date.today()),
            "description": "Pago quincenal"
        }
        response = self.client.post("/api/finances/transactions/", payload)
        assert response.status_code == 201
        assert response.data["amount"] == "1500.00"
        assert response.data["user"] == self.user.id

    def test_reject_negative_or_zero_amount(self):
        """Caja negra: valores frontera inválidos"""
        self.client.force_authenticate(user=self.user)
        payload = {
            "category": self.category_expense.id,
            "amount": "-50.00",
            "type": "expense",
            "transaction_date": str(date.today()),
            "description": "Gasto no permitido"
        }
        response = self.client.post("/api/finances/transactions/", payload)
        assert response.status_code == 400
        assert "amount" in response.data

    def test_user_data_isolation(self):
        """Seguridad: un usuario no puede ver transacciones de otro"""
        other_user = User.objects.create_user(
            email="other@example.com",
            name="Other",
            password="StrongPassword123!"
        )
        Transaction.objects.create(
            user=other_user,
            category=self.category_expense,
            amount=100,
            type="expense",
            transaction_date=date.today()
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/finances/transactions/")
        assert response.status_code == 200
        assert len(response.data) == 0

    def test_summary_calculation(self):
        """Caja blanca: comprobación de agregaciones matemáticas"""
        Transaction.objects.create(
            user=self.user,
            category=self.category_income,
            amount=500,
            type="income",
            transaction_date=date.today()
        )
        Transaction.objects.create(
            user=self.user,
            category=self.category_expense,
            amount=200,
            type="expense",
            transaction_date=date.today()
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/finances/transactions/summary/")
        assert response.status_code == 200
        assert response.data["incomes"] == 500.0
        assert response.data["expenses"] == 200.0
        assert response.data["balance"] == 300.0