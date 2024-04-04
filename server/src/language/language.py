from utils import SQLEntity, Validator as Vld


class Language(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_title = Vld.validatable(Vld.And(Vld.Str(), Vld.MinLen(3), Vld.MaxLen(32)))
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'languages'
