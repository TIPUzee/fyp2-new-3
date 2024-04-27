from __future__ import annotations

from typing import Optional, Literal
from datetime import datetime

from utils import Func, SQLEntity, Validator as Vld, AccessControlledEntity


class _BookPayfastLogin(AccessControlledEntity):
    def __init__(self):
        super().__init__()

    @staticmethod
    def get_representation_str() -> str:
        return 'Appointment Booking Payfast Login Token'

    @staticmethod
    def gen_token(a: Appointment.Request) -> str:
        from utils import Secret
        _ = Secret.encode_token(
            {
                'm_id': a.m_id,
                'role': 'appointment.book.payfast.login'
            }
        )
        return f'Bearer {_}'

    @staticmethod
    def fetch_token() -> str | False:
        from flask import request
        return request.args.get('t', False)

    @staticmethod
    def parse_token(raw_token: str) -> str | False:
        from utils import Secret
        payload = Secret.decode_token(raw_token.split(' ')[1])
        if payload and payload['role'] == 'appointment.book.payfast.login':
            return payload
        return False

    @staticmethod
    def get_user(payload: dict) -> Appointment.Request | False:
        a = Appointment.Request()
        a.turn_off_validation()
        a.m_id = payload['m_id']
        if not a.load():
            return False
        return a


class _BookClientLogin(AccessControlledEntity):
    def __init__(self):
        super().__init__()

    @staticmethod
    def get_representation_str() -> str:
        return 'Appointment Booking Client Login Token'

    @staticmethod
    def gen_token(a: Appointment.Request) -> str:
        from utils import Secret
        _ = Secret.encode_token(
            {
                'm_id': a.m_id,
                'role': 'appointment.book.client.login'
            }
        )
        return f'Bearer {_}'

    @staticmethod
    def fetch_token() -> str | False:
        from flask import request
        return request.headers.get('TempAuthorization', False)

    @staticmethod
    def parse_token(raw_token: str) -> str | False:
        from utils import Secret
        if isinstance(raw_token, str):
            if ' ' not in raw_token:
                return False
        else:
            return False
        payload = Secret.decode_token(raw_token.split(' ')[1])
        if payload and payload['role'] == 'appointment.book.client.login':
            return payload
        return False

    @staticmethod
    def get_user(payload: dict) -> Appointment.Request | False:
        a = Appointment.Request()
        a.turn_off_validation()
        a.m_id = payload['m_id']
        return a


class _CallProofVideo(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_appointment_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_filename: Optional[str] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.MinLen(0), Vld.MaxLen(128), Vld.MustBeAVideo()
            )
        )
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'appointment_meeting_call_proof_videos'


class _Request(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_patient_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_doctor_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self._time_from: Optional[datetime] = Vld.validatable(Vld.Or(Vld.DateTime(), Vld.DateTimeObject()))
        self._time_to: Optional[datetime] = Vld.validatable(Vld.Or(Vld.DateTime(), Vld.DateTimeObject()))
        self.m_symptom_description: Optional[str] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.MinLen(10), Vld.MaxLen(512)
            )
        )
        self.m_payable_amount: Optional[float] = Vld.validatable(
            Vld.And(
                Vld.Or(Vld.Int(), Vld.Float()), Vld.MinVal(0)
            )
        )
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'appointment_requests'

    @property
    def m_time_from(self) -> datetime:
        return self._time_from

    @m_time_from.setter
    def m_time_from(self, value: datetime | str):
        if isinstance(value, str):
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            value = Func.convert_offset_naive_to_aware_datetime(value)
        self._time_from = value

    @property
    def m_time_to(self) -> datetime:
        return self._time_to

    @m_time_to.setter
    def m_time_to(self, value: datetime | str):
        if isinstance(value, str):
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        # check if the datetime is naive
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            value = Func.convert_offset_naive_to_aware_datetime(value)
        self._time_to = value


