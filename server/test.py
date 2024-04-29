from utils import Secret

secret_code: str = str(Secret.gen_random_code(5))
# convert 2nd and 5th character to its ascii upper case
print(secret_code)
secret_code = secret_code[:1] + chr(int(secret_code[1]) + 64) + secret_code[2:4] + secret_code[4].upper() + secret_code[5:]

print(secret_code)
