from datetime import date
from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from finances.models import Budget, Category, Transaction
from finances.services import dashboard

User = get_user_model()

BASE = '/api/finances/dashboard'


@pytest.fixture
def user(db):
    return User.objects.create_user(email='dash@example.com', name='Dash', password='StrongPassword123!')


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email='other@example.com', name='Other', password='StrongPassword123!')


@pytest.fixture
def client(user):
    api = APIClient()
    api.force_authenticate(user=user)
    return api


@pytest.fixture
def cats(user):
    return {
        'salary': Category.objects.create(user=user, name='Salario', type='income', color='#43A047'),
        'food': Category.objects.create(user=user, name='Alimentación', type='expense', color='#E53935'),
        'fun': Category.objects.create(user=user, name='Ocio', type='expense', color='#FB8C00'),
    }


def tx(user, category, amount, day, kind):
    return Transaction.objects.create(
        user=user, category=category, amount=Decimal(str(amount)), type=kind, transaction_date=day
    )


# ---------- HU-07: balance ----------

@pytest.mark.django_db
def test_balance_es_ingresos_menos_gastos(user, cats):
    tx(user, cats['salary'], 1000, date(2026, 9, 1), 'income')
    tx(user, cats['food'], 300, date(2026, 9, 5), 'expense')
    tx(user, cats['fun'], 100, date(2026, 9, 6), 'expense')

    summary = dashboard.get_summary(user, 9, 2026)

    assert summary['incomes']['amount'] == 1000
    assert summary['expenses']['amount'] == 400
    assert summary['balance']['amount'] == 600
    assert summary['savings']['amount'] == 600
    assert summary['savings']['pct_of_income'] == 60.0


@pytest.mark.django_db
def test_summary_sin_datos_devuelve_ceros_y_sin_porcentajes(user):
    summary = dashboard.get_summary(user, 9, 2026)

    assert summary['balance']['amount'] == 0
    assert summary['incomes']['change_pct'] is None
    assert summary['savings']['pct_of_income'] is None


@pytest.mark.django_db
def test_ahorro_es_cero_si_el_balance_es_negativo(user, cats):
    tx(user, cats['salary'], 100, date(2026, 9, 1), 'income')
    tx(user, cats['food'], 250, date(2026, 9, 2), 'expense')

    summary = dashboard.get_summary(user, 9, 2026)

    assert summary['balance']['amount'] == -150
    assert summary['savings']['amount'] == 0


@pytest.mark.django_db
def test_variacion_contra_mes_anterior(user, cats):
    tx(user, cats['salary'], 1000, date(2026, 8, 1), 'income')
    tx(user, cats['salary'], 1100, date(2026, 9, 1), 'income')
    tx(user, cats['food'], 400, date(2026, 8, 3), 'expense')
    tx(user, cats['food'], 200, date(2026, 9, 3), 'expense')

    summary = dashboard.get_summary(user, 9, 2026)

    assert summary['incomes']['change_pct'] == 10.0
    assert summary['expenses']['change_pct'] == -50.0


@pytest.mark.django_db
def test_enero_compara_contra_diciembre_del_anio_anterior(user, cats):
    tx(user, cats['salary'], 500, date(2025, 12, 15), 'income')
    tx(user, cats['salary'], 1000, date(2026, 1, 15), 'income')

    assert dashboard.get_summary(user, 1, 2026)['incomes']['change_pct'] == 100.0


def test_pct_change_con_base_cero_es_none():
    assert dashboard.pct_change(Decimal('10'), Decimal('0')) is None


def test_shift_month_cruza_anios():
    assert dashboard.shift_month(2, 2026, -3) == (11, 2025)
    assert dashboard.shift_month(11, 2026, 3) == (2, 2027)


# ---------- flujo mensual ----------

@pytest.mark.django_db
def test_monthly_flow_rellena_meses_vacios_y_respeta_el_rango(user, cats):
    tx(user, cats['salary'], 1000, date(2026, 7, 10), 'income')
    tx(user, cats['food'], 400, date(2026, 9, 10), 'expense')
    tx(user, cats['salary'], 9999, date(2026, 10, 1), 'income')  # fuera del rango pedido

    flow = dashboard.get_monthly_flow(user, 9, 2026, months=3)

    assert [p['month'] for p in flow['series']] == ['2026-07', '2026-08', '2026-09']
    assert flow['series'][0]['incomes'] == 1000
    assert flow['series'][1] == {'month': '2026-08', 'incomes': 0, 'expenses': 0}
    assert flow['series'][2]['expenses'] == 400
    assert flow['period_balance'] == -400


