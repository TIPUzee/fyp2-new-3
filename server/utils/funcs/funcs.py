from typing import Any
from datetime import datetime, timezone
from urllib.parse import urlencode

import pytz

from werkzeug.datastructures import FileStorage


class Func:
    __uuid_count = 0

    @staticmethod
    def get_uuid():
        Func.__uuid_count += 1
        return f'uuid_{Func.__uuid_count}'

    @staticmethod
    def get_current_time():
        return datetime.now(timezone.utc)

    @staticmethod
    def convert_offset_naive_to_aware_datetime(dt: datetime):
        return pytz.utc.localize(dt)

    @staticmethod
    def get_defined_datetime_str(dt: datetime):
        return dt.strftime('%Y-%m-%d %H:%M:%S')

    @staticmethod
    def encode_url_params(params: dict[str, Any]):
        # For example, {'t': 'Bearer abc'} -> 't=Bearer%20abc'
        return urlencode(params)

    @staticmethod
    def encode_url_param_val(param: Any):
        # For example, {'t': 'Bearer abc'} -> 't=Bearer%20abc'
        return urlencode({'t': param})[2:]

    @staticmethod
    def assign_uuid(obj):
        obj.__name__ = Func.get_uuid()
        return obj.__name__

    @staticmethod
    def get_attr_starts_with(obj, attr: str):
        return [i for i in dir(obj) if i.startswith(attr)]

    @staticmethod
    def get_attr_custom_storage_name(attr: str):
        return f'_custom_storage_{attr}'

    @staticmethod
    def set_attr_to_builtin_type(val, attr_name: str, attr_val: type):
        class tmp(type(val)):
            def attr(self, n, v):
                setattr(self, n, v)
                return self

        return tmp(val).attr(attr_name, attr_val)

    @staticmethod
    def convert_time_str_to_mints(time_str: str) -> int:
        # For example, 10:30 AM -> 630
        time = time_str.split(' ')
        time = time[0].split(':')
        time = [int(time[0]), int(time[1])]
        if time_str.endswith('PM'):
            time[0] += 12
        return time[0] * 60 + time[1]

    class SqlHelpers:
        nb_of_coming_queries_to_print = 0

        @staticmethod
        def replace_nth_occurrence_(input_str, substring, replacement, n):
            start_index = input_str.find(substring)
            while start_index >= 0 and n > 0:
                start_index = input_str.find(substring, start_index + 1)
                n -= 1

            if start_index >= 0:
                return input_str[:start_index] + replacement + input_str[start_index + len(substring):]
            else:
                return input_str

        @staticmethod
        def fetch_all_as_dicts(cursor) -> list[dict[str, Any]]:
            cols_names = cursor.column_names
            result = []
            for row in cursor.fetchall():
                curr_obj = {}
                for i, col_name in enumerate(cols_names):
                    curr_obj[col_name] = row[i]
                result.append(curr_obj)
            return result

        @staticmethod
        def fetch_all_as_array(cursor) -> tuple[dict[str, int], list[list[Any]]]:
            # (mapping, data)
            # For example, ({'id': 0, 'name': 1}, [[1, 'John'], [2, 'Doe']])
            cols_names = cursor.column_names
            result = []
            for row in cursor.fetchall():
                curr_obj = []
                for i, _ in enumerate(cols_names):
                    curr_obj.append(row[i])
                result.append(curr_obj)
            return {cols_names[i]: i for i in range(len(cols_names))}, result

    class FileHelpers:
        @staticmethod
        def nb_of_lines(file_path: list[FileStorage]) -> int:
            return sum(1 for _ in file_path)
