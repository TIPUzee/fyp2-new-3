from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Literal, Optional
import requests

from utils import SQLEntity, Validator as Vld, AccessControlledEntity, App, Env


class _Login(AccessControlledEntity):
    def __init__(self):
        super().__init__()

    @staticmethod
    def get_representation_str() -> str:
        return 'Payfast Access URL Token'

    @staticmethod
    def gen_token(user: Payfast) -> str:
        from utils import Secret
        _ = Secret.encode_token({'m_id': user.m_id, 'role': 'payfast.url.login'})
        return f'Bearer {_}'

    @staticmethod
    def fetch_token() -> str | False:
        from flask import request
        return request.args.get('t', False)

    @staticmethod
    def parse_token(raw_token: str) -> str | False:
        from utils import Secret
        payload = Secret.decode_token(raw_token.split(' ')[1])
        if payload and payload['role'] == 'payfast.url.login':
            return payload
        return False

    @staticmethod
    def get_user(payload: dict) -> Payfast:
        p = Payfast()
        p.turn_off_validation()
        p.m_id = payload['m_id']
        if not p.load():
            return App.Res.unauthenticated(
                user_does_not_exist=True,
                module_not_allowed=False,
                account_suspended=False,
            )
        return p


class _SandboxPaymentDetails:
    token_api = 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken'
    redirection_api = 'https://ipguat.apps.net.pk/Ecommerce/api/Transaction/PostTransaction'


class _LivePaymentDetails:
    token_api = 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/GetAccessToken'
    redirection_api = 'https://ipg1.apps.net.pk/Ecommerce/api/Transaction/PostTransaction'


class Payfast(SQLEntity, Vld.PropertyTypeValidatorEntity):
    Login = _Login
    SandboxPaymentDetails = _SandboxPaymentDetails
    LivePaymentDetails = _LivePaymentDetails

    def __init__(self):
        self.current_mode: Literal['live', 'sandbox'] = 'live' if Env.get('PAYFAST_LIVE_MODE') == '1' else 'sandbox'
        self.CurrentDetails = self.LivePaymentDetails if self.current_mode == 'live' else self.SandboxPaymentDetails
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_role: Optional[float] = Vld.validatable(Vld.Float())
        self.m_amount: Optional[float] = Vld.validatable(Vld.Float())
        super().__init__()

    @property
    def db_table_name(self) -> str:
        return 'payfast_transaction_basket'

    def get_form_token(self) -> tuple[str | False, datetime | False]:
        url_post_params = {
            'MERCHANT_ID': int(Env.get('PAYFAST_MERCHANT_ID')),
            'SECURED_KEY': Env.get('PAYFAST_SECURED_KEY'),
            'TXNAMT':      self.m_amount,
            'BASKET_ID':   str(self.m_id),
        }

        response = requests.post(self.CurrentDetails.token_api, data=url_post_params)
        payload = response.json()
        print('patient_refund_transaction details', self.CurrentDetails.token_api)
        print('url_post_params', url_post_params)
        print('response', payload)
        token = payload.get('ACCESS_TOKEN', False)
        if not token:
            raise ConnectionResetError(f'Payfast API did not return a token. As {payload}')
        return token, self.parse_datetime_obj(payload.get('GENERATED_DATE_TIME', False))

    @staticmethod
    def parse_datetime_obj(dt: str) -> datetime:
        date_components = dt.split('T')[0].split('-')
        time_components = dt.split('T')[1].split('.')[0].split(':')
        timezone_offset = dt.split('+')[1]

        year = int(date_components[0])
        month = int(date_components[1])
        day = int(date_components[2])
        hour = int(time_components[0])
        minute = int(time_components[1])
        second = int(time_components[2])

        timezone_offset_hours = int(timezone_offset[:2])
        timezone_offset_minutes = int(timezone_offset[3:])

        timezone_offset_delta = timedelta(hours=timezone_offset_hours, minutes=timezone_offset_minutes)
        timezone_object = timezone(timezone_offset_delta)

        return datetime(year, month, day, hour, minute, second, tzinfo=timezone_object)
