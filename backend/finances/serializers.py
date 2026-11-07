from datetime import date
from rest_framework import serializers
from .models import Category, Transaction, Budget

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_color = serializers.ReadOnlyField(source='category.color')

    class Meta:
        model = Transaction
        fields = (
            'id', 'user', 'category', 'category_name', 'category_color',
            'amount', 'type', 'transaction_date', 'description', 'created_at'
        )
        read_only_fields = ('id', 'user', 'created_at')

    def validate_amount(self, value):
        # Criterio HU-02: monto mayor a 0
        if value <= 0:
            raise serializers.ValidationError("El monto debe ser mayor que cero")
        return value

    def validate_transaction_date(self, value):
        # Criterio HU-02: fecha no puede ser futura
        if value > date.today():
            raise serializers.ValidationError("Fecha no válida")
        return value

    def validate_description(self, value):
        # Criterio HU-02: máximo 255 caracteres
        if value and len(value) > 255:
            raise serializers.ValidationError("La descripción no puede exceder los 255 caracteres")
        return value

    def validate(self, data):
        category = data.get('category')
        tx_type = data.get('type')
        if category and tx_type and category.type != tx_type:
            raise serializers.ValidationError({
                "category": f"La categoría debe ser de tipo '{tx_type}'."
            })
        return data

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Budget
        fields = ('id', 'user', 'category', 'category_name', 'amount_limit', 'month', 'year', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')