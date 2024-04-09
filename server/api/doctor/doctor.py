from datetime import timedelta, datetime

from utils import App, SavedFile, Validator as Vld, Func, UploadedFiles, SavedFilesZip
from src import (
    Appointment, Doctor, AvailabilityDuration, SpecializationCategory, MixedUserUtil,
    DoctorLanguage, DoctorExperience, ApprovalDocument, Language,
)


@App.api_route('/d/profile', method='PUT', access_control=[Doctor.Login])
@App.form_inputs(
    'specialization_category_id', 'email', 'password', 'old_password', 'name', 'dob', 'whatsapp_number',
    'max_meeting_duration', 'appointment_charges', 'specialization', 'availability_durations',
    'languages', 'experiences'
)
@App.file_inputs(
    'profile_pic', 'cover_pic'
)
def _(
    user: Doctor, specialization_category_id, email, password, old_password, name, dob, whatsapp_number,
    max_meeting_duration, appointment_charges, specialization, availability_durations,
    languages, experiences, profile_pic: UploadedFiles, cover_pic: UploadedFiles
    ) -> None:
    request_response = {
        'email_already_exists':               False,
        'whatsapp_number_already_exists':     False,
        'invalid_old_password':               False,
        'invalid_specialization_category_id': False,
        'invalid_languages':                  False,
        'profile_updated':                    False
    }

    # Validate the specialization category id
    s = SpecializationCategory()
    s.m_id = specialization_category_id
    if not s.exists():
        request_response['invalid_specialization_category_id'] = True
        return App.Res.client_error(**request_response)

    # Validate the email
    _user = Doctor()
    _user.m_email = email
    if MixedUserUtil.email_exists(email):
        if not (_user.load([_user.key.m_id]) and _user.m_id == user.m_id):
            request_response['email_already_exists'] = True
            return App.Res.client_error(**request_response)

    # Validate the whatsapp number
    _user = Doctor()
    _user.m_whatsapp_number = whatsapp_number
    if MixedUserUtil.whatsapp_number_exists(whatsapp_number):
        if not (_user.load([_user.key.m_id]) and _user.m_id == user.m_id):
            request_response['whatsapp_number_already_exists'] = True
            return App.Res.client_error(**request_response)

    availability_durations_validator = Vld.List(Vld.Dict('from', 'to', 'enabled'))
    if not availability_durations_validator(availability_durations):
        return App.Res.frontend_error(
            Vld.format_type_error(
                'availability_durations',
                availability_durations,
                availability_durations_validator
            )
        )

    availability_durations_objs = []
    for i, ad in enumerate(availability_durations):
        _ad = AvailabilityDuration()
        _ad.m_doctor_id = user.m_id
        _ad.load([_ad.key.m_id], _order_by=_ad.key.m_id, _offset=i)

        from_time = ad['from']
        to_time = ad['to']

        duration_validator = _ad.duration_validator(from_time)
        if not duration_validator(to_time):
            return App.Res.frontend_error(
                Vld.format_type_error(
                    'to',
                    ad['to'],
                    duration_validator
                )
            )

        _ad.m_from = from_time
        _ad.m_to = to_time
        _ad.m_enabled = bool(ad['enabled'])
        availability_durations_objs.append(_ad)

    languages_validator = Vld.List(Vld.Int())
    if not languages_validator(languages):
        return App.Res.frontend_error(
            Vld.format_type_error(
                'languages',
                languages,
                languages_validator
            )
        )

    # Validate the languages
    for lan in languages:
        _l = Language()
        _l.m_id = lan
        if not _l.exists():
            request_response['invalid_languages'] = True
            return App.Res.client_error(**request_response)

    languages_objs = []
    for ad in languages:
        lan = DoctorLanguage()
        lan.m_doctor_id = user.m_id
        lan.m_language_id = ad
        if lan.exists():
            continue
        languages_objs.append(lan)

    experiences_validator = Vld.List(Vld.Dict('title', 'description', 'date_from', 'date_to'))
    if not experiences_validator(experiences):
        return App.Res.frontend_error(
            Vld.format_type_error(
                'experiences',
                experiences,
                experiences_validator
            )
        )

    # Validate the experiences
    # and create the experience objects
    experiences_objs = []
    for i, ad in enumerate(experiences):
        e = DoctorExperience()
        e.m_doctor_id = user.m_id
        e.load([e.key.m_id], _order_by=e.key.m_id, _offset=i)
        e.m_title = ad['title']
        e.m_description = ad['description']
        e.m_date_from = ad['date_from']
        e.m_date_to = ad['date_to'] if ad['date_to'] else None
        if e.m_date_to:
            date_must_be_after_validator = Vld.DateMustBeAfter(e.m_date_from)
            if not date_must_be_after_validator(e.m_date_to):
                return App.Res.frontend_error(
                    Vld.format_type_error(
                        'date_to',
                        ad['date_to'],
                        date_must_be_after_validator
                    )
                )
        experiences_objs.append(e)

    if password:
        if user.m_password != old_password:
            request_response['invalid_old_password'] = True
            return App.Res.client_error(**request_response)
        user.m_password = password

    user.m_specialization_category_id = specialization_category_id
    user.m_email = email

    user.m_name = name
    user.m_dob = dob
    user.m_whatsapp_number = whatsapp_number
    user.m_max_meeting_duration = max_meeting_duration
    user.m_appointment_charges = appointment_charges
    user.m_specialization = specialization
    user.m_active_for_appointments = any([ad['enabled'] for ad in availability_durations])

    img_validator = Vld.MustBeAnImage()
    old_cover_pic = user.m_cover_pic_filename
    old_profile_pic = user.m_profile_pic_filename
    if cover_pic:
        cover_pic = cover_pic[0]
        if not img_validator(cover_pic.extension):
            return App.Res.frontend_error(
                Vld.format_type_error(
                    'cover_pic',
                    cover_pic.extension,
                    img_validator
                )
            )
        user.m_cover_pic_filename = cover_pic.uu_filename

    if profile_pic:
        profile_pic = profile_pic[0]
        if not img_validator(profile_pic.extension):
            return App.Res.frontend_error(
                Vld.format_type_error(
                    'profile_pic',
                    profile_pic.extension,
                    img_validator
                )
            )
        user.m_profile_pic_filename = profile_pic.uu_filename

    user.update(reset_changed_props=True)
    if cover_pic:
        cover_pic.save()
        if old_cover_pic:
            SavedFile(old_cover_pic).delete()
    if profile_pic:
        profile_pic.save()
        if old_profile_pic:
            SavedFile(old_profile_pic).delete()
    user.commit()

    for ad in availability_durations_objs:
        ad.update(reset_changed_props=True)
        ad.commit()

    for lan in languages_objs:
        lan.insert()
        lan.commit()

    # remove extra languages from the database
    lan = DoctorLanguage()
    lan.m_doctor_id = user.m_id
    extra_languages = lan.select()
    for el in extra_languages:
        if el['m_language_id'] not in languages:
            _el = DoctorLanguage()
            _el.m_id = el['m_id']
            _el.delete()
            _el.commit()

    # update existing experiences and insert new experiences
    for e in experiences_objs:
        if e.m_id:
            e.update(reset_changed_props=True)
        else:
            e.m_doctor_id = user.m_id
            e.insert(load_inserted_id_to=e.key.m_id)
        e.commit()

    # delete extra experiences from the database
    e = DoctorExperience()
    e.m_doctor_id = user.m_id
    extra_experiences = e.select()
    for ee in extra_experiences:
        if ee['m_id'] not in [i.m_id for i in experiences_objs]:
            _ee = DoctorExperience()
            _ee.m_id = ee['m_id']
            _ee.delete()
            _ee.commit()

    request_response['profile_updated'] = True
    return App.Res.ok(**request_response)


