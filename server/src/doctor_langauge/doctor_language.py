from utils import SQLEntity, Validator as Vld


class DoctorLanguage(SQLEntity, Vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_doctor_id = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        self.m_language_id = Vld.validatable(Vld.And(Vld.Int(), Vld.MinVal(0)))
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return 'doctor_languages'
