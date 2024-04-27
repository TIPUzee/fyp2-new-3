from typing import Optional
from datetime import  datetime

from utils import SQLEntity, Validator as Vld


class Language(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_title: Optional[str] = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(3), Vld.MaxLen(32)))
        self.m_creation_time: Optional[datetime] = Vld.validatable(Vld.DateTimeObject())
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'languages'
