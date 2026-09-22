from decimal import Decimal
from datetime import date, timedelta
from django.db.models import Sum, Count, F
from apps.sales.models import Sale, SaleLine
from apps.inventory.models import Batch, StockBalance
from apps.inventory.services import FEFOEngine
from apps.catalogue.models import Product
from apps.parties.models import Supplier
from apps.finance.models import Expense

class DashboardAnalyticsService:
    """Aggregates executive KPIs, inventory risk surveillance, and financial metrics."""

    @classmethod
    def get_dashboard_kpis(cls, branch):
        today = date.today()

        # 1. Today's Sales & Profit
        today_sales_qs = Sale.objects.filter(branch=branch, created_at__date=today, status='COMPLETED')
        today_rev = today_sales_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.0000')
        today_profit = today_sales_qs.aggregate(total=Sum('gross_profit_amount'))['total'] or Decimal('0.0000')
        today_orders_count = today_sales_qs.count()

        # 2. Total Inventory Valuation
        balances = StockBalance.objects.filter(branch=branch, quantity_on_hand_base__gt=Decimal('0.00')).select_related('batch')
        total_inv_val = sum((b.quantity_on_hand_base * b.batch.unit_cost_base for b in balances), Decimal('0.0000'))

        # 3. Expiry Risk Counts
        active_batches = Batch.objects.filter(branch=branch, status='ACTIVE')
        critical_expiry_count = sum(1 for b in active_batches if (b.expiry_date - today).days <= 30)
        warning_expiry_count = sum(1 for b in active_batches if 30 < (b.expiry_date - today).days <= 90)

        # 4. Low Stock Products Count
        low_stock_count = 0
        products = Product.objects.filter(branch=branch, is_active=True)
        for p in products:
            p_on_hand = sum((b.quantity_on_hand_base for b in p.stock_balances.all()), Decimal('0.00'))
            if p_on_hand <= p.reorder_level_base:
                low_stock_count += 1

        # 5. 7-Day Revenue Sparkline
        seven_days_revenue = []
        for i in range(6, -1, -1):
            target_date = today - timedelta(days=i)
            day_rev = Sale.objects.filter(branch=branch, created_at__date=target_date, status='COMPLETED').aggregate(total=Sum('total_amount'))['total'] or Decimal('0.0000')
            seven_days_revenue.append({
                'date': target_date.strftime('%a'),
                'amount': float(day_rev)
            })

        return {
            'today_revenue': float(today_rev),
            'today_gross_profit': float(today_profit),
            'today_orders_count': today_orders_count,
            'total_inventory_valuation': float(total_inv_val),
            'critical_expiry_batches': critical_expiry_count,
            'warning_expiry_batches': warning_expiry_count,
            'low_stock_products_count': low_stock_count,
            'active_suppliers_count': Supplier.objects.filter(is_active=True).count(),
            'revenue_trend': seven_days_revenue
        }

    @classmethod
    def get_fast_slow_movers(cls, branch, days=30):
        start_date = date.today() - timedelta(days=days)
        lines = SaleLine.objects.filter(sale__branch=branch, sale__created_at__gte=start_date, sale__status='COMPLETED')

        product_sales = {}
        for line in lines:
            pid = str(line.product.id)
            if pid not in product_sales:
                product_sales[pid] = {
                    'product_id': pid,
                    'brand_name': line.product.brand_name,
                    'generic_name': line.product.generic_name,
                    'total_dispensed_base': Decimal('0.00'),
                    'total_revenue': Decimal('0.00'),
                    'total_profit': Decimal('0.00')
                }
            product_sales[pid]['total_dispensed_base'] += line.total_quantity_base
            product_sales[pid]['total_revenue'] += line.total_line_amount
            product_sales[pid]['total_profit'] += line.total_line_profit

        # Sort by total revenue descending
        sorted_movers = sorted(product_sales.values(), key=lambda x: x['total_revenue'], reverse=True)

        return [
            {
                'product_id': m['product_id'],
                'brand_name': m['brand_name'],
                'generic_name': m['generic_name'],
                'total_dispensed_base': float(m['total_dispensed_base']),
                'total_revenue': float(m['total_revenue']),
                'total_profit': float(m['total_profit'])
            }
            for m in sorted_movers
        ]

    @classmethod
    def get_expiry_risk_matrix(cls, branch):
        today = date.today()
        batches = Batch.objects.filter(branch=branch, status='ACTIVE').select_related('product', 'storage_location').order_by('expiry_date')

        result = []
        for b in batches:
            risk = FEFOEngine.get_expiry_status(b.expiry_date)
            # Find on-hand
            balance = b.stock_balances.first()
            on_hand = balance.quantity_on_hand_base if balance else Decimal('0.00')
            est_loss = on_hand * b.unit_cost_base

            result.append({
                'batch_id': str(b.id),
                'product_name': b.product.brand_name,
                'batch_number': b.batch_number,
                'expiry_date': b.expiry_date.isoformat(),
                'days_remaining': risk['days'],
                'risk_level': risk['level'],
                'risk_badge': risk['badge'],
                'risk_color': risk['color'],
                'quantity_on_hand': float(on_hand),
                'unit_cost': float(b.unit_cost_base),
                'potential_financial_loss': float(est_loss),
                'storage_location': b.storage_location.name if b.storage_location else 'Main Shelf'
            })

        return result

    @classmethod
    def get_pnl_summary(cls, branch, start_date=None, end_date=None):
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()

        sales_qs = Sale.objects.filter(branch=branch, created_at__date__gte=start_date, created_at__date__lte=end_date, status='COMPLETED')
        total_rev = sales_qs.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.0000')
        total_cogs = sales_qs.aggregate(total=Sum('total_cost_amount'))['total'] or Decimal('0.0000')
        gross_profit = total_rev - total_cogs

        expenses_qs = Expense.objects.filter(branch=branch, created_at__date__gte=start_date, created_at__date__lte=end_date)
        total_exp = expenses_qs.aggregate(total=Sum('amount'))['total'] or Decimal('0.0000')

        net_profit = gross_profit - total_exp
        net_margin = (net_profit / total_rev * 100) if total_rev > 0 else Decimal('0.00')

        return {
            'period': f"{start_date.isoformat()} to {end_date.isoformat()}",
            'gross_revenue': float(total_rev),
            'cost_of_goods_sold': float(total_cogs),
            'gross_profit': float(gross_profit),
            'operating_expenses': float(total_exp),
            'net_profit': float(net_profit),
            'net_profit_margin_percent': float(round(net_margin, 2))
        }
