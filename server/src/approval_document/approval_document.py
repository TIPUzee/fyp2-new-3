from typing import Optional

from utils import SQLEntity, Validator as Vld


class ApprovalDocument(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_doctor_id: Optional[int] = Vld.validatable(Vld.Int())
        self.m_filename: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MaxLen(128)))
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'doctor_approval_documents'
