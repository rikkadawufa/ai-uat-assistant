from datetime import date
from decimal import Decimal

from .checkout import CheckoutError


class PricingError(ValueError):
    pass


DISCOUNTS = {
    "SAVE10": {"pct": 10, "expires": date(2099, 12, 31)},
    "OLD5": {"pct": 5, "expires": date(2020, 1, 1)},
}
TAX_RATES = {"TX": Decimal("0.0825"), "CA": Decimal("0.0725")}


def apply_discount(cart, code):
    if getattr(cart, "discount_code", None):
        raise PricingError("Only one code can be applied per order")
    discount = DISCOUNTS.get(code)
    if discount is None:
        raise PricingError("Invalid discount code")
    if discount["expires"] < date.today():
        raise PricingError("This code has expired")
    cart.discount_code = code
    return (cart.subtotal * (Decimal("100") - Decimal(discount["pct"])) / Decimal("100")).quantize(Decimal("0.01"))


def shipping(subtotal_after_discount, original_subtotal=None):
    threshold_subtotal = original_subtotal if original_subtotal is not None else subtotal_after_discount
    return Decimal("0.00") if threshold_subtotal >= Decimal("50.00") else Decimal("5.99")


def tax(amount, state):
    if state not in TAX_RATES:
        raise CheckoutError("Unsupported state")
    return round(amount * TAX_RATES[state], 2)