@App.api_route('/d/account/request-approval', method='POST', access_control=[Doctor.Login])
@App.file_inputs(
    'pdfs'
)
def _(user: Doctor, pdfs: UploadedFiles) -> None:
    request_response = {
        'already_approved':   False,
        'no_files_uploaded':  False,
        'approval_requested': False,
    }

    if user.m_status == 'ACCOUNT_APPROVED':
        request_response['already_approved'] = True
        return App.Res.client_error(**request_response)

    if not pdfs:
        request_response['no_files_uploaded'] = True
        return App.Res.client_error(**request_response)

    # Validate the pdfs
    pdfs_validator = Vld.MustBeAPdf()
    for pdf in pdfs:
        if not pdfs_validator(pdf.extension):
            return App.Res.frontend_error(
                Vld.format_type_error(
                    'pdfs',
                    pdf.extension,
                    Vld.List(pdfs_validator)
                )
            )

    # Delete the old pdfs
    ad = ApprovalDocument()
    ad.m_doctor_id = user.m_id
    old_pdfs = ad.select()
    for op in old_pdfs:
        SavedFile(op['m_filename']).delete()
        ad.m_id = op['m_id']
        ad.delete()
        ad.commit()

    # Save the pdfs
    for pdf in pdfs:
        ad = ApprovalDocument()
        ad.m_doctor_id = user.m_id
        ad.m_filename = pdf.uu_filename
        ad.insert()
        pdf.save()
        ad.commit()

    user.m_status = 'APPROVAL_REQUESTED'
    user.update()
    user.commit()

    request_response['approval_requested'] = True
    return App.Res.ok(**request_response)