class Appointment(SQLEntity, Vld.PropertyTypeValidatorEntity):
    BookPayfastLogin = _BookPayfastLogin
    BookClientLogin = _BookClientLogin
    CallProofVideo = _CallProofVideo
    Request = _Request

    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_patient_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_doctor_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self._time_from: Optional[datetime] = Vld.validatable(Vld.Or(Vld.DateTime(), Vld.DateTimeObject()))
        self._time_to: Optional[datetime] = Vld.validatable(Vld.Or(Vld.DateTime(), Vld.DateTimeObject()))
        self.m_symptom_description: Optional[str] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.MinLen(10), Vld.MaxLen(512)
            )
        )
        self.m_paid_amount: Optional[float] = Vld.validatable(
            Vld.And(
                Vld.Or(Vld.Int(), Vld.Float()), Vld.MinVal(0)
            )
        )
        self.m_status: Optional[Literal[
            'PAT_CANCELLED', 'PAT_NOT_JOINED_REQ', 'PAT_NOT_JOINED_REJ', 'PAT_NOT_JOINED', 'DOC_CANCELLED',
            'DOC_REQUESTED_DELAY', 'DOC_NOT_JOINED', 'SLOT_CLASH', 'PENDING', 'COMPLETED'
        ]] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.In(
                    'PAT_CANCELLED', 'PAT_NOT_JOINED_REQ', 'PAT_NOT_JOINED_REJ', 'PAT_NOT_JOINED', 'DOC_CANCELLED',
                    'DOC_REQUESTED_DELAY', 'DOC_NOT_JOINED', 'SLOT_CLASH', 'PENDING', 'COMPLETED'
                )
            )
        )
        self.m_status_change_time: Optional[datetime] = Vld.validatable(
            Vld.And(
                Vld.DateTimeObject()
            )
        )
        self.m_delay_count_by_doc: Optional[int] = Vld.validatable(
            Vld.And(
                Vld.Int(), Vld.MinVal(0), Vld.MaxVal(255)
            )
        )
        self.m_reschedule_count_by_pat: Optional[int] = Vld.validatable(
            Vld.And(
                Vld.Int(), Vld.MinVal(0), Vld.MaxVal(255)
            )
        )
        self.m_payment_time: Optional[int] = Vld.validatable(
            Vld.And(
                Vld.DateTimeObject()
            )
        )
        self.m_doctor_report: Optional[str] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.MinLen(0), Vld.MaxLen(768)
            )
        )
        self.m_patient_review: Optional[str] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.MinLen(0), Vld.MaxLen(512)
            )
        )
        self.m_rating: Optional[int] = Vld.validatable(
            Vld.And(
                Vld.Int(), Vld.MinVal(1), Vld.MaxVal(5)
            )
        )
        self.m_secret_code: Optional[str] = Vld.validatable(
            Vld.And(
                Vld.Str(), Vld.MinLen(5), Vld.MaxLen(5)
            )
        )
        self.m_refunded_amount: Optional[float] = Vld.validatable(
            Vld.And(
                Vld.Or(Vld.Int(), Vld.Float()), Vld.MinVal(0)
            )
        )
        super().__init__()
        self.turn_on_validation()

    @property
    def m_time_from(self) -> datetime:
        return self._time_from

    @m_time_from.setter
    def m_time_from(self, value: datetime | str):
        if isinstance(value, str):
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            value = Func.convert_offset_naive_to_aware_datetime(value)
        self._time_from = value

    @property
    def m_time_to(self) -> datetime:
        return self._time_to

    @m_time_to.setter
    def m_time_to(self, value: datetime | str):
        if isinstance(value, str):
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        # check if the datetime is naive
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            value = Func.convert_offset_naive_to_aware_datetime(value)
        self._time_to = value

    class StatusEnum:
        PAT_CANCELLED = 'PAT_CANCELLED'
        PAT_NOT_JOINED_REQ = 'PAT_NOT_JOINED_REQ'
        PAT_NOT_JOINED_REJ = 'PAT_NOT_JOINED_REJ'
        PAT_NOT_JOINED = 'PAT_NOT_JOINED'
        DOC_CANCELLED = 'DOC_CANCELLED'
        DOC_REQUESTED_DELAY = 'DOC_REQUESTED_DELAY'
        DOC_NOT_JOINED = 'DOC_NOT_JOINED'
        SLOT_CLASH = 'SLOT_CLASH'
        PENDING = 'PENDING'
        COMPLETED = 'COMPLETED'

    def set_m_payment_time_to_now(self):
        self.m_payment_time = int(datetime.now().timestamp())

    @property
    def db_table_name(self) -> str:
        return 'appointments'

    @staticmethod
    def do_slots_clash(
        new_slot_time_from: datetime, new_slot_time_to: datetime,
        prev_slot_time_from: datetime, prev_slot_time_to: datetime
        ) -> bool:
        if new_slot_time_from == prev_slot_time_from or new_slot_time_to == prev_slot_time_to:
            return False
        elif new_slot_time_from < prev_slot_time_from < new_slot_time_to:
            return False
        elif new_slot_time_from < prev_slot_time_to <= new_slot_time_to:
            return False
        elif prev_slot_time_from < new_slot_time_from < prev_slot_time_to:
            return False
        elif prev_slot_time_from < new_slot_time_to <= prev_slot_time_to:
            return False
        return True
