from typing import Optional
from utils import SQLEntity, Validator as Vld


class DoctorExperience(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_doctor_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_date_from: Optional[str] = Vld.validatable(Vld.And(
            Vld.Str(), Vld.Date(), Vld.DateMustNotBeFuture()
        ))
        self.m_date_to: Optional[str] = Vld.validatable(Vld.Or(Vld.Null(), Vld.And(
            Vld.Str(), Vld.Date(), Vld.DateMustNotBeFuture()
        )))
        self.m_title: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(1), Vld.MaxLen(64)))
        self.m_description: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(1), Vld.MaxLen(512)))
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return "doctor_experiences"
