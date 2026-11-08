from datetime import date

from rest_framework import permissions
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from .services import dashboard


def _int_param(params, name, default, low, high):
    raw = params.get(name)
    if raw in (None, ''):
        return default
    try:
        value = int(raw)
    except (TypeError, ValueError):
        raise ValidationError({name: 'Debe ser un número entero'})
    if not low <= value <= high:
        raise ValidationError({name: f'Debe estar entre {low} y {high}'})
    return value


def parse_period(params):
    """Lee month/year de la query; por defecto, el mes actual."""
    today = date.today()
    month = _int_param(params, 'month', today.month, 1, 12)
    year = _int_param(params, 'year', today.year, 2000, 2100)
    return month, year


class _DashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]


class SummaryView(_DashboardView):
    def get(self, request):
        month, year = parse_period(request.query_params)
        return Response(dashboard.get_summary(request.user, month, year))


class MonthlyFlowView(_DashboardView):
    def get(self, request):
        month, year = parse_period(request.query_params)
        months = _int_param(request.query_params, 'months', 6, 1, 24)
        return Response(dashboard.get_monthly_flow(request.user, month, year, months))


class BudgetStatusView(_DashboardView):
    def get(self, request):
        month, year = parse_period(request.query_params)
        return Response(dashboard.get_budget_status(request.user, month, year))


class ExpensesByCategoryView(_DashboardView):
    def get(self, request):
        month, year = parse_period(request.query_params)
        return Response(dashboard.get_expenses_by_category(request.user, month, year))
