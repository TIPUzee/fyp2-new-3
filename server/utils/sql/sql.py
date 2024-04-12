from __future__ import annotations

from typing import Any, Optional

from mysql import connector
from mysql.connector.cursor import MySQLCursor

from ..funcs.funcs import Func
from ..env import Env


class SQL:
    def __init__(self):
        self.connection = connector.connect(
            host=Env.get('DEV_MYSQL_HOST') if Env.get('PROD_MODE') == '1' else Env.get('PROD_MYSQL_HOST'),
            user=Env.get('DEV_MYSQL_USER') if Env.get('PROD_MODE') == '1' else Env.get('PROD_MYSQL_USER'),
            password=Env.get('DEV_MYSQL_PASSWORD') if Env.get('PROD_MODE') == '1' else Env.get('PROD_MYSQL_PASSWORD'),
            database=Env.get('DEV_MYSQL_DB') if Env.get('PROD_MODE') == '1' else Env.get('PROD_MYSQL_DB')
        )
        self.cursor: Optional[MySQLCursor] = None

    def execute(self, query: str, params: list = None) -> list[dict[str, Any]] | int:
        if not params:
            params = []
        self.cursor = self.connection.cursor()
        new_params = []
        for i, param in enumerate(params):
            if isinstance(param, list):
                _ = ", ".join(['%s' for _ in param])
                query = Func.SqlHelpers.replace_nth_occurrence_(query, '%s', _, len(new_params))
                for new_param in param:
                    if isinstance(new_param, dict):
                        new_param = f'"{str(param)}"'
                    new_params.append(new_param)
            else:
                if isinstance(param, dict):
                    param = f'"{str(param)}"'
                new_params.append(param)
        if Func.SqlHelpers.nb_of_coming_queries_to_print > 0:
            print(f'Query: {query}')
            print(f'Params: {new_params}')
            Func.SqlHelpers.nb_of_coming_queries_to_print -= 1

        self.cursor.execute(query, new_params)

        if 'select' in query.lower():
            return Func.SqlHelpers.fetch_all_as_dicts(self.cursor)
        else:
            if 'insert' in query.lower():
                return self.cursor.lastrowid
            return self.cursor.rowcount

    def commit(self):
        self.connection.commit()

    def rollback(self):
        self.connection.rollback()

    def __del__(self):
        self.connection.rollback()
        self.connection.close()
