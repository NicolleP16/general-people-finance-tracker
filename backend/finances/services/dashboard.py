"""Lógica de negocio del dashboard (HU-07, HU-08 y presupuestos).

Funciones puras sobre el ORM: las vistas solo validan parámetros y delegan aquí.
"""
from decimal import Decimal

from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth

from finances.models import Budget, Transaction

ZERO = Decimal('0')
WARNING_THRESHOLD = 90  # % de uso a partir del cual el presupuesto está en alerta


def to_number(value):
    """Decimal/None -> float para serializar a JSON."""
    return float(value or 0)


def pct_change(current, previous):
    """Variación porcentual; None si no hay base de comparación (previous == 0)."""
    if not previous:
        return None
    return round(float((current - previous) / previous * 100), 1)


def previous_period(month, year):
    return (12, year - 1) if month == 1 else (month - 1, year)


def shift_month(month, year, delta):
    """Desplaza (month, year) en `delta` meses (puede ser negativo)."""
    index = year * 12 + (month - 1) + delta
    return index % 12 + 1, index // 12


def month_totals(user, month, year):
    """(ingresos, gastos) del usuario en el mes indicado."""
    totals = Transaction.objects.filter(
        user=user, transaction_date__year=year, transaction_date__month=month
    ).aggregate(
        incomes=Sum('amount', filter=Q(type='income')),
        expenses=Sum('amount', filter=Q(type='expense')),
    )
    return totals['incomes'] or ZERO, totals['expenses'] or ZERO


def calculate_balance(incomes, expenses):
    return incomes - expenses


def get_summary(user, month, year):
    incomes, expenses = month_totals(user, month, year)
    prev_incomes, prev_expenses = month_totals(user, *previous_period(month, year))

    balance = calculate_balance(incomes, expenses)
    prev_balance = calculate_balance(prev_incomes, prev_expenses)
    savings = max(balance, ZERO)

    return {
        'period': {'month': month, 'year': year},
        'incomes': {'amount': to_number(incomes), 'change_pct': pct_change(incomes, prev_incomes)},
        'expenses': {'amount': to_number(expenses), 'change_pct': pct_change(expenses, prev_expenses)},
        'balance': {'amount': to_number(balance), 'change_pct': pct_change(balance, prev_balance)},
        'savings': {
            'amount': to_number(savings),
            'pct_of_income': round(float(savings / incomes * 100), 1) if incomes else None,
        },
    }


def get_monthly_flow(user, month, year, months=6):
    """Serie mensual de ingresos y gastos para los últimos `months` meses
    (el último es el mes indicado). Los meses sin movimientos salen en 0."""
    start_month, start_year = shift_month(month, year, -(months - 1))
    end_month, end_year = shift_month(month, year, 1)
    rows = (
        Transaction.objects
        .filter(
            user=user,
            transaction_date__gte=f'{start_year}-{start_month:02d}-01',
            transaction_date__lt=f'{end_year}-{end_month:02d}-01',
        )
        .annotate(period=TruncMonth('transaction_date'))
        .values('period')
        .annotate(
            incomes=Sum('amount', filter=Q(type='income')),
            expenses=Sum('amount', filter=Q(type='expense')),
        )
    )
    by_period = {(r['period'].year, r['period'].month): r for r in rows}

    series = []
    for offset in range(months):
        m, y = shift_month(start_month, start_year, offset)
        row = by_period.get((y, m), {})
        series.append({
            'month': f'{y}-{m:02d}',
            'incomes': to_number(row.get('incomes')),
            'expenses': to_number(row.get('expenses')),
        })

    incomes, expenses = month_totals(user, month, year)
    prev_incomes, prev_expenses = month_totals(user, *previous_period(month, year))
    balance = calculate_balance(incomes, expenses)
    prev_balance = calculate_balance(prev_incomes, prev_expenses)

    return {
        'series': series,
        'period_balance': to_number(balance),
        'balance_change_pct': pct_change(balance, prev_balance),
    }


def budget_status_for(used_pct):
    if used_pct > 100:
        return 'exceeded'
    if used_pct >= WARNING_THRESHOLD:
        return 'warning'
    return 'ok'


def get_budget_status(user, month, year):
    budgets = Budget.objects.filter(user=user, month=month, year=year).select_related('category')
    spent_by_category = {
        row['category_id']: row['total']
        for row in Transaction.objects.filter(
            user=user, type='expense',
            transaction_date__year=year, transaction_date__month=month,
        ).values('category_id').annotate(total=Sum('amount'))
    }

    result = []
    for budget in budgets:
        spent = spent_by_category.get(budget.category_id, ZERO)
        used_pct = round(float(spent / budget.amount_limit * 100), 1) if budget.amount_limit else 0.0
        result.append({
            'category_id': budget.category_id,
            'name': budget.category.name,
            'spent': to_number(spent),
            'limit': to_number(budget.amount_limit),
            'used_pct': used_pct,
            'status': budget_status_for(used_pct),
        })
    return result


def get_expenses_by_category(user, month, year):
    rows = list(
        Transaction.objects
        .filter(user=user, type='expense', transaction_date__year=year, transaction_date__month=month)
        .values('category_id', 'category__name', 'category__color')
        .annotate(total=Sum('amount'))
        .order_by('-total')
    )
    grand_total = sum((r['total'] for r in rows), ZERO)
    return [
        {
            'category_id': r['category_id'],
            'name': r['category__name'],
            'color': r['category__color'],
            'total': to_number(r['total']),
            'percentage': round(float(r['total'] / grand_total * 100), 1),
        }
        for r in rows
    ]
