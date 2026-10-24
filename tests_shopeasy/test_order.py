import re
import unittest

from shopeasy.cart import Cart
from shopeasy.checkout import CheckoutError, place_order
from tests_shopeasy.helpers import story


class OrderUatTests(unittest.TestCase):
    @story("US-CHK-05")
    def test_successful_order_returns_confirmation_and_reduces_stock(self):
        cart = Cart()
        cart.add("MUG", 1)
        confirmation = place_order(cart, {"status": "approved"})
        self.assertRegex(confirmation, r"^SE-[A-Z0-9]{6}$")
        self.assertEqual(cart.stock_for("MUG"), 7)

    @story("US-CHK-05")
    def test_empty_cart_cannot_be_checked_out(self):
        with self.assertRaisesRegex(CheckoutError, "empty"):
            place_order(Cart(), {"status": "approved"})

    @story("US-CHK-05")
    def test_declined_card_leaves_stock_unchanged(self):
        self.skipTest("BLOCKED: payment sandbox unavailable")
