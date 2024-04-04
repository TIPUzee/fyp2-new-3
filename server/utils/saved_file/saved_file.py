import os
import zipfile
import io

from flask import send_file

from ..request.response import Response as Res


class SavedFile:
    def __init__(self, file_name):
        self.file_name = file_name

    def exists(self):
        return os.path.exists(os.path.join('uploads', self.file_name))

    def return_file(self, as_attachment: bool = False, download_name: str = None):
        if not self.exists():
            raise Res.server_error(f'File {self.file_name} does not exist')
        raise Res.send_file(
            send_file(os.path.join('uploads', self.file_name), as_attachment=as_attachment,
                      download_name=download_name), Res.HTTPCode.OK)

    def delete(self):
        if not self.exists():
            return
        os.remove(os.path.join('uploads', self.file_name))


class SavedFilesZip:
    """
    This class is used to create a zip file of multiple files and return it
    """
    def __init__(self, saved_files: list[SavedFile]):
        self.saved_files = saved_files

    def return_zip(self):

        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'a', zipfile.ZIP_DEFLATED, False) as zip_file:
            for file in self.saved_files:
                if not file.exists():
                    raise Res.server_error(f'File {file.file_name} does not exist')
                zip_file.write(os.path.join('uploads', file.file_name), file.file_name)
        zip_buffer.seek(0)
        raise Res.send_file(send_file(zip_buffer, as_attachment=True, download_name='files.zip'), Res.HTTPCode.OK)