# ---------- presupuestos ----------

@pytest.mark.parametrize('pct,expected', [
    (0, 'ok'), (89.9, 'ok'), (90, 'warning'), (100, 'warning'), (100.1, 'exceeded'),
])
def test_budget_status_for_valores_limite(pct, expected):
    assert dashboard.budget_status_for(pct) == expected


@pytest.mark.django_db
def test_budget_status_calcula_uso_y_estado(user, cats):
    Budget.objects.create(user=user, category=cats['food'], amount_limit=900, month=9, year=2026)
    Budget.objects.create(user=user, category=cats['fun'], amount_limit=400, month=9, year=2026)
    tx(user, cats['food'], 450, date(2026, 9, 2), 'expense')
    tx(user, cats['fun'], 390, date(2026, 9, 3), 'expense')

    result = {b['name']: b for b in dashboard.get_budget_status(user, 9, 2026)}

    assert result['Alimentación']['used_pct'] == 50.0
    assert result['Alimentación']['status'] == 'ok'
    assert result['Ocio']['used_pct'] == 97.5
    assert result['Ocio']['status'] == 'warning'


@pytest.mark.django_db
def test_budget_status_ignora_otros_meses_y_sin_gasto_es_cero(user, cats):
    Budget.objects.create(user=user, category=cats['food'], amount_limit=500, month=9, year=2026)
    tx(user, cats['food'], 999, date(2026, 8, 30), 'expense')

    result = dashboard.get_budget_status(user, 9, 2026)

    assert result[0]['spent'] == 0
    assert result[0]['status'] == 'ok'


# ---------- gasto por categoría ----------

@pytest.mark.django_db
def test_gasto_por_categoria_agrupa_suma_y_ordena(user, cats):
    tx(user, cats['food'], 300, date(2026, 9, 1), 'expense')
    tx(user, cats['food'], 100, date(2026, 9, 2), 'expense')
    tx(user, cats['fun'], 100, date(2026, 9, 3), 'expense')
    tx(user, cats['salary'], 5000, date(2026, 9, 1), 'income')  # no cuenta como gasto

    result = dashboard.get_expenses_by_category(user, 9, 2026)

    assert [r['name'] for r in result] == ['Alimentación', 'Ocio']
    assert result[0]['total'] == 400
    assert result[0]['percentage'] == 80.0
    assert sum(r['percentage'] for r in result) == 100.0


# ---------- endpoints ----------

@pytest.mark.django_db
def test_endpoints_requieren_autenticacion():
    anon = APIClient()
    for path in ('summary', 'monthly-flow', 'budget-status', 'expenses-by-category'):
        assert anon.get(f'{BASE}/{path}/').status_code == 401


@pytest.mark.django_db
def test_endpoints_responden_200(client, cats, user):
    tx(user, cats['salary'], 100, date(2026, 9, 1), 'income')
    for path in ('summary', 'monthly-flow', 'budget-status', 'expenses-by-category'):
        assert client.get(f'{BASE}/{path}/?month=9&year=2026').status_code == 200


@pytest.mark.django_db
@pytest.mark.parametrize('query', [
    'month=0', 'month=13', 'month=abc', 'year=1999', 'year=2101', 'year=x',
])
def test_parametros_de_periodo_invalidos_devuelven_400(client, query):
    assert client.get(f'{BASE}/summary/?{query}').status_code == 400


@pytest.mark.django_db
@pytest.mark.parametrize('months', ['0', '25', 'abc'])
def test_months_invalido_devuelve_400(client, months):
    assert client.get(f'{BASE}/monthly-flow/?months={months}').status_code == 400


@pytest.mark.django_db
def test_sin_parametros_usa_el_mes_actual(client, user, cats):
    tx(user, cats['salary'], 100, date.today(), 'income')
    data = client.get(f'{BASE}/summary/').data
    assert data['period'] == {'month': date.today().month, 'year': date.today().year}
    assert data['incomes']['amount'] == 100


@pytest.mark.django_db
def test_aislamiento_de_datos_entre_usuarios(client, other_user, cats):
    other_cat = Category.objects.create(user=other_user, name='Salario', type='income', color='#000000')
    tx(other_user, other_cat, 5000, date(2026, 9, 1), 'income')

    assert client.get(f'{BASE}/summary/?month=9&year=2026').data['incomes']['amount'] == 0
    assert client.get(f'{BASE}/expenses-by-category/?month=9&year=2026').data == []
