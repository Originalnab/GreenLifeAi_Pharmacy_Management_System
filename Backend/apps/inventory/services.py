from datetime import date
from decimal import Decimal
from typing import List, Dict, Any
from .models import Batch, StockBalance

class FEFOEngine:
    """First-Expiry-First-Out (FEFO) Allocation and Expiry Surveillance Engine."""

    @staticmethod
    def get_expiry_status(expiry_date: date) -> Dict[str, Any]:
        today = date.today()
        days_remaining = (expiry_date - today).days

        if days_remaining <= 0:
            return {'level': 'EXPIRED', 'badge': 'Expired', 'color': 'red', 'days': days_remaining}
        elif days_remaining <= 30:
            return {'level': 'CRITICAL', 'badge': f'Critical ({days_remaining}d)', 'color': 'rose', 'days': days_remaining}
        elif days_remaining <= 90:
            return {'level': 'WARNING', 'badge': f'Near Expiry ({days_remaining}d)', 'color': 'amber', 'days': days_remaining}
        else:
            return {'level': 'STABLE', 'badge': 'Safe', 'color': 'emerald', 'days': days_remaining}

    @classmethod
    def allocate_fefo(cls, product_id, required_qty_base: Decimal, branch=None) -> List[Dict[str, Any]]:
        """
        Allocates stock strictly obeying First-Expiry-First-Out (FEFO).
        Returns a list of batch allocations with batch_id, batch_number, expiry_date, unit_cost, and allocated_qty.
        Raises ValueError if on-hand quantity is insufficient.
        """
        # Query active balances for the product with positive available quantity, ordered by batch expiry date
        balances_qs = StockBalance.objects.filter(
            product_id=product_id,
            quantity_on_hand_base__gt=Decimal('0.00'),
            batch__status='ACTIVE'
        ).select_related('batch')

        if branch:
            balances_qs = balances_qs.filter(branch=branch)

        balances = list(balances_qs.order_by('batch__expiry_date'))

        total_available = sum((b.available_quantity_base for b in balances), Decimal('0.00'))
        if total_available < required_qty_base:
            raise ValueError(f"Insufficient stock. Requested: {required_qty_base}, Available across active batches: {total_available}")

        allocations = []
        remaining_needed = required_qty_base

        for sb in balances:
            if remaining_needed <= Decimal('0.00'):
                break

            avail = sb.available_quantity_base
            alloc_qty = min(avail, remaining_needed)

            allocations.append({
                'batch_id': str(sb.batch.id),
                'batch_number': sb.batch.batch_number,
                'expiry_date': sb.batch.expiry_date.isoformat(),
                'unit_cost_base': float(sb.batch.unit_cost_base),
                'allocated_quantity_base': float(alloc_qty),
                'storage_location': sb.batch.storage_location.name if sb.batch.storage_location else 'Main Shelf'
            })
            remaining_needed -= alloc_qty

        return allocations
