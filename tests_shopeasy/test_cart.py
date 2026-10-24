import unittest

from shopeasy.cart import Cart, CartError
from tests_shopeasy.helpers import story


class CartUatTests(unittest.TestCase):
    @story("US-CART-01")
    def test_add_in_stock_item_increases_line_quantity(self):
        cart = Cart()
        cart.add("TEE", 2)
        self.assertEqual(cart.lines["TEE"], 2)

    @story("US-CART-01")
    def test_rejects_quantity_above_line_limit(self):
        with self.assertRaisesRegex(CartError, "between 1 and 10"):
            Cart().add("TEE", 11)

    @story("US-CART-01")
    def test_rejects_out_of_stock_product_with_clear_message(self):
        with self.assertRaisesRegex(CartError, "out of stock"):
            Cart().add("SOLDOUT", 1)
