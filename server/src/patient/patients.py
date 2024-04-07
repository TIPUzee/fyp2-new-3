from __future__ import annotations

from typing import Optional

from flask import request

from utils import AccessControlledEntity, App, EmailBaseClass, Secret, SQLEntity, Validator as vld


class Patient(SQLEntity, vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = vld.validatable(vld.And(vld.Int(), vld.MinVal(0)))
        self.m_email: Optional[str] = vld.validatable(vld.And(vld.Str(), vld.Email(), vld.MaxLen(64)))
        self.m_password: Optional[str] = vld.validatable(vld.And(vld.Str(), vld.Password()))
        self.m_name: Optional[str] = vld.validatable(vld.And(vld.Str(), vld.MinLen(3), vld.Name(), vld.MaxLen(32)))
        self.m_dob: Optional[str] = vld.validatable(vld.And(vld.Str(), vld.Date()))
        self.m_whatsapp_number: Optional[str] = vld.validatable(vld.And(vld.Str(), vld.Phone(), vld.MaxLen(16)))
        self.m_registration_time: Optional[str] = vld.validatable(vld.And(vld.Str(), vld.DateTime()))
        self.m_refundable_amount: Optional[float] = vld.validatable(vld.And(vld.Float()))
        self.m_status: Optional[str] = vld.validatable(
            vld.And(
                vld.Str(),
                vld.In(
                    'ACCOUNT_SUSPENDED',
                    'ACCOUNT_NOT_SUSPENDED',
                )
            )
        )
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'patients'

    class AccountStatusEnum:
        ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED'
        ACCOUNT_NOT_SUSPENDED = 'ACCOUNT_NOT_SUSPENDED'

    class Login(AccessControlledEntity):
        def __init__(self):
            super().__init__()

        @staticmethod
        def send_mail(user: Patient):
            EmailBaseClass.send(
                f'<p>Hii <a href="mail:{user.m_email}">{user.m_email}</a></p>',
                [user.m_email], 'Welcome to AI-Disease Predictor'
            )

        @staticmethod
        def get_representation_str() -> str:
            return 'Patient Login Token'

        @staticmethod
        def gen_token(user: Patient) -> str:
            _ = Secret.encode_token({'m_id': user.m_id, 'role': 'patient.login'})
            return f'Bearer {_}'

        @staticmethod
        def fetch_token() -> str | False:
            return request.headers.get('Authorization', False)

        @staticmethod
        def parse_token(raw_token: str) -> str | False:
            try:
                payload = Secret.decode_token(raw_token.split(' ')[1])
                if payload and payload['role'] == 'patient.login':
                    return payload
            except IndexError:
                pass
            return False

        @staticmethod
        def get_user(payload: dict) -> Patient:
            p = Patient()
            p.turn_off_validation()
            p.m_id = payload['m_id']
            if not p.load():
                return App.Res.unauthenticated(
                    user_does_not_exist=True,
                    module_not_allowed=False,
                    account_suspended=False,
                )
            if p.m_status == Patient.AccountStatusEnum.ACCOUNT_SUSPENDED:
                return App.Res.unauthenticated(
                    user_does_not_exist=False,
                    module_not_allowed=False,
                    account_suspended=True,
                )
            return p

    class Register(AccessControlledEntity):
        def __init__(self):
            super().__init__()

        @staticmethod
        def gen_code() -> int:
            return Secret.gen_random_code(6)

        @staticmethod
        def send_mail(user: Patient, code: int):
            EmailBaseClass.send(
                f"""
                      <div class="container">
                        <p>Hi {user.m_name},</p>
                        <p>Thanks for registering for AI-Disease Predictor platform! We're excited to have you join our 
                        community.</p>
                        <p>To complete your registration and unlock all the features of AI-Disease Predictor platform, 
                        please verify your email address.</p>
                        <p><strong>Here's your verification code:</strong></p>
                        <p style="font-weight: bold; font-size: 1.2em;">{code}</p>
                        <p><strong>Please enter this code on our website:</strong></p>
                        <p><a href="">Click here to verify your email address</a></p>
                        <p>This code is valid for 24 hours. If you don't verify your email address within this 
                        timeframe, you'll need to request a new code.</p>
                        <p><strong>Having trouble?</strong></p>
                        <ul>
                          <li>Make sure you entered the code correctly.</li>
                          <li>If you still can't verify your email address, reply to this email, and we'll be happy 
                          to help.</li>
                        </ul>
                        <p>We look forward to seeing you in AI-Disease Predictor platform!</p>
                        <p><strong>Sincerely,</strong></p>
                        <p>The AI-Disease Predictor Community</p>
                      </div>
                """,
                [user.m_email],
                f'{user.m_name}, complete your registration to join the AI-Disease Predictor community!'
            )

        @staticmethod
        def get_representation_str() -> str:
            return 'Patient Registration Token'

        @staticmethod
        def gen_token(user: Patient, code: int) -> str:
            _ = Secret.encode_token(
                {
                    'm_name':            user.m_name,
                    'm_dob':             user.m_dob,
                    'm_whatsapp_number': user.m_whatsapp_number,
                    'm_email':           user.m_email,
                    'm_password':        user.m_password,
                    'code':              code,
                    'role':              'patient.register'
                }
            )
            return f'Bearer {_}'

        @staticmethod
        def fetch_token() -> str | False:
            return request.headers.get('Authorization', False)

        @staticmethod
        def parse_token(raw_token: str) -> str | False:
            payload = Secret.decode_token(raw_token.split(' ')[1])
            if payload and payload['role'] == 'patient.register':
                return payload
            return False

        @staticmethod
        def get_user(payload: dict) -> 'Patient':
            p = Patient()
            p.m_name = payload['m_name']
            p.m_dob = payload['m_dob']
            p.m_email = payload['m_email']
            p.m_password = payload['m_password']
            p.m_whatsapp_number = payload['m_whatsapp_number']
            p.code = payload['code']
            return p

    class TempUrlLogin(AccessControlledEntity):
        def __init__(self):
            super().__init__()

        @staticmethod
        def get_representation_str() -> str:
            return 'Doctor Login Temporary URL Token'

        @staticmethod
        def gen_token(user: Patient) -> str:
            from utils import Secret
            _ = Secret.encode_token({'m_id': user.m_id, 'role': 'doctor.temp.url.login'})
            return f'Bearer {_}'

        @staticmethod
        def fetch_token() -> str | False:
            from flask import request
            return request.args.get('t', False)

        @staticmethod
        def parse_token(raw_token: str) -> str | False:
            from utils import Secret
            payload = Secret.decode_token(raw_token.split(' ')[1])
            if payload and payload['role'] == 'doctor.temp.url.login':
                return payload
            return False

        @staticmethod
        def get_user(payload: dict) -> Patient:
            p = Patient()
            p.turn_off_validation()
            p.m_id = payload['m_id']
            if not p.load():
                return App.Res.unauthenticated(
                    user_does_not_exist=True,
                    module_not_allowed=True,
                    account_suspended=False,
                )
            if p.m_status == Patient.AccountStatusEnum.ACCOUNT_SUSPENDED:
                return App.Res.unauthenticated(
                    user_does_not_exist=False,
                    module_not_allowed=False,
                    account_suspended=True,
                )
            return p
