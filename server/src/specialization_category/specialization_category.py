from utils import SQLEntity, Validator as vld


class SpecializationCategory(SQLEntity, vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id = vld.validatable(vld.And(vld.Int(), vld.MinVal(0)))
        self.m_title = vld.validatable(vld.And(vld.Str(), vld.MinLen(3), vld.MaxLen(64)))
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'specialization_categories'
