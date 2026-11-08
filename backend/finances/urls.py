from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CategoryViewSet
from .dashboard_views import (
    SummaryView, MonthlyFlowView, BudgetStatusView, ExpensesByCategoryView,
)

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'categories', CategoryViewSet, basename='category')

urlpatterns = [
    path('dashboard/summary/', SummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/monthly-flow/', MonthlyFlowView.as_view(), name='dashboard-monthly-flow'),
    path('dashboard/budget-status/', BudgetStatusView.as_view(), name='dashboard-budget-status'),
    path('dashboard/expenses-by-category/', ExpensesByCategoryView.as_view(),
         name='dashboard-expenses-by-category'),
    path('', include(router.urls)),
]