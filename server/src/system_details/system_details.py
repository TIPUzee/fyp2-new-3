from typing import Optional

from utils import SQLEntity, Validator as Vld


class SystemDetails(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_balance: Optional[float] = Vld.validatable(Vld.And(Vld.Float()))
        super().__init__()
        self.turn_on_validation()
        self.m_id = 1
        self.load()

    @property
    def db_table_name(self) -> str:
        return 'system_details'
