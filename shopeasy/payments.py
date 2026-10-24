class PaymentError(ValueError):
    pass


def saved_card_display(card):
    if card.get("expired"):
        raise PaymentError("Saved card is expired")
    return {"brand": card["brand"], "last4": card["last4"]}
