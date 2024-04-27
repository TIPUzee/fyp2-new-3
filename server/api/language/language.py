from utils import App, Func, Validator as Vld
from src import Language, Admin


@App.api_route('/languages', method='GET', access_control='All')
def _(user: None):
    lan = Language()
    return App.Res.ok(languages=lan.select())


@App.api_route('/a/languages', 'GET', access_control=[Admin.Login])
def _(user: Admin):
    return get_languages(user)


@App.api_route(
    '/a/language/<id>', path_params_pre_conversion={'id': int}, path_params_validators={'id': Vld.Int()},
    method='GET', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    return get_languages(user, id)


def get_languages(user: Admin, id: int = None):
    request_response = {
        'languages': []
    }
    l = Language()
    if id:
        l.m_id = id
    request_response['languages'] = l.select(select_cols='All')
    return App.Res.ok(**request_response)


@App.api_route('/a/language', method='POST', access_control=[Admin.Login])
@App.json_inputs('title')
def _(user: Admin, title: str):
    request_response = {
        'title_already_exists': False,
        'exists_as_id': 0,
        'language_created': False,
    }

    l = Language()
    l.m_title = title
    if l.load(reset_changed_props=False):
        request_response['title_already_exists'] = True
        request_response['exists_as_id'] = l.m_id

    else:
        l.m_creation_time = Func.get_current_time()
        l.insert(load_inserted_id_to='m_id')
        l.commit()
        request_response['language_created'] = True
        request_response['exists_as_id'] = l.m_id

    return App.Res.ok(**request_response)


@App.api_route(
    '/a/language/<id>', path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()}, method='PUT', access_control=[Admin.Login]
)
@App.json_inputs('title')
def _(user: Admin, id: int, title: str):
    request_response = {
        'language_does_not_exist': False,
        'title_already_exists': False,
        'updated': False,
    }

    l = Language()
    l.m_id = id
    l.m_title = title

    if not l.exists(where_equals=['m_id']):
        request_response['language_does_not_exist'] = True

    elif l.exists(where_equals=['m_title']):
        request_response['title_already_exists'] = True

    else:
        l.update()
        l.commit()
        request_response['updated'] = True

    return App.Res.ok(**request_response)


@App.api_route(
    '/a/language/<id>', path_params_pre_conversion={'id': int},
    path_params_validators={'id': Vld.Int()}, method='DELETE', access_control=[Admin.Login]
)
def _(user: Admin, id: int):
    request_response = {
        'language_does_not_exist': False,
        'language_deleted': False,
    }

    l = Language()
    l.m_id = id

    if not l.exists():
        request_response['language_does_not_exist'] = True

    else:
        l.delete()
        l.commit()
        request_response['language_deleted'] = True

    return App.Res.ok(**request_response)
