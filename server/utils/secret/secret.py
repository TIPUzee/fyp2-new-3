from __future__ import annotations

import jwt

import secrets

from ..env import Env


class Secret:
    @staticmethod
    def encode_token(payload: dict) -> str | False:
        try:
            return jwt.encode(payload, Env.get('SECRET_KEY'), algorithm="HS256")
        except:
            return False

    @staticmethod
    def decode_token(token: str) -> dict | False:
        try:
            return jwt.decode(token, Env.get('SECRET_KEY'), algorithms=['HS256'])
        except:
            return False

    @staticmethod
    def gen_random_code(length: int = 6) -> int:
        return int(''.join(secrets.choice('123456789') for _ in range(length)))

    @staticmethod
    def gen_random_code_str(length: int = 6, english_letters_indices: list[int] = None) -> str:
        _ = ''.join(secrets.choice('123456789') for _ in range(length))
        if english_letters_indices:
            _ = list(_)
            for i in english_letters_indices:
                _[i] = secrets.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
            return ''.join(_)
        return _