@App.api_route('/d/account/get-documents', method='GET', access_control=[Doctor.TempUrlLogin])
def _(user: Doctor) -> None:
    ad = ApprovalDocument()
    ad.m_doctor_id = user.m_id
    ad = ad.select()

    if user.m_status == user.AccountStatusEnum.NEW_ACCOUNT or not ad:
        return App.Res.client_error(no_documents_uploaded=True)

    saved_files = []
    for a in ad:
        sf = SavedFile(a['m_filename'])
        if not sf.exists():
            continue
        saved_files.append(sf)

    return SavedFilesZip(saved_files).return_zip()


@App.api_route('/doctors', method='GET', access_control='All')
def _(user: None) -> None:
    request_response = {
        'list': False,
    }

    d = Doctor()
    d.m_status = d.AccountStatusEnum.ACCOUNT_APPROVED
    d.m_active_for_appointments = True
    doctors = d.select(not_select_cols=['m_password', 'm_email', 'm_whatsapp_number', 'm_wallet_amount'])

    l = DoctorLanguage()
    for _d in doctors:
        l.reset()
        l.m_doctor_id = _d['m_id']
        _d['languages'] = l.select()

    request_response['list'] = doctors
    return App.Res.ok(**request_response)


@App.api_route(
    '/doctor/<doctor_id>',
    path_params_pre_conversion={'doctor_id': int},
    path_params_validators={'doctor_id': Vld.Int()},
    method='GET', access_control='All'
)
def _(user: None, doctor_id: int) -> dict:
    response = {
        'doctor_not_found': False,
        'doctor':           False,
    }

    doctor = Doctor()
    doctor.m_id = doctor_id
    if not doctor.load(not_select_cols=['m_password', 'm_email', 'm_whatsapp_number', 'm_wallet_amount']):
        response['doctor_not_found'] = True
        return App.Res.client_error(**response)

    doctor_dict = doctor.to_dict()

    # get the doctor's languages
    dl = DoctorLanguage()
    dl.m_doctor_id = doctor_id
    doctor_dict['languages'] = dl.select()

    # get the doctor's experiences
    de = DoctorExperience()
    de.m_doctor_id = doctor_id
    doctor_dict['experiences'] = de.select()

    # get the doctor's availability durations
    ad = AvailabilityDuration()
    ad.m_doctor_id = doctor_id
    doctor_dict['availability_durations'] = ad.select()

    response['doctor'] = doctor_dict
    return App.Res.ok(**response)


