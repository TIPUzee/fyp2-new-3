import stripe

from utils import Env

stripe.api_key = Env.get('STRIPE_SECRET_KEY')


class Stripe:
    def __init__(self):
        pass
