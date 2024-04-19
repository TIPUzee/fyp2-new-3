from __future__ import annotations

from datetime import datetime

from utils import SQLEntity, Validator as Vld, Func

from .patient_refund_transaction_enums import PatientRefundTransactionStatus


class PatientRefundTransaction(SQLEntity, Vld.PropertyTypeValidatorEntity):
    StatusType = PatientRefundTransactionStatus

    def __init__(self):
        self.m_id = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_patient_id = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_status = Vld.validatable(Vld.In(*self.StatusType.all))
        self.m_amount = Vld.validatable(Vld.And(Vld.Float(), Vld.MinVal(0)))
        self.m_rejection_reason = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(1), Vld.MaxLen(64)))
        self.m_receiver_ep_nb = Vld.validatable(Vld.And(Vld.Str(), Vld.Phone(), Vld.MaxLen(16)))
        self.m_receiver_ep_username = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(1), Vld.MaxLen(64)))
        self.m_sender_ep_nb = Vld.validatable(Vld.And(Vld.Str(), Vld.Phone(), Vld.MaxLen(16)))
        self.m_sender_ep_username = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(1), Vld.MaxLen(64)))
        self.m_trx_id = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(6), Vld.MaxLen(16)))
        self._trx_time = Vld.validatable(Vld.Or(Vld.Null(), Vld.DateTime(), Vld.DateTimeObject()))
        self._request_time = Vld.validatable(Vld.Or(Vld.DateTime(), Vld.DateTimeObject()))

        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'patient_refund_transactions'

    @property
    def m_trx_time(self) -> datetime:
        return self._trx_time

    @m_trx_time.setter
    def m_trx_time(self, value: datetime | str | None):
        if not value:
            self._trx_time = value
            return
        if isinstance(value, str):
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        # check if the datetime is naive
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            value = Func.convert_offset_naive_to_aware_datetime(value)
        self._trx_time = value

    @property
    def m_request_time(self) -> datetime:
        return self._request_time

    @m_request_time.setter
    def m_request_time(self, value: datetime | str):
        if isinstance(value, str):
            value = datetime.strptime(value, '%Y-%m-%d %H:%M:%S')
        # check if the datetime is naive
        if value.tzinfo is None or value.tzinfo.utcoffset(value) is None:
            value = Func.convert_offset_naive_to_aware_datetime(value)
        self._request_time = value
