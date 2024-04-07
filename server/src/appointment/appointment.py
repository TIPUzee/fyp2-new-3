from typing import Optional, Literal
from datetime import datetime

from utils import SQLEntity, Validator as Vld


class Appointment(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_patient_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_doctor_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_time_from: Optional[datetime] = Vld.validatable(Vld.And(Vld.DateTimeObject()))
        self.m_time_to: Optional[datetime] = Vld.validatable(Vld.And(Vld.DateTimeObject()))
        self.m_symptom_description: Optional[str] = Vld.validatable(Vld.And(
            Vld.Str(), Vld.MinLen(0), Vld.MaxLen(512)
        ))
        self.m_paid_amount: Optional[float] = Vld.validatable(Vld.And(
            Vld.Or(Vld.Int(), Vld.Float()), Vld.MinVal(0)
        ))
        self.m_status: Optional[Literal[
            'PAT_CANCELLED', 'PAT_NOT_JOINED_REQ', 'PAT_NOT_JOINED_REJ', 'PAT_NOT_JOINED', 'DOC_CANCELLED',
            'DOC_REQUESTED_DELAY', 'DOC_NOT_JOINED', 'SLOT_CLASH', 'PENDING', 'COMPLETED'
        ]] = Vld.validatable(Vld.And(Vld.Str(), Vld.In(
            'PAT_CANCELLED', 'PAT_NOT_JOINED_REQ', 'PAT_NOT_JOINED_REJ', 'PAT_NOT_JOINED', 'DOC_CANCELLED',
            'DOC_REQUESTED_DELAY', 'DOC_NOT_JOINED', 'SLOT_CLASH', 'PENDING', 'COMPLETED'
        )))
        self.m_status_change_time: Optional[datetime] = Vld.validatable(Vld.And(
            Vld.DateTimeObject()
        ))
        self.m_delay_count_by_doc: Optional[int] = Vld.validatable(Vld.And(
            Vld.Int(), Vld.MinVal(0), Vld.MaxVal(255)
        ))
        self.m_reschedule_count_by_pat: Optional[int] = Vld.validatable(Vld.And(
            Vld.Int(), Vld.MinVal(0), Vld.MaxVal(255)
        ))
        self.m_payment_time: Optional[int] = Vld.validatable(Vld.And(
            Vld.DateTimeObject()
        ))
        self.m_doctor_report: Optional[str] = Vld.validatable(Vld.And(
            Vld.Str(), Vld.MinLen(0), Vld.MaxLen(768)
        ))
        self.m_patient_review: Optional[str] = Vld.validatable(Vld.And(
            Vld.Str(), Vld.MinLen(0), Vld.MaxLen(512)
        ))
        self.m_rating: Optional[int] = Vld.validatable(Vld.And(
            Vld.Int(), Vld.MinVal(0), Vld.MaxVal(5)
        ))
        self.m_secret_code: Optional[str] = Vld.validatable(Vld.And(
            Vld.Str(), Vld.MinLen(5), Vld.MaxLen(5)
        ))
        self.m_refunded_amount: Optional[float] = Vld.validatable(Vld.And(
            Vld.Or(Vld.Int(), Vld.Float()), Vld.MinVal(0)
        ))
        super().__init__()
        self.turn_on_validation()

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


class AppointmentCallProofVideo(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_appointment_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_filename: Optional[str] = Vld.validatable(Vld.And(
            Vld.Str(), Vld.MinLen(0), Vld.MaxLen(128), Vld.MustBeAVideo()
        ))
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'appointment_meeting_call_proof_videos'
