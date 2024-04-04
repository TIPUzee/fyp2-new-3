from __future__ import annotations

from ..doctor import Doctor
from ..patient import Patient
from ..admin import Admin


class MixedUserUtil:
    @staticmethod
    def whatsapp_number_exists(whatsapp_number: str) -> bool:
        p = Patient()
        p.turn_off_validation()
        p.m_whatsapp_number = whatsapp_number
        if p.exists():
            return True

        d = Doctor()
        d.turn_off_validation()
        d.m_whatsapp_number = whatsapp_number
        if d.exists():
            return True

        return False

    @staticmethod
    def email_exists(email_address: str) -> bool:
        p = Patient()
        p.turn_off_validation()
        p.m_email = email_address
        if p.exists():
            return True

        d = Doctor()
        d.turn_off_validation()
        d.m_email = email_address
        if d.exists():
            return True

        d = Doctor()
        d.turn_off_validation()
        d.m_email = email_address
        if d.exists():
            return True

        a = Admin()
        a.turn_off_validation()
        a.m_email = email_address
        if a.exists():
            return True

        return False
