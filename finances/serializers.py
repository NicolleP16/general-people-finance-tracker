from rest_framework import serializers
from .models import Category, Transaction, Budget

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Transaction
        fields = ('id', 'user', 'category', 'category_name', 'amount', 'type', 'transaction_date', 'description', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')

class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Budget
        fields = ('id', 'user', 'category', 'category_name', 'amount_limit', 'month', 'year', 'created_at')
        read_only_fields = ('id', 'user', 'created_at')