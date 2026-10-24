import unittest
from decimal import Decimal

from shopeasy.checkout import CheckoutError
from shopeasy.pricing import shipping, tax
from tests_shopeasy.helpers import case, story


class ShippingUatTests(unittest.TestCase):
    @story("US-CHK-03")
    @case("TC-US-CHK-03-01")
    def test_orders_at_or_above_fifty_ship_free(self):
        self.assertEqual(shipping(Decimal("50.00")), Decimal("0.00"))

    @story("US-CHK-03")
    @case("TC-US-CHK-03-02")
    def test_orders_below_fifty_pay_flat_shipping(self):
        self.assertEqual(shipping(Decimal("49.99")), Decimal("5.99"))

    @story("US-CHK-03")
    @case("TC-US-CHK-03-03")
    def test_shipping_uses_discounted_subtotal_for_threshold(self):
        self.assertEqual(
            shipping(Decimal("45.00"), original_subtotal=Decimal("60.00")),
            Decimal("5.99"),
            "expected shipping 5.99 for subtotal 60.00 discounted to 45.00, got 0.00",
        )


class TaxUatTests(unittest.TestCase):
    @story("US-CHK-04")
    @case("TC-US-CHK-04-01")
    def test_tax_applies_to_discounted_subtotal_only(self):
        self.assertEqual(tax(Decimal("100.00"), "TX"), Decimal("8.25"))

    @story("US-CHK-04")
    @case("TC-US-CHK-04-02")
    def test_tax_rounds_half_up_to_two_places(self):
        self.assertEqual(
            tax(Decimal("2.00"), "TX"),
            Decimal("0.17"),
            "expected tax 0.17 for subtotal 2.00 in TX (0.165 rounded half-up), got 0.16",
        )

    @story("US-CHK-04")
    @case("TC-US-CHK-04-03")
    def test_unsupported_state_blocks_checkout(self):
        with self.assertRaisesRegex(CheckoutError, "Unsupported state"):
            tax(Decimal("10.00"), "NY")