@App.api_route(
    '/doctor/<doctor_id>/reviews/<offset>', 'GET',
    path_params_pre_conversion={'doctor_id': int, 'offset': int},
    path_params_validators={'doctor_id': Vld.Int(), 'offset': Vld.Int()},
    access_control='All'
)
def _(user: None, doctor_id: int, offset: int) -> None:
    request_response = {
        'list':           False,
        'next_offset':    0,
        'limit_per_load': 1
    }

    a = Appointment()
    a.turn_off_validation()
    a.m_doctor_id = doctor_id
    a.m_status = a.StatusEnum.COMPLETED
    a.m_id = offset
    reviews = a.select(
        select_cols=['m_patient_review', 'm_rating', 'm_id', 'm_time_to'],
        where_greater_than=['m_id'],
        _limit=request_response['limit_per_load'],
        _order_by='m_id'
    )

    request_response['list'] = reviews
    request_response['next_offset'] = reviews[-1]['m_id'] if reviews else offset

    return App.Res.ok(**request_response)


@App.api_route(
    '/doctor/<doctor_id>/analytics', 'GET',
    path_params_pre_conversion={'doctor_id': int},
    path_params_validators={'doctor_id': Vld.Int()},
    access_control='All'
)
def _(user: None, doctor_id: int) -> None:
    request_response = {
        'doctor_not_found':        False,
        'rating_analytics':        False,
        'nb_of_appoint_analytics': False,
    }
    rating_analytics = {
        'total_appointments': 0,
        'rating_1_star':      0,
        'rating_2_star':      0,
        'rating_3_star':      0,
        'rating_4_star':      0,
        'rating_5_star':      0,
        'days':               30,
    }
    nb_of_appoint_analytics = {
        'weeks':                   12,
        'total_appointments':      0,
        'completed_appoints':      {
            'total':     0,
            'week_vice': []
        },
        'doc_cancelled_appoints':  {
            'total':     0,
            'week_vice': []
        },
        'doc_not_joined_appoints': {
            'total':     0,
            'week_vice': []
        },
    }

    #           Verify doctor

    d = Doctor()
    d.turn_off_validation()
    d.m_id = doctor_id
    if not d.exists():
        request_response['doctor_not_found'] = True
        return App.Res.client_error(**request_response)

    threshold_time = Func.get_current_time()

    #           Rating analytics

    a = Appointment()
    a.turn_off_validation()
    a.m_doctor_id = doctor_id
    a.m_time_to = threshold_time - timedelta(days=rating_analytics['days'])
    a.m_status = a.StatusEnum.COMPLETED
    a.m_rating = 0
    appointments = a.select(
        select_cols=['m_rating'],
        where_greater_than=['m_time_to'],
        where_not_equals=['m_rating']
    )

    rating_analytics['total_appointments'] = len(appointments)
    for i in appointments:
        rating_analytics[f'rating_{i["m_rating"]}_star'] += 1

    #           Nb of appointments analytics

    nb_of_appoint_analytics['completed_appoints']['week_vice'] = [0] * nb_of_appoint_analytics['weeks']
    nb_of_appoint_analytics['doc_cancelled_appoints']['week_vice'] = [0] * nb_of_appoint_analytics['weeks']
    nb_of_appoint_analytics['doc_not_joined_appoints']['week_vice'] = [0] * nb_of_appoint_analytics['weeks']

    a = Appointment()
    a.turn_off_validation()
    a.m_doctor_id = doctor_id
    a.m_status_change_time = threshold_time - timedelta(weeks=nb_of_appoint_analytics['weeks'])
    a.m_status = [a.StatusEnum.COMPLETED, a.StatusEnum.DOC_CANCELLED, a.StatusEnum.DOC_NOT_JOINED]
    appointments = a.select(
        select_cols=['m_status', 'm_status_change_time'],
        where_greater_than=['m_status_change_time'],
        where_in=['m_status']
    )

    nb_of_appoint_analytics['total_appointments'] = len(appointments)

    for i in appointments:
        i['m_status_change_time'] = Func.convert_offset_naive_to_aware_datetime(i['m_status_change_time'])

        if i['m_status'] == a.StatusEnum.COMPLETED:
            nb_of_appoint_analytics['completed_appoints']['total'] += 1

            week = (threshold_time - i['m_status_change_time']).days // 7
            nb_of_appoint_analytics['completed_appoints']['week_vice'][week] += 1

        elif i['m_status'] == a.StatusEnum.DOC_CANCELLED:
            nb_of_appoint_analytics['doc_cancelled_appoints']['total'] += 1

            week = (threshold_time - i['m_status_change_time']).days // 7
            nb_of_appoint_analytics['doc_cancelled_appoints']['week_vice'][week] += 1

        elif i['m_status'] == a.StatusEnum.DOC_NOT_JOINED:
            nb_of_appoint_analytics['doc_not_joined_appoints']['total'] += 1

            week = (threshold_time - i['m_status_change_time']).days // 7
            nb_of_appoint_analytics['doc_not_joined_appoints']['week_vice'][week] += 1

    #          Add analytics to the response

    request_response['rating_analytics'] = rating_analytics
    request_response['nb_of_appoint_analytics'] = nb_of_appoint_analytics

    return App.Res.ok(**request_response)


