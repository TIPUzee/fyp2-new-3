from __future__ import annotations

from datetime import datetime, date, timedelta
from typing import Optional, Literal, Union

from flask import request

from utils import AccessControlledEntity, App, EmailBaseClass, Secret, SQLEntity, Validator as Vld, Func

from ..appointment import Appointment
from ..availability_duration import AvailabilityDuration


class Doctor(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_specialization_category_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_email: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.Email(), Vld.MaxLen(64)))
        self.m_password: Optional[str] = Vld.validatable(
            Vld.And(Vld.Str(), Vld.MinLen(8), Vld.MaxLen(16), Vld.Password())
        )
        self.m_name: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(3), Vld.MaxLen(32), Vld.Name()))
        self._dob: Optional[date] = Vld.validatable(
            Vld.Or(Vld.DateTimeObject(), Vld.And(Vld.Str(), Vld.Date()))
        )
        self.m_registration_time: Optional[datetime] = Vld.validatable(Vld.DateTimeObject())
        self.m_whatsapp_number: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.Phone(), Vld.MaxLen(16)))
        self.m_profile_pic_filename: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MaxLen(128)))
        self.m_cover_pic_filename: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MaxLen(128)))
        self.m_wallet_amount: Optional[float] = Vld.validatable(Vld.And(Vld.Float()))
        self.m_max_meeting_duration: Optional[int] = Vld.validatable(
            Vld.And(Vld.Int(), Vld.MinVal(15), Vld.MaxVal(120))
        )
        self.m_appointment_charges: Optional[int] = Vld.validatable(
            Vld.And(
                Vld.Int(), Vld.MinVal(500), Vld.MaxVal(5000)
            )
        )
        self.m_status: Optional[Union[
            Literal['NEW_ACCOUNT'], Literal['ACCOUNT_SUSPENDED'], Literal['APPROVAL_REQUESTED'],
            Literal['APPROVAL_REJECTED'], Literal['ACCOUNT_APPROVED']
        ]] = Vld.validatable(
            Vld.And(
                Vld.Str(),
                Vld.In(
                    'NEW_ACCOUNT',
                    'ACCOUNT_SUSPENDED',
                    'APPROVAL_REQUESTED',
                    'APPROVAL_REJECTED',
                    'ACCOUNT_APPROVED'
                )
            )
        )
        self.m_status_change_time: Optional[datetime] = Vld.validatable(Vld.DateTimeObject())
        self.m_specialization: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(5), Vld.MaxLen(44)))
        self.m_active_for_appointments: Optional[bool] = Vld.validatable(Vld.Bool())

        setattr(self, Func.get_attr_custom_storage_name('m_dob'), self._dob)
        super().__init__()
        self.turn_on_validation()

    class AccountStatusEnum:
        NEW_ACCOUNT = 'NEW_ACCOUNT'
        ACCOUNT_SUSPENDED = 'ACCOUNT_SUSPENDED'
        APPROVAL_REQUESTED = 'APPROVAL_REQUESTED'
        APPROVAL_REJECTED = 'APPROVAL_REJECTED'
        ACCOUNT_APPROVED = 'ACCOUNT_APPROVED'

    @property
    def db_table_name(self) -> str:
        return 'doctors'

    @property
    def m_dob(self) -> date:
        return getattr(self, Func.get_attr_custom_storage_name('m_dob'))

    @m_dob.setter
    def m_dob(self, value: str | date):
        if isinstance(value, date):
            setattr(self, Func.get_attr_custom_storage_name('m_dob'), value)
        else:
            setattr(self, Func.get_attr_custom_storage_name('m_dob'), datetime.strptime(value, '%Y-%m-%d'))

    def _get_appointment_slots_of_week(self, time: datetime, _filter: bool):
        if not self.m_max_meeting_duration:
            raise ValueError('Doctor\'s max meeting duration is not set/loaded')

        # week starting time
        week_threshold = time - timedelta(days=time.weekday() - 1)
        week_threshold = week_threshold.replace(hour=0, minute=0, second=0, microsecond=0)

        ad = AvailabilityDuration()
        ad.m_doctor_id = self.m_id
        ad = ad.select()

        #               Create available slots
        available_slots = []
        for i, _ad in enumerate(ad):
            if not _ad['m_enabled']:
                continue
            time_from = _ad['m_from']
            time_to = _ad['m_to']
            while time_from + self.m_max_meeting_duration <= time_to:
                available_slots.append(
                    {
                        'time_from': week_threshold + timedelta(days=i - 1, minutes=time_from),
                        'time_to':   week_threshold + timedelta(
                            days=i - 1,
                            minutes=time_from + self.m_max_meeting_duration
                            ),
                    }
                )
                time_from += self.m_max_meeting_duration

        #               Remove the slots that are already allocated
        a = Appointment()
        a.turn_off_validation()
        a.m_doctor_id = self.m_id
        a.m_time_from = week_threshold
        if _filter:
            appointments = a.select(
                select_cols=['m_time_from', 'm_time_to'],
                where_greater_than=['m_time_from']
            )

            slot_index_to_remove = []
            slots_to_remove = []
            for _a in appointments:
                _a['m_time_from'] = Func.convert_offset_naive_to_aware_datetime(_a['m_time_from'])
                _a['m_time_to'] = Func.convert_offset_naive_to_aware_datetime(_a['m_time_to'])

                for _i, _slot in enumerate(available_slots):
                    if (not Appointment.do_slots_clash(_slot['time_from'], _slot['time_to'], _a['m_time_from'],
                                                       _a['m_time_to'])) and (_slot not in slots_to_remove):
                        slot_index_to_remove.append(_i)
                        slots_to_remove.append(_slot)

            slot_index_to_remove.reverse()
            for _i in slot_index_to_remove:
                available_slots.pop(_i)
        return available_slots

    def get_appointment_slots(self, _filter: bool = True):
        threshold_time = Func.get_current_time()
        threshold_time = threshold_time.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

        appointment_slots_week_vice = []

        for i in range(3):
            time = threshold_time + timedelta(weeks=i)
            _slots = self._get_appointment_slots_of_week(time, _filter)
            day_vice_slots = []
            for j in range(7):
                day_vice_slots.append([])
                for slot in _slots:
                    if slot['time_from'].weekday() == j:
                        day_vice_slots[j].append(slot)
            appointment_slots_week_vice.append(day_vice_slots)

        return appointment_slots_week_vice

    def is_valid_slot(self, time_from: datetime, time_to: datetime) -> bool:
        for weekSlots in self.get_appointment_slots(_filter=False):
            for daySlots in weekSlots:
                for slot in daySlots:
                    if slot['time_from'] == time_from and slot['time_to'] == time_to:
                        return True
        return False

    def any_slot_clash(self, time_from: datetime, time_to: datetime) -> bool:
        for weekSlots in self.get_appointment_slots(_filter=True):
            for daySlots in weekSlots:
                for slot in daySlots:
                    if slot['time_from'] == time_from and slot['time_to'] == time_to:
                        return False
        return True

    class Login(AccessControlledEntity):
        def __init__(self):
            super().__init__()

        @staticmethod
        def get_representation_str() -> str:
            return 'Doctor Login Token'

        @staticmethod
        def gen_token(user: Doctor) -> str:
            from utils import Secret
            _ = Secret.encode_token({'m_id': user.m_id, 'role': 'doctor.login'})
            return f'Bearer {_}'

        @staticmethod
        def fetch_token() -> str | False:
            from flask import request
            return request.headers.get('Authorization', False)

        @staticmethod
        def parse_token(raw_token: str) -> str | False:
            from utils import Secret
            payload = Secret.decode_token(raw_token.split(' ')[1])
            if payload and payload['role'] == 'doctor.login':
                return payload
            return False

        @staticmethod
        def get_user(payload: dict) -> Doctor:
            d = Doctor()
            d.turn_off_validation()
            d.m_id = payload['m_id']
            if not d.load():
                return App.Res.unauthenticated(
                    user_does_not_exist=True,
                    module_not_allowed=False,
                    account_suspended=False,
                )
            if d.m_status == Doctor.AccountStatusEnum.ACCOUNT_SUSPENDED:
                return App.Res.unauthenticated(
                    user_does_not_exist=False,
                    module_not_allowed=False,
                    account_suspended=True,
                )
            return d

    class Register(AccessControlledEntity):
        def __init__(self):
            super().__init__()

        @staticmethod
        def gen_code() -> int:
            return Secret.gen_random_code(6)

        @staticmethod
        def send_mail(user: Doctor, code):
            EmailBaseClass.send(
                f"""
                      <div class="container">
                        <p>Hi {user.m_name},</p>
                        <p>Thanks for registering for AI-Disease Predictor platform! We're excited to have you join our 
                        community.</p>
                        <p>To complete your registration and unlock all the features of AI-Disease Prediction platform, 
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
            return 'Doctor Registration Token'

        @staticmethod
        def gen_token(user: Doctor, code: int) -> str:
            _ = Secret.encode_token(
                {
                    'm_name':            user.m_name,
                    'm_dob':             user.m_dob,
                    'm_whatsapp_number': user.m_whatsapp_number,
                    'm_email':           user.m_email,
                    'm_password':        user.m_password,
                    'code':              code,
                    'role':              'doctor.register'
                }
            )
            return f'Bearer {_}'

        @staticmethod
        def fetch_token() -> str | False:
            return request.headers.get('Authorization', False)

        @staticmethod
        def parse_token(raw_token: str) -> str | False:
            payload = Secret.decode_token(raw_token.split(' ')[1])
            if payload and payload['role'] == 'doctor.register':
                return payload
            return False

        @staticmethod
        def get_user(payload: dict) -> Doctor:
            d = Doctor()
            d.m_name = payload['m_name']
            d.m_dob = payload['m_dob']
            d.m_email = payload['m_email']
            d.m_password = payload['m_password']
            d.m_whatsapp_number = payload['m_whatsapp_number']
            d.code = payload['code']
            return d

    class TempUrlLogin(AccessControlledEntity):
        def __init__(self):
            super().__init__()

        @staticmethod
        def get_representation_str() -> str:
            return 'Doctor Login Temporary URL Token'

        @staticmethod
        def gen_token(user: Doctor) -> str:
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
        def get_user(payload: dict) -> Doctor:
            d = Doctor()
            d.turn_off_validation()
            d.m_id = payload['m_id']
            if not d.load():
                return App.Res.unauthenticated(
                    user_does_not_exist=True,
                    module_not_allowed=False,
                    account_suspended=False,
                )
            if d.m_status == Doctor.AccountStatusEnum.ACCOUNT_SUSPENDED:
                return App.Res.unauthenticated(
                    user_does_not_exist=False,
                    module_not_allowed=False,
                    account_suspended=True,
                )
            return d
