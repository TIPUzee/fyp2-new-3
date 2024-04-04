import os
import uuid
from typing import Iterator

from werkzeug.datastructures import FileStorage

from ..request.response import Response as Res
from ..funcs import Func
from ..constants import Constants


class UploadedFile(FileStorage):
    def __init__(self, file_storage: FileStorage, *args, **kwargs):
        super().__init__(
            stream=file_storage.stream,
            filename=file_storage.filename,
            name=file_storage.name,
            content_type=file_storage.content_type,
            content_length=file_storage.content_length,
            headers=file_storage.headers,
        )
        _, self.extension = os.path.splitext(file_storage.filename)
        self.uuid = uuid.uuid4().hex
        self.time = Func.get_current_time().strftime('%Y-%m-%d-%H-%M-%S')
        self.uu_filename = f'{self.time}_{self.uuid}{self.extension}'
        # not using content_length because it is not reliable
        self.filesize = len(file_storage.stream.read()) / 1024 / 1024

    def save(self):
        super().save(os.path.join('uploads', self.uu_filename))

    def is_video(self):
        return self.extension[1:] in Constants.VIDEO_EXTENSIONS


class UploadedFiles(list):
    def __init__(self, file_storages: list[FileStorage], *args, **kwargs):
        super().__init__(*args, **kwargs)
        for file_storage in file_storages:
            self.append(UploadedFile(file_storage))

    def save_all(self):
        [i.save() for i in self]

    def max_files(self, max_files: int):
        if len(self) > max_files:
            return Res.frontend_error(f'Maximum {max_files} file(s) are allowed',
                                      f'You have uploaded {len(self)} file(s)')
        return self

    def min_files(self, min_files: int):
        if len(self) < min_files:
            return Res.frontend_error(f'Minimum {min_files} file(s) are allowed',
                                      f'You have uploaded {len(self)} file(s)')
        return self

    def __getitem__(self, item) -> UploadedFile:
        return super().__getitem__(item)

    def __setitem__(self, key, value: UploadedFile):
        super().__setitem__(key, value)

    def __delitem__(self, key):
        super().__delitem__(key)

    def __iter__(self) -> Iterator[UploadedFile]:
        return super().__iter__()

    def __reversed__(self) -> Iterator[UploadedFile]:
        return super().__reversed__()

    def __contains__(self, item):
        return super().__contains__(item)

    def __add__(self, other):
        return super().__add__(other)

    def __len__(self):
        return super().__len__()
