from decimal import Decimal


class CartError(ValueError):
    pass


CATALOG = {
    "TEE": {"price": Decimal("20.00"), "stock": 5},
    "MUG": {"price": Decimal("12.00"), "stock": 8},
    "SOLDOUT": {"price": Decimal("9.00"), "stock": 0},
}


class Cart:
    def __init__(self):
        self.lines = {}
        self._inventory = {sku: item["stock"] for sku, item in CATALOG.items()}

    def add(self, sku, qty):
        if not 1 <= qty <= 10:
            raise CartError("Quantity must be between 1 and 10")
        if sku not in CATALOG or self._inventory[sku] < qty:
            raise CartError("Product is out of stock")
        new_quantity = self.lines.get(sku, 0) + qty
        if new_quantity > 10 or new_quantity > self._inventory[sku]:
            raise CartError("Product is out of stock" if new_quantity > self._inventory[sku] else "Quantity must be between 1 and 10")
        self.lines[sku] = new_quantity

    @property
    def subtotal(self):
        return sum((CATALOG[sku]["price"] * qty for sku, qty in self.lines.items()), Decimal("0.00"))

    def stock_for(self, sku):
        return self._inventory[sku]

    def commit_inventory(self):
        for sku, qty in self.lines.items():
            self._inventory[sku] -= qty
