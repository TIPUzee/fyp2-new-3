from __future__ import annotations

import time
from typing import Any, Callable, Literal
import json

from flask import Flask, request

from .response import Response as Res
from ..access_controlled_entity import AccessControlledEntity
from ..funcs import Func
from ..uploaded_file import UploadedFiles


class App:
    platform_name = 'AI-Disease Predictor'
    platform_slogan = 'Empower Health Tomorrow, Today!'
    App: Flask = None
    Res: Res = Res

    @staticmethod
    def init_app(app_name: str):
        App.App = Flask(app_name)

    @staticmethod
    def get_app() -> Flask:
        return App.App

    @staticmethod
    def run_app(**kwargs):
        App.App.run(**kwargs)

    @staticmethod
    def enable_cors():
        from flask_cors import CORS
        CORS(App.App)

    @staticmethod
    def template_route(route_url: str, **kwargs):
        def decorator(func):
            Func.assign_uuid(func)
            App.App.add_url_rule(route_url, func.__name__, func, **kwargs)
            return func

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def api_route(
        route_url: str,
        method: Literal['GET', 'POST', 'PUT', 'DELETE'],
        path_params_pre_conversion: dict[str, Callable[[Any], Any]] = None,
        path_params_validators: dict[str, Callable[[Any], bool]] = None,
        access_control: list[type[AccessControlledEntity]] | Literal['All'] = None,
        prefix_api: bool = True,
        **kwargs
    ):
        def decorator(func):
            def _(*args, **_kwargs):
                user = App.__validate_access_control(access_control)
                _kwargs = App.perform_pre_conversions(path_params_pre_conversion, **_kwargs)
                App.__validate_path_params(path_params_validators, **_kwargs)
                return func(user=user, *args, **_kwargs)

            _func = Res.handle(_)
            Func.assign_uuid(_func)
            App.__validate_api_route(route_url)
            _route_url = f'/api{route_url}' if prefix_api else route_url
            App.App.route(_route_url, methods=[method], **kwargs)(_func)

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __validate_api_route(route: str):
        if not route.startswith('/'):
            raise ValueError('API route must start with /', 'Provided route:', route)

    @staticmethod
    def __validate_access_control(access_control: list[type[AccessControlledEntity]] | Literal['All'] | None):
        if access_control == 'All':
            return None
        if not access_control:
            return Res.unauthenticated(
                user_does_not_exist=False,
                module_not_allowed=True,
                account_suspended=False,
            )
        token_sending_options = []
        for entity in access_control:
            try:
                if not issubclass(entity, AccessControlledEntity):
                    return Res.server_error('Invalid access control entity')
                token = entity.fetch_token()
                if not token:
                    token_sending_options.append(entity.get_representation_str())
                    continue
                token = entity.parse_token(token)
                if not token:
                    token_sending_options.append(entity.get_representation_str())
                    continue
                user = entity.get_user(token)
                if not user:
                    token_sending_options.append(entity.get_representation_str())
                    continue
                break
            except:
                token_sending_options.append(entity.get_representation_str())
        else:
            return Res.unauthenticated(
                user_does_not_exist=False,
                module_not_allowed=True,
                account_suspended=False,
                token_sending_options=token_sending_options,
            )
        user.re_init_changed_props()
        return user

    @staticmethod
    def __validate_path_params(path_params: dict[str, Callable[[Any], bool]], **kwargs):
        if not path_params:
            return
        for param, validator in path_params.items():
            if not validator(kwargs[param]):
                return Res.frontend_error(f'Invalid path param: {param}')

    @staticmethod
    def perform_pre_conversions(pre_conversions: dict[str, Callable[[Any], Any]], **kwargs):
        if not pre_conversions:
            return kwargs
        for param, conversion in pre_conversions.items():
            try:
                kwargs[param] = conversion(kwargs[param])
            except:
                return Res.frontend_error(f'Invalid param: {param}')
        return kwargs

    @staticmethod
    def json_inputs(*req_params: str):
        def decorator(func):
            def _(*args, **kwargs):
                inputs = App.__get_json_inputs(*req_params)
                return func(*args, **kwargs, **inputs)
            Func.assign_uuid(_)
            return _

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __get_json_inputs(*req_params: str) -> dict[str, Any]:
        try:
            json = request.json
        except:
            return Res.frontend_error('Invalid JSON body')

        inputs = {}
        for param in req_params:
            if param not in json:
                return Res.frontend_error(f'Missing required param in JSON body: {param}')
            inputs[param] = json[param]
        return inputs

    @staticmethod
    def optional_json_inputs(**req_params):
        def decorator(func):
            def _(*args, **kwargs):
                inputs = App.__get_optional_json_inputs(**req_params)
                return func(*args, **kwargs, **inputs)
            Func.assign_uuid(_)
            return _

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __get_optional_json_inputs(**req_params) -> dict[str, Any]:
        try:
            json = request.json
        except:
            return Res.frontend_error('Invalid JSON body')

        inputs = {}
        for param, default_val in req_params.items():
            if param not in json:
                inputs[param] = default_val
            else:
                inputs[param] = json[param]
        return inputs

    @staticmethod
    def form_inputs(*req_params: str):
        def decorator(func):
            def _(*args, **kwargs):
                inputs = App.__get_form_inputs(*req_params)
                return func(*args, **kwargs, **inputs)
            Func.assign_uuid(_)
            return _

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __get_form_inputs(*req_params: str) -> dict[str, Any]:
        try:
            form = request.form
        except:
            return Res.frontend_error('Invalid form body')
        try:
            form = form.items()
            _json = [v for k, v in form if k == 'json']
            if not _json:
                return Res.frontend_error('Invalid form body as form does not contain "json" key')
            _json = _json[0]
        except:
            return Res.frontend_error('Invalid form body as form does not contain "json" key')

        try:
            _json = json.loads(_json)
            if isinstance(_json, str):
                _json = json.loads(_json)
        except:
            return Res.frontend_error('Invalid form body as "json" key does not contain valid JSON data/string')

        inputs = {}
        for param in req_params:
            if param not in _json:
                return Res.frontend_error(f'Missing required param in form body: {param}')
            inputs[param] = _json[param]
        return inputs

    @staticmethod
    def file_inputs(*req_params: str):
        def decorator(func):
            def _(*args, **kwargs):
                inputs = App.__get_file_inputs(*req_params)
                return func(*args, **kwargs, **inputs)
            Func.assign_uuid(_)
            return _

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __get_file_inputs(*req_params: str) -> dict[str, Any]:
        try:
            files = request.files
        except:
            return Res.frontend_error('Invalid form files body')
        files = {k: v for k, v in files.lists()}

        inputs = {}
        for param in req_params:
            if param not in files:
                return Res.frontend_error(f'Missing required param in form files body: {param}')
            inputs[param] = UploadedFiles([f for f in files[param] if f.filename])
            print([f.content_length for f in files[param] if f.filename])
        return inputs

    @staticmethod
    def url_inputs(*req_params: str):
        def decorator(func):
            def _(*args, **kwargs):
                inputs = App.__get_url_inputs(*req_params)
                return func(*args, **kwargs, **inputs)
            Func.assign_uuid(_)
            return _

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __get_url_inputs(*req_params: str) -> dict[str, Any]:
        try:
            url = request.args
        except:
            return Res.frontend_error('Invalid URL params')

        inputs = {}
        for param in req_params:
            if param not in url:
                return Res.frontend_error(f'Missing required param in URL: {param}')
            inputs[param] = url[param]
        return inputs

    @staticmethod
    def header_inputs(*req_params: str):
        def decorator(func):
            def _(*args, **kwargs):
                inputs = App.__get_header_inputs(*req_params)
                return func(*args, **kwargs, **inputs)
            Func.assign_uuid(_)
            return _

        Func.assign_uuid(decorator)
        return decorator

    @staticmethod
    def __get_header_inputs(*req_params: str) -> dict[str, Any]:
        try:
            headers = request.headers
        except:
            return Res.frontend_error('Invalid headers')

        inputs = {}
        for param in req_params:
            if param not in headers:
                return Res.frontend_error(f'Missing required header: {param}')
            inputs[param] = headers[param]
        return inputs
