import secrets

from .cart import CartError


class CheckoutError(ValueError):
    pass


def place_order(cart, payment):
    if not cart.lines:
        raise CheckoutError("Cart is empty")
    if payment.get("status") != "approved":
        return {"status": "declined", "reason": payment.get("reason", "Payment declined")}
    cart.commit_inventory()
    return "SE-" + secrets.token_hex(3).upper()
