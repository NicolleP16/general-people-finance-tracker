from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.exceptions import ValidationError
from django.db.models import Sum
from .models import Transaction, Category
from .serializers import TransactionSerializer, CategorySerializer

class TransactionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = TransactionPagination

    def get_queryset(self):
        queryset = Transaction.objects.filter(user=self.request.user).order_by('-transaction_date', '-created_at')
        
        tx_type = self.request.query_params.get('type')
        category_id = self.request.query_params.get('category')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if start_date and end_date:
            try:
                dt_start = datetime.strptime(start_date, '%Y-%m-%d').date()
                dt_end = datetime.strptime(end_date, '%Y-%m-%d').date()
            except ValueError:
                raise ValidationError({"error": "Formato de fecha inválido. Use YYYY-MM-DD"})

            if dt_start > dt_end:
                raise ValidationError({"error": "La fecha inicial no puede ser posterior a la fecha final"})

            queryset = queryset.filter(transaction_date__gte=dt_start, transaction_date__lte=dt_end)
        elif start_date:
            queryset = queryset.filter(transaction_date__gte=start_date)
        elif end_date:
            queryset = queryset.filter(transaction_date__lte=end_date)

        if tx_type:
            queryset = queryset.filter(type=tx_type)
        if category_id:
            queryset = queryset.filter(category_id=category_id)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='summary', pagination_class=None)
    def summary(self, request):
        user_tx = Transaction.objects.filter(user=request.user)
        incomes = user_tx.filter(type='income').aggregate(total=Sum('amount'))['total'] or 0
        expenses = user_tx.filter(type='expense').aggregate(total=Sum('amount'))['total'] or 0
        balance = incomes - expenses
        
        return Response({
            "incomes": float(incomes),
            "expenses": float(expenses),
            "balance": float(balance),
            "savings": float(balance if balance > 0 else 0)
        }, status=status.HTTP_200_OK)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)