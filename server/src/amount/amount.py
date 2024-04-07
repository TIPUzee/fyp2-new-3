from typing import Literal, Union

AppointmentStatus = Union[Literal['PAT_CANCELLED', 'PAT_NOT_JOINED_REQ', 'PAT_NOT_JOINED_REJ', 'PAT_NOT_JOINED', \
    'DOC_CANCELLED', 'DOC_REQUESTED_DELAY', 'DOC_NOT_JOINED', 'SLOT_CLASH', 'PENDING', 'COMPLETED']]


class Calc:
    @staticmethod
    def appointment_fee_n_charges_percentages(
        status: AppointmentStatus, doc_delayed: bool, pat_delayed: bool
    ) -> tuple[float, float, float, float]:
        """
        return:
        - system fee
        - doctor fee
        - doctor cut-offs
        - patient refunds
        """
        if status == 'COMPLETED':
            return 10, 90, 0, 0
        elif status == 'DOC_CANCELLED':
            return 5, 0, 5, 100
        elif status == 'PAT_CANCELLED':
            return 8, 12, 0, 80
        elif status == 'PAT_NOT_JOINED':
            return 5, 35, 0, 55
        elif status == 'DOC_REQUESTED_DELAY' and doc_delayed:
            return 5, 0, 15, 10
        elif status == 'DOC_NOT_JOINED':
            return 15, 0, 25, 110
        elif status == 'SLOT_CLASH':
            return 0, 0, 0, 0
        elif status == 'PENDING' and pat_delayed:
            return 0, 0, 0, 0
        elif status == 'PENDING':
            return 0, 0, 0, 0
        else:
            raise ValueError(f"Invalid appointment status: {status}")

    @staticmethod
    def appointment_fee_n_charges(amount: float, status: AppointmentStatus,
                                  doc_delayed: bool, pat_delayed: bool) -> tuple[float, float, float, float]:
        """
        return:
        - system fee
        - doctor fee
        - patient refunds / charges
        """
        system_fee, doctor_fee, doctor_cutoffs, patient_charges = Calc.appointment_fee_n_charges_percentages(
            status, doc_delayed, pat_delayed
        )
        return (
            (system_fee * amount) / 100,
            (doctor_fee * amount) / 100,
            (-1 * ((doctor_cutoffs * amount) / 100)),
            (patient_charges * amount) / 100
        )

    @staticmethod
    def appointment_system_fee(amount: float, new_status: AppointmentStatus,
                               doc_delayed: bool = False, pat_delayed: bool = False) -> float:
        return Calc.appointment_fee_n_charges(amount, new_status, doc_delayed, pat_delayed)[0]

    @staticmethod
    def appointment_doctor_fee(amount: float, new_status: AppointmentStatus,
                               doc_delayed: bool = False, pat_delayed: bool = False) -> float:
        return Calc.appointment_fee_n_charges(amount, new_status, doc_delayed, pat_delayed)[1]

    @staticmethod
    def appointment_doctor_cutoffs(amount: float, new_status: AppointmentStatus,
                                   doc_delayed: bool = False, pat_delayed: bool = False) -> float:
        return Calc.appointment_fee_n_charges(amount, new_status, doc_delayed, pat_delayed)[2]

    @staticmethod
    def appointment_patient_refunds(amount: float, new_status: AppointmentStatus,
                                    doc_delayed: bool = False, pat_delayed: bool = False) -> float:
        return Calc.appointment_fee_n_charges(amount, new_status, doc_delayed, pat_delayed)[3]