@App.api_route(
    '/doctor/<doctor_id>/appointment-slots', 'GET',
    path_params_pre_conversion={'doctor_id': int},
    path_params_validators={'doctor_id': Vld.Int()},
    access_control='All'
)
def _(user: None, doctor_id: int) -> None:
    request_response = {
        'doctor_not_found':  False,
        'appointment_slots': False,
    }

    d = Doctor()
    d.turn_off_validation()
    d.m_id = doctor_id
    if not d.load(['m_max_meeting_duration']):
        request_response['doctor_not_found'] = True
        return App.Res.client_error(**request_response)

    # next day
    threshold_time = Func.get_current_time()
    threshold_time = threshold_time.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)

    def get_doctor_appointment_slots(time: datetime):
        # week starting time
        week_threshold = time - timedelta(days=threshold_time.weekday() - 1)
        week_threshold = week_threshold.replace(hour=0, minute=0, second=0, microsecond=0)

        a = Appointment()
        a.turn_off_validation()
        a.m_doctor_id = doctor_id
        a.m_time_from = week_threshold
        appointments = a.select(
            select_cols=['m_time_from', 'm_time_to'],
            where_greater_than=['m_time_from']
        )

        ad = AvailabilityDuration()
        ad.m_doctor_id = doctor_id
        ad = ad.select()

        #               Create available slots
        available_slots = []
        for i, _ad in enumerate(ad):
            if not _ad['m_enabled']:
                continue
            time_from = _ad['m_from']
            time_to = _ad['m_to']
            while time_from + d.m_max_meeting_duration <= time_to:
                available_slots.append(
                    {
                        'timeFrom': week_threshold + timedelta(days=i - 1, minutes=time_from),
                        'timeTo':   week_threshold + timedelta(days=i - 1, minutes=time_from + d.m_max_meeting_duration),
                    }
                )
                time_from += d.m_max_meeting_duration

        #               Remove the slots that are already allocated
        for _a in appointments:
            for _i, _slot in enumerate(available_slots):
                if Func.convert_offset_naive_to_aware_datetime(_a['m_time_from']) == _slot['timeFrom'] or \
                        Func.convert_offset_naive_to_aware_datetime(_a['m_time_to']) == _slot['timeTo']:
                    available_slots.pop(_i)
                    break
        return available_slots

    appointment_slots_week_vice = []

    for i in range(3):
        time = threshold_time + timedelta(weeks=i)
        _slots = get_doctor_appointment_slots(time)
        day_vice_slots = []
        for j in range(7):
            day_vice_slots.append([])
            for slot in _slots:
                if slot['timeFrom'].weekday() == j:
                    day_vice_slots[j].append(slot)
        appointment_slots_week_vice.append(day_vice_slots)

    request_response['appointment_slots'] = appointment_slots_week_vice
    return App.Res.ok(**request_response)
