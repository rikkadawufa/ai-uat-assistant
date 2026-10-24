import unittest
from decimal import Decimal

from shopeasy.cart import Cart
from shopeasy.pricing import PricingError, apply_discount
from tests_shopeasy.helpers import case, story


class DiscountUatTests(unittest.TestCase):
    def setUp(self):
        self.cart = Cart()
        self.cart.add("TEE", 3)

    @story("US-CART-02")
    @case("TC-US-CART-02-01")
    def test_valid_percentage_code_reduces_subtotal(self):
        self.assertEqual(apply_discount(self.cart, "SAVE10"), Decimal("54.00"))

    @story("US-CART-02")
    @case("TC-US-CART-02-02")
    def test_expired_code_has_required_message(self):
        with self.assertRaisesRegex(PricingError, "This code has expired"):
            apply_discount(self.cart, "OLD5")

    @story("US-CART-02")
    @case("TC-US-CART-02-03")
    def test_second_code_is_rejected(self):
        apply_discount(self.cart, "SAVE10")
        with self.assertRaisesRegex(PricingError, "Only one code"):
            apply_discount(self.cart, "OLD5")

    @story("US-CART-02")
    @case("TC-US-CART-02-04")
    def test_discount_codes_are_case_insensitive(self):
        self.assertEqual(apply_discount(self.cart, "sAvE10"), Decimal("54.00"))
