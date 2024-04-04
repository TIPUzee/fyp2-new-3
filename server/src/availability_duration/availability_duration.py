from typing import Optional

from utils import SQLEntity, Validator as vld


class AvailabilityDuration(SQLEntity, vld.PropertyTypeValidatorEntity):
    def __init__(self):
        self.m_id: Optional[int] = vld.validatable(vld.And(vld.Int(), vld.MinVal(0)))
        self.m_doctor_id: Optional[int] = vld.validatable(vld.And(vld.Int(), vld.MinVal(0)))
        self.m_from: Optional[int] = vld.validatable(
            vld.And(vld.Int(), vld.MinVal(0), vld.MaxVal(1439), AvailabilityDuration.__time_validator())
        )
        self.m_to: Optional[int] = vld.validatable(
            vld.And(
                vld.Int(),
                vld.MinVal(0),
                vld.MaxVal(1439),
                AvailabilityDuration.__time_validator()
            )
        )
        self.m_enabled: Optional[bool] = vld.validatable(vld.Bool())
        super().__init__()
        self.turn_on_validation()

    @property
    def db_table_name(self) -> str:
        return "availability_durations"

    @staticmethod
    def __time_validator():
        def _(val: int) -> bool:
            return val % 30 == 0

        _.__custom_str_format__ = 'MultipleOf(30)'
        return _

    @staticmethod
    def duration_validator(from_time: int):
        def _(to_time: int) -> bool:
            return to_time > from_time

        _.__custom_str_format__ = 'MustBe(m_to > m_from)'
        return _
