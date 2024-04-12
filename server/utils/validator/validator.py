from __future__ import annotations

import html
import re
from inspect import FullArgSpec, getfullargspec
from typing import Any, Callable, Literal, Optional, Union
from datetime import datetime

import bleach
import phonenumbers
from bleach.css_sanitizer import CSSSanitizer
from bs4 import BeautifulSoup
from phonenumbers import carrier
from phonenumbers.phonenumberutil import number_type

from ..constants import Constants
from ..funcs import Func
from ..request import App


class Validator:
    @staticmethod
    def And(*validator_func: Callable[[Any], bool]) -> Callable[[Any], bool]:
        """
        Combines multiple validator functions like an `And` operator.

        Combines multiple validator functions like an `And` operator, into a single validator function that returns
        True if all the individual validator functions return True for the given value, and False otherwise.

        Parameters
        ----------
        `validator_func`: Callable[[Any], bool]
            Variable number of validator functions. Each function should take a single
            argument and return a boolean value.

        Returns
        -------
        Callable[[Any], bool]
            A new validator function that combines the behavior of all the input validator functions.

        Example
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.And(
            ...                 Validator.Int(),
            ...                 Validator.MinVal(18),
            ...                 Validator.MaxVal(22)
            ...             )
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = 19 # True
            >>> p.m_age = 24 # False
        """

        def _(val) -> bool:
            for func in validator_func:
                if not func(val):
                    return False
            return True

        _.__custom_str_format__ = f"({' And '.join(func.__custom_str_format__ for func in validator_func)})"
        return _

    @staticmethod
    def Or(*validator_func: Callable[[Any], bool]):
        """
        Combines multiple validator functions like an `Or` operator.

        Combines multiple validator functions like an `Or` operator, into a single validator function that returns
        True if any (at least one) of the validator functions return True for the given value, and False otherwise.

        Parameters
        ----------
        `validator_func`: Callable[[Any], bool]
            Variable number of validator functions. Each function should take a single
            argument and return a boolean value.

        Returns
        -------
        Callable[[Any], bool]
            A new validator function that combines the behavior of all the input validator functions.

        Example
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Or(
            ...                 Validator.Int(),
            ...                 Validator.Float()
            ...             )
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = 19 # True
            >>> p.m_age = 20.52 # True
            >>> p.m_age = 'Ali' # False

        """

        def _(val) -> bool:
            for func in validator_func:
                if func(val):
                    return True
            return False

        _.__custom_str_format__ = f'Or({[func.__custom_str_format__ for func in validator_func]})'
        return _

    @staticmethod
    def Not(validator_func: Callable[[Any], bool]):
        """
        Negates the result of a validator function.

        Wraps a validator function and returns a new validator function that returns
        True if the wrapped validator function returns False for the given value, and False otherwise.

        Parameters
        ----------
        `validator_func`: Callable[[Any], bool]
            A validator function that takes a single argument and returns a boolean value.

        Returns
        -------
        Callable[[Any], bool]
            A new validator function that negates the result of the wrapped validator function.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Not(Validator.Str())
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = 19 # True
            >>> p.m_age = 20.52 # True
            >>> p.m_age = 'Ali' # False
        """

        def _(val) -> bool:
            return not validator_func(val)

        _.__custom_str_format__ = f'Not({validator_func.__custom_str_format__})'
        return _

    @staticmethod
    def Null():
        """
        Checks if the value is None.

        Returns True if the value is None, and False otherwise.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that checks if the value is None.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Null()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # True
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # False
        """

        def _(val) -> bool:
            return val is None

        _.__custom_str_format__ = f'Null()'
        return _

    @staticmethod
    def Any():
        """
        Checks if the value is any type.

        Returns True for any value, regardless of its type.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that always returns True.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Any()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # True
            >>> p.m_age = 19 # True
            >>> p.m_age = 'Ali' # True
        """

        def _(val) -> bool:
            return True

        _.__custom_str_format__ = f'Any()'
        return _

    @staticmethod
    def Str():
        """
        Checks if the value is a string.

        Returns True if the value is of type str, and False otherwise.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a string.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Str()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # True
        """

        def _(val):
            return type(val) == str

        _.__custom_str_format__ = f'Str()'
        return _

    @staticmethod
    def MinLen(min_len: int):
        """
        Checks if the length of a string (or list or any iteratable object) is greater than or equal to a specified
        minimum length.

        Parameters
        ----------
        min_len : int
            The minimum length that the string (or list or any iteratable object) should have.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the length of the string (or list or any iteratable object) is
            greater than or equal to min_len, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Str()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # True
        """

        def _(val: str) -> bool:
            return len(val) >= min_len

        _.__custom_str_format__ = f'MinLen({min_len})'
        return _

    @staticmethod
    def MaxLen(max_len: int):
        """
        Checks if the length of a string (or list or any iteratable object) is less than a specified maximum length.

        Parameters
        ----------
        max_len : int
            The maximum length that the string (or list or any iteratable object) should have.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the length of the string (or list or any iteratable object) is
            less than max_len, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Str()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # True
        """

        def _(val: str) -> bool:
            return len(val) <= max_len

        _.__custom_str_format__ = f'MaxLen({max_len})'
        return _

    @staticmethod
    def List(validator_func: Optional[Callable[[Any], bool]] = None):
        """
        Checks if the value is a list.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a list, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.List()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # False
            >>> p.m_age = [1, 2, 3] # True
        """

        def _(val: Any) -> bool:
            if type(val) != list:
                return False
            if validator_func:
                for v in val:
                    if not validator_func(v):
                        return False
            return True

        _.__custom_str_format__ = f'List({validator_func.__custom_str_format__})' if validator_func else 'List()'
        return _

    @staticmethod
    def MinVal(min_val: int):
        """
        Checks if the value is greater than or equal to a minimum value.

        Parameters
        ----------
        min_val : int
            The minimum value that the input should be greater than or equal to.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is greater than or equal to the minimum value,
            and False otherwise.

        Examples
        -------
        >>> class Person(Validator.PropertyTypeValidatorEntity):
        ...     def __init__(self):
        ...         self.m_age = Validator.PropertyValidatable(
        ...             Validator.MinVal(18)
        ...         )
        ...         super().__init__()
        >>> p = Person()
        >>> p.m_age = None # False
        >>> p.m_age = 19 # True
        >>> p.m_age = 17 # False
        """

        def _(val) -> bool:
            return val >= min_val

        _.__custom_str_format__ = f'MinVal({min_val})'
        return _

    @staticmethod
    def MaxVal(max_val: int):
        """
        Checks if the value is less than or equal to a maximum value.

        Parameters
        ----------
        max_val : int
            The maximum value that the input should be less than or equal to.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is less than or equal to the maximum value,
            and False otherwise.

        Examples
        -------
        >>> class Person(Validator.PropertyTypeValidatorEntity):
        ...     def __init__(self):
        ...         self.m_age = Validator.PropertyValidatable(
        ...             Validator.MaxVal(100)
        ...         )
        ...         super().__init__()
        >>> p = Person()
        >>> p.m_age = None # True
        >>> p.m_age = 99 # True
        >>> p.m_age = 101 # False
        """

        def _(val) -> bool:
            return val <= max_val

        _.__custom_str_format__ = f'MaxVal({max_val})'
        return _

    @staticmethod
    def Int():
        """
        Checks if the value is an integer.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is an integer, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Int()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # True
            >>> p.m_age = 19.56 # False
            >>> p.m_age = 'Ali' # False
            >>> p.m_age = [1, 2, 3] # False
        """

        def _(val) -> bool:
            return type(val) == int

        _.__custom_str_format__ = f'Int()'
        return _

    @staticmethod
    def Float():
        """
        Checks if the value is a float.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a float, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Float()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # False
            >>> p.m_age = [1, 2, 3] # False
            >>> p.m_age = 19.5 # True
        """

        def _(val) -> bool:
            return type(val) == float

        _.__custom_str_format__ = f'Float()'
        return _

    @staticmethod
    def Bool():
        """
        Checks if the value is a boolean.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a boolean, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Bool()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # False
            >>> p.m_age = [1, 2, 3] # False
            >>> p.m_age = True # True
        """

        def _(val) -> bool:
            return type(val) == bool

        _.__custom_str_format__ = f'Bool()'
        return _

    @staticmethod
    def Username():
        """
        Checks if the value is a valid username.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid username, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Username()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = None # False
            >>> p.m_age = 19 # False
            >>> p.m_age = 'Ali' # True
            >>> p.m_age = [1, 2, 3] # False
        """

        def _(val) -> bool:
            if (type(val) != str
                    or not 3 <= len(val) <= 16
                    or not re.match(r'^[a-zA-Z0-9_-]+$', val)
                    or val.startswith('_')
                    or val.startswith('-')
                    or val.endswith('_')
                    or val.endswith('-')
                    or '__' in val
                    or '--' in val):
                return False
            return True

        _.__custom_str_format__ = (f'Username(Letters: A-Z, a-z and Numbers: 0-9 and Underscore (_) and Hyphen (-) and '
                                   f'Length: 3-16)')
        return _

    @staticmethod
    def Name():
        """
        Checks if the value is a valid name.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid name, and False otherwise.

        Examples
        -------
        >>> class Person(Validator.PropertyTypeValidatorEntity):
        ...     def __init__(self):
        ...         self.m_name = Validator.PropertyValidatable(
        ...             Validator.Name()
        ...         )
        ...         super().__init__()
        >>> p = Person()
        >>> p.m_name = None # False
        >>> p.m_name = "John Doe" # True
        >>> p.m_name = " Alice " # True
        >>> p.m_name = "Jo" # False (less than 3 characters after trimming)
        >>> p.m_name = "1" # False (contains non-letter characters)
        >>> p.m_name = "Bob@" # False (contains non-letter characters)
        """

        def _(val) -> bool:
            if not isinstance(val, str):
                return False

            val = val.strip()
            if len(val) < 3:
                return False

            if not re.match(r'^[A-Za-z\s]+$', val):
                return False

            return True

        _.__custom_str_format__ = "Name(Letters and Spaces only, min length: 3 after trimming)"
        return _

    @staticmethod
    def Email():
        """
        Checks if the value is a valid email address.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid email address, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_age = Validator.PropertyValidatable(
            ...             Validator.Email()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_age = 'Ali' # False
            >>> p.m_age = [1, 2, 3] # False
            >>> p.m_age = 'test@example.com' # True
        """

        def _(val) -> bool:
            if (type(val) != str
                    or not re.match(r'^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$', val)):
                return False
            return True

        _.__custom_str_format__ = f'Email()'
        return _

    @staticmethod
    def Password():
        """
        Checks if the value is a valid password.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid password, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_password = Validator.PropertyValidatable(
            ...             Validator.Password()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_password = None # False
            >>> p.m_password = 19 # False
            >>> p.m_password = 'Ali' # False
            >>> p.m_password = [1, 2, 3] # False
            >>> p.m_password = 'Password123' # True
        """

        def _(val) -> bool:
            if (not isinstance(val, str)
                    or not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&_-]+$', val)):
                return False
            return True

        _.__custom_str_format__ = (f'Password (Must contain at least one uppercase letter, '
                                   f'one lowercase letter, one digit. Special characters: @$!%*?& are optional.)')
        return _

    @staticmethod
    def Date():
        """
        Checks if the value is a valid date.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid date, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_date = Validator.PropertyValidatable(
            ...             Validator.Date()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_date = 'Ali' # False
            >>> p.m_date = [1, 2, 3] # False
            >>> p.m_date = '2021-10-10' # True
        """

        def _(val) -> bool:
            return bool(re.match(r'^\d{4}-\d{2}-\d{2}$', val))

        _.__custom_str_format__ = f'Date("YYYY-MM-DD")'
        return _

    @staticmethod
    def DateTime():
        """
        Checks if the value is a valid date and time.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid date and time, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_date_time = Validator.PropertyValidatable(
            ...             Validator.DateTime()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_date_time = 'Ali' # False
            >>> p.m_date_time = [1, 2, 3] # False
            >>> p.m_date_time = '2021-10-10 12:00:00 AM' # True
        """

        def _(val) -> bool:
            try:
                return bool(re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$', val))
            except:
                return False

        _.__custom_str_format__ = f'DateTime("YYYY-MM-DD HH:MM:SS")'
        return _

    @staticmethod
    def Phone():
        """
        Checks if the value is a valid phone number.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid phone number, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_phone = Validator.PropertyValidatable(
            ...             Validator.Phone()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_phone = 'Ali' # False
            >>> p.m_phone = [1, 2, 3] # False
            >>> p.m_phone = '+923001234567' # True
        """

        def _(val: str) -> bool:
            if not val.startswith('+'):
                return False
            try:
                return carrier._is_mobile(number_type(phonenumbers.parse(val, None)))
            except phonenumbers.phonenumberutil.NumberParseException:
                return False

        _.__custom_str_format__ = f'Phone(+XXXXXXXXXXXX)'
        return _

    @staticmethod
    def In(*values):
        """
        Checks if the value is in a list of allowed values.

        Parameters
        ----------
        values : Any
            A list of allowed values.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is in the list of allowed values, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.status = Validator.PropertyValidatable(
            ...             Validator.In('ACTIVE', 'INACTIVE', 'PENDING')
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.status = 'ACTIVE' # True
            >>> p.status = 'INACTIVE' # True
            >>> p.status = 'pending' # False
            >>> p.status = 'deleted' # False
        """

        def _(val) -> bool:
            return val in values

        _.__custom_str_format__ = f'In({values})'
        return _

    @staticmethod
    def Dict(*keys: str):
        """
        Checks if the value is a dictionary and contains the specified keys.

        Parameters
        ----------
        keys : str
            A list of keys that the dictionary should contain.

        Returns
        -------
        Callable[[dict], bool]
            A validator function that returns True if the value is a dictionary and contains the specified keys,
            and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_info = Validator.PropertyValidatable(
            ...             Validator.Dict('name', 'age',
            ...                             'address', 'phone')
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_info = {'name': 'Ali', 'age': 19, 'address': 'Lahore', 'phone': '+923001234567'} # True
            >>> p.m_info = {'name': 'Ali', 'age': 19, 'address': 'Lahore'} # False
            >>> p.m_info = {'name': 'Ali', 'age': 19, 'phone': '+923001234567'} # False
        """

        def _(val: dict) -> bool:
            return all(k in val for k in keys)

        _.__custom_str_format__ = f'Dict({keys})'
        return _

    @staticmethod
    def Regex(pattern: str):
        """
        Checks if the value matches the specified regular expression pattern.

        Parameters
        ----------
        pattern : str
            The regular expression pattern that the value should match.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value matches the specified regular expression pattern,
            and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_time = Validator.PropertyValidatable(
            ...             Validator.Regex(r'^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$')
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_info = '12:00 PM' # True
        """

        def _(val: str) -> bool:
            return bool(re.match(pattern, val))

        _.__custom_str_format__ = f'Regex({pattern})'
        return _

    @staticmethod
    def Time():
        """
        Checks if the value is a valid time string in the format "HH:MM AM/PM".

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a valid time string in the format "HH:MM AM/PM",
            and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_time = Validator.PropertyValidatable(
            ...             Validator.Time()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_time = '12:00 PM' # True
        """

        def _(val: str) -> bool:
            return Validator.Regex(r'^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$')(val)

        _.__custom_str_format__ = f'TimeStrFormat(Range: 01:00 AM - 12:59 PM)'
        return _

    @staticmethod
    def DateMustBeAfter(from_date: str):
        """
        Checks if the value is a date that is after the specified date.

        Parameters
        ----------
        from_date : str
            The date that the value should be after.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a date that is after the specified date,
            and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_date = Validator.PropertyValidatable(
            ...             Validator.DateMustBeAfter('2021-01-01')
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_date = '2021-01-02' # True
            >>> p.m_date = '2020-12-31' # False
        """

        def _(val: str) -> bool:
            return datetime.strptime(val, '%Y-%m-%d') > datetime.strptime(from_date, '%Y-%m-%d')

        _.__custom_str_format__ = f'DateMustBeAfter({from_date})'
        return _

    @staticmethod
    def DateMustNotBeFuture():
        """
        Checks if the value is a date that is not in the future.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a date that is not in the future, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_date = Validator.PropertyValidatable(
            ...             Validator.DateMustNotBeFuture()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_date = '2021-01-02' # True
            >>> p.m_date = '2022-12-31' # False
        """

        def _(val: str) -> bool:
            return datetime.strptime(val, '%Y-%m-%d') <= datetime.now()

        _.__custom_str_format__ = f'DateMustNotBeFuture()'
        return _

    @staticmethod
    def MustBeAnImage():
        """
        Checks if the value is a valid image file.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a valid image file, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_image = Validator.PropertyValidatable(
            ...             Validator.MustBeAnImage()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_image = 'image.jpg' # True
            >>> p.m_image = 'image.png' # True
            >>> p.m_image = 'image.gif' # True
            >>> p.m_image = 'image.pdf' # False
        """

        def _(val: str) -> bool:
            return val.lower().endswith(tuple(Constants.IMAGE_EXTENSIONS))

        _.__custom_str_format__ = f'MustBeAnImage({Constants.IMAGE_EXTENSIONS})'
        return _

    @staticmethod
    def MustBeAPdf():
        """
        Checks if the value is a valid PDF file.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a valid PDF file, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_pdf = Validator.PropertyValidatable(
            ...             Validator.MustBeAPdf()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_pdf = 'file.pdf' # True
            >>> p.m_pdf = 'file.PDF' # True
            >>> p.m_pdf = 'file.jpg' # False
        """

        def _(val: str) -> bool:
            return val.lower().endswith('pdf')

        _.__custom_str_format__ = f'MustBeAPdf()'
        return _

    @staticmethod
    def MustBeAVideo():
        """
        Checks if the value is a valid video file.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a valid video file, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_video = Validator.PropertyValidatable(
            ...             Validator.MustBeAVideo()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_video = 'video.mp4' # True
            >>> p.m_video = 'video.mov' # True
            >>> p.m_video = 'video.jpg' # False
        """

        def _(val: str) -> bool:
            return val.lower().endswith(tuple(Constants.VIDEO_EXTENSIONS))

        _.__custom_str_format__ = f'MustBeAVideo({Constants.VIDEO_EXTENSIONS})'
        return _

    @staticmethod
    def NotAssignable():
        """
        Checks if the value is not setable.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that always returns False.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_name = Validator.PropertyValidatable(
            ...             Validator.NotAssignable()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_name = 'Ali' # False
            >>> p.m_name = None # False
        """

        def _(val) -> bool:
            return False

        _.__custom_str_format__ = f'NotAssignable()'
        return _

    @staticmethod
    def DateTimeObject():
        """
        Checks if the value is a valid datetime object.

        Returns
        -------
        Callable[[Any], bool]
            A validator function that returns True if the value is a valid datetime object, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_date_time = Validator.PropertyValidatable(
            ...             Validator.DateTimeObject()
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_date_time = datetime.now() # True
            >>> p.m_date_time = '2021-10-10 12:00:00' # True
        """

        def _(val) -> bool:
            return isinstance(val, datetime)

        _.__custom_str_format__ = f'DateTimeObject()'
        return _

    @staticmethod
    def TextInHtmlMaxLen(max_len: int):
        """
        Checks if the value is a string containing HTML and its text length is less than the specified maximum length.

        Parameters
        ----------
        max_len : int
            The maximum allowed length of the text.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a string containing HTML and its text length is
            less than the specified maximum length, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_html_content = Validator.PropertyValidatable(
            ...             Validator.TextInHtmlMaxLen(10)
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_html_content = 'Ali' # True
            >>> p.m_html_content = '<p>Hello</p>' # True
            >>> p.m_html_content = '<p>Hello, World</p>' # False
            >>> p.m_html_content = '<p>Hi, <strong>Ali</strong></p>' # True
        """

        def _(val: str) -> bool:
            soup = BeautifulSoup(val, 'html.parser')
            text = soup.get_text()
            text = html.unescape(text)
            return len(text) < max_len

        _.__custom_str_format__ = f'TextInHtmlMaxLen({max_len})'
        return _

    @staticmethod
    def TextInHtmlMinLen(min_len: int):
        """
        Checks if the value is a string containing HTML and its text length is greater than or equal to the specified
        minimum length.

        Parameters
        ----------
        min_len : int
            The minimum allowed length of the text.

        Returns
        -------
        Callable[[str], bool]
            A validator function that returns True if the value is a string containing HTML and its text length is
            greater than or equal to the specified minimum length, and False otherwise.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_html_content = Validator.PropertyValidatable(
            ...             Validator.TextInHtmlMinLen(5)
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_html_content = 'Ali' # False
            >>> p.m_html_content = '<p>Hello</p>' # True
            >>> p.m_html_content = '<p>Hello, World</p>' # True
            >>> p.m_html_content = '<p>Hi, <strong>Ali</strong></p>' # True
        """

        def _(val: str) -> bool:
            soup = BeautifulSoup(val, 'html.parser')
            text = soup.get_text()
            text = html.unescape(text)
            return len(text) >= min_len

        _.__custom_str_format__ = f'TextInHtmlMinLen({min_len})'
        return _

    @staticmethod
    def neutralize_js_injection(
        allowed_tags: set[str] = set(), allowed_attributes: dict[str, list[str]] = dict(),
        allowed_css_props: Optional[list[str]] = None
    ):
        """
        Decorator that sanitizes input strings to neutralize JavaScript injection.

        Parameters
        ----------
        allowed_tags : set[str], optional
            Set of allowed HTML tags, by default an empty set.
        allowed_attributes : dict[str, list[str]], optional
            Dictionary of allowed HTML attributes for each tag, by default an empty dictionary.
        allowed_css_props : Optional[list[str]], optional
            List of allowed CSS properties, by default None.

        Returns
        -------
        Callable
            Decorator function that sanitizes input strings.

        Examples
        -------
        @Validator.neutralize_js_injection(
            allowed_tags={'p', 'strong'},
            allowed_attributes={'p': ['class'], 'strong': ['style']},
            allowed_css_props=['color', 'font-size']
        )
        def my_function(input_str: str):
            # Function logic

        Notes
        -------
        - This decorator uses the `bleach` library to sanitize input strings.
        - It removes any JavaScript code and ensures that only the specified HTML tags, attributes,
        and CSS properties are allowed.
        - If `allowed_css_props` is not provided, only HTML tags and attributes will be sanitized.
        - The decorator can be applied to functions that accept string inputs.
        """

        def decorator(func: Callable):
            def decorated(*args, **kwargs):
                args = list(args)
                css_sanitizer = CSSSanitizer(allowed_css_properties=allowed_css_props)
                for i in range(len(args)):
                    if type(args[i]) is str:
                        if allowed_css_props:
                            args[i] = bleach.clean(
                                args[i], tags=allowed_tags, attributes=allowed_attributes,
                                css_sanitizer=css_sanitizer
                            )
                        else:
                            args[i] = bleach.clean(args[i], tags=allowed_tags, attributes=allowed_attributes)
                for key in kwargs:
                    if allowed_css_props:
                        kwargs[key] = bleach.clean(
                            kwargs[key], tags=allowed_tags, attributes=allowed_attributes,
                            css_sanitizer=css_sanitizer
                        )
                    else:
                        kwargs[key] = bleach.clean(kwargs[key], tags=allowed_tags, attributes=allowed_attributes)
                args = tuple(args)
                return func(*args, **kwargs)

            return decorated

        return decorator

    @staticmethod
    def validate_param_types(func: Callable):
        func_name = func.__qualname__

        def decorated(*params, **kw_params):
            args_specs: FullArgSpec = getfullargspec(func)
            args_types = args_specs.annotations
            args_defaults = args_specs.defaults
            var_args = args_specs.varargs
            kw_only_args_defaults = args_specs.kwonlydefaults or {}.keys()
            var_kw_args = args_specs.varkw
            args = args_specs.args
            kw_only_args = args_specs.kwonlyargs

            passed = []
            for val in params:
                key = args[0] if len(args) else None
                if not key:
                    key = var_args
                else:
                    if key in passed:
                        raise
                if key in args_types:
                    curr_type = args_types[key]
                    if not curr_type(val):
                        type_repr = curr_type.__custom_str_format__
                        return App.Res.frontend_error(
                            f'Type does not match', f'key = [ {key} ]', f'expected = [ {type_repr} ]',
                            f'given = [ {type(val)} ]', f'val = [ {val} ]', f'func_name = [ {func_name} ]',
                        )
                passed.append(args.pop(0)) if len(args) else None

            keys_to_remove = []
            for key in kw_params.keys():
                val = kw_params[key]
                if key not in kw_only_args and key not in args:
                    if key in passed:
                        return App.Res.server_error(f'Multiple values', f' key = [ {key} ]', f'func = [ {func_name} ]')
                    else:
                        key = var_kw_args
                if key in args_types:
                    if not args_types[key](val):
                        curr_type = args_types[key]
                        type_repr = curr_type.__custom_str_format__
                        return App.Res.frontend_error(
                            f'Type does not match', f'key = [ {key} ]', f'expected = [ {type_repr} ]',
                            f'given = [ {type(val)} ]', f'val = [ {val} ]', f'func_name = [ {func_name} ]',
                        )
                passed.append(key)
                keys_to_remove.append(key)
            for key in keys_to_remove:
                try:
                    args.remove(key)
                except KeyError:
                    try:
                        kw_only_args.remove(key)
                    except KeyError:
                        pass

            keys_to_remove = []
            for key in args:
                if key in args_defaults:
                    keys_to_remove.append(key)
            [args.remove(key) for key in keys_to_remove]

            for key in kw_only_args:
                if key in kw_only_args_defaults:
                    keys_to_remove.append(key)
            [kw_only_args.remove(key) for key in keys_to_remove]

            if args or kw_only_args:
                return App.Res.server_error(
                    f'Missing value', f'key = [ {args} ] or [ {kw_only_args} ]', f'func = [ {func_name} ]'
                )
            return func(*params, **kw_params)

        return decorated

    @staticmethod
    def validatable(func: Callable[[Any], bool]) -> Any:
        """
        Checks if the value meets the specified validation criteria.

        Parameters
        ----------
        func : Callable[[Any], bool]
            The validation function that checks if the value meets the criteria.

        Returns
        -------
        PropertyValidatable
            An instance of PropertyValidatable with the specified validation function.
        """
        return Validator.PropertyValidatable(func)

    class PropertyValidatable:
        """
        Checks if the value meets the specified validation criteria.

        Parameters
        ----------
        func : Callable[[Any], bool]
            The validation function that checks if the value meets the criteria.

        Returns
        -------
        PropertyValidatable
            An instance of PropertyValidatable with the specified validation function.

        Examples
        -------
            >>> class Person(Validator.PropertyTypeValidatorEntity):
            ...     def __init__(self):
            ...         self.m_html_content = Validator.PropertyValidatable(
            ...             Validator.TextInHtmlMinLen(5)
            ...         )
            ...         super().__init__()
            >>> p = Person()
            >>> p.m_html_content = 'Ali' # False
            >>> p.m_html_content = '<p>Hello</p>' # True
            >>> p.m_html_content = '<p>Hello, World</p>' # True
            >>> p.m_html_content = '<p>Hi, <strong>Ali</strong></p>' # True
        """

        def __init__(self, func: Callable[[Any], bool]):
            self.validate_func = func

    class PropertyTypeValidatorEntity:
        """
        A class that provides property validation functionality.

        Usage:
        1. Create an instance of PropertyTypeValidatorEntity.
        2. Define properties with validation using the PropertyValidatable class.
        3. Call the set_validator_errors_type method to set the type of validation errors.
        4. Access and set the properties, which will trigger the validation.

        Example:
        ```
        class MyEntity(PropertyTypeValidatorEntity):
            m_name = Validator.StringValidator(min_length=1, max_length=100)

        entity = MyEntity()
        entity.set_validator_errors_type('FRONTEND')
        entity.name = 'John Doe' # Valid value
        entity.name = '' # Invalid value, will return a frontend error
        ```

        Attributes:
        - _property_validator_errors_type: The type of validation errors to be returned. Can be 'FRONTEND',
        'CLIENT', or 'BACKEND'.
        """

        def __init__(self):
            """
            Initializes the PropertyTypeValidatorEntity instance.

            This method generates the properties and sets the default validation error type to 'FRONTEND'.
            """

            self._validation_turned_off_ = True
            self._validation_turned_off_once_ = False

            if not hasattr(self.__class__, '__property_type_validator_entity_init_called__'):
                self.__generate_properties()
                setattr(self.__class__, '__property_type_validator_entity_init_called__', True)

            self._property_validator_errors_type: Union[
                Literal['FRONTEND'], Literal['CLIENT'], Literal['BACKEND']] = 'FRONTEND'

            self.__set_all_attrs_to_none()

            super().__init__()

        def __set_all_attrs_to_none(self):
            for attr_name in self.__get_attribute_names():
                setattr(self, Func.get_attr_custom_storage_name(attr_name), None)

        def turn_on_validation(self):
            self._validation_turned_off_ = False
            self._validation_turned_off_once_ = False

        def turn_off_validation(self):
            self._validation_turned_off_ = True

        def turn_off_validation_once(self):
            self._validation_turned_off_once_ = True

        def get_validation_on_status(self):
            return self._validation_turned_off_

        def set_validator_errors_type(
            self,
            errors_type: Union[Literal['FRONTEND'], Literal['CLIENT'], Literal['BACKEND']]
        ):
            """
            Sets the type of validation errors to be returned.
            If any validation error occurs, the error will be returned in the specified type.

            Args:
            - errors_type: The type of validation errors. Can be 'FRONTEND', 'CLIENT', or 'BACKEND'.
            """
            self._property_validator_errors_type = errors_type

        def __generate_properties(self):
            """
            Generates the properties with validation.
            It wraps getters and setters of the properties with validation (if getters and setters exist).
            It creates default getters and setters for the properties that do not have them, and then wrap them with
            validation.

            This method iterates over the attributes of the class and creates properties for those that are instances of
            Validator.PropertyValidatable class.
            """
            for attr_name in self.__get_attribute_names():
                if not isinstance(getattr(self, attr_name), Validator.PropertyValidatable):
                    continue
                setattr(self.__class__, attr_name, self.__create_property(attr_name))

        def __get_attribute_names(self):
            """
            Returns a list of attribute names starting with 'm_'.

            Returns:
            - A list of attribute names.
            """
            return [name for name in dir(self) if name.startswith('m_')]

        def __create_property(self, attr_name):
            """
            Creates a property with getter and setter methods.
            Uses the getter and setter methods of the attribute if they exist, otherwise creates default methods.

            Args:
            - attr_name: The name of the attribute.

            Returns:
            - The created property.
            """
            attr_storage_name = Func.get_attr_custom_storage_name(attr_name)
            validator = getattr(self, attr_name)
            self.__get_property_getter(attr_name)
            fget = self.__get_property_getter(attr_name)
            fset = self.__get_property_setter(attr_name)

            def getter(self):
                """
                Getter method for the property.

                Returns:
                - The value of the property.
                """
                return fget(self)

            def setter(self, value):
                """
                Setter method for the property.

                Args:
                - value: The value to be set.

                Returns:
                - The validation error or None.
                """
                # if class is AvailabilityDuration

                if isinstance(value, Validator.PropertyValidatable):
                    value = None
                    fset(self, value)
                    return

                if not hasattr(self.__class__, '__property_type_validator_entity_init_called__'):
                    fset(self, value)
                    return

                if not validator.validate_func(value) and not self._validation_turned_off_ \
                        and not self._validation_turned_off_once_:
                    if self._property_validator_errors_type == 'FRONTEND':
                        return App.Res.frontend_error(
                            f'Required type for {attr_name} is {validator.validate_func.__custom_str_format__} in '
                            f'provided inputs. The given value {{{value}}} does not satisfy the criteria.', f'Entity name is {self.__class__.__name__}'
                        )
                    elif self._property_validator_errors_type == 'BACKEND':
                        return App.Res.server_error(
                            f'Required type for {attr_name} is {validator.validate_func.__custom_str_format__} in '
                            f'provided inputs. The given value {{{value}}} does not satisfy the criteria.', f'Entity name is {self.__class__.__name__}'
                        )
                    elif self._property_validator_errors_type == 'CLIENT':
                        return App.Res.client_error(
                            error={
                                'type': 'error',
                                'msg':  f'Required type for {attr_name} is '
                                        f'{validator.validate_func.__custom_str_format__} in provided inputs. The '
                                        f'given value {{{value}}} does not satisfy the criteria. Entity name is '
                                        f'{self.__class__.__name__}'
                            }
                        )
                    else:
                        return
                self._validation_turned_off_once_ = False
                fset(self, value)
                return

            return property(getter, setter)

        def __get_property_getter(self, attr_name):
            """
            Returns the getter method for the property.

            Args:
            - attr_name: The name of the attribute.

            Returns:
            - The getter method.
            """
            try:
                fget = getattr(self.__class__, attr_name).fget
            except:
                def fget(self):
                    return getattr(self, Func.get_attr_custom_storage_name(attr_name))
            return fget

        def __get_property_setter(self, attr_name):
            """
            Returns the setter method for the property.

            Args:
            - attr_name: The name of the attribute.

            Returns:
            - The setter method.
            """
            try:
                fset = getattr(self.__class__, attr_name).fset
            except:
                def fset(self, value):
                    return setattr(self, Func.get_attr_custom_storage_name(attr_name), value)
            return fset

    @staticmethod
    def format_type_error(attr_name: str, value, validator: Validator.PropertyValidatable | Callable[[Any], bool]):
        if isinstance(validator, Validator.PropertyValidatable):
            return (
                f'Required type for {attr_name} is {validator.validate_func.__custom_str_format__} in '
                f'provided inputs. The given value {{{value}}} does not satisfy the criteria.',
            )
        else:
            return (
                f'Required type for {attr_name} is {validator.__custom_str_format__} in '
                f'provided inputs. The given value {{{value}}} does not satisfy the criteria.',
            )
