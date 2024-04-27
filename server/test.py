import mysql.connector

mydb = mysql.connector.connect(
  host="sql6.freesqldatabase.com",
  user="sql6702453",
  password="YZX8yckxlW",  # Remember to replace with your actual password (not recommended to store in code)
  database="sql6702453"  # Optional, if connecting to a specific database
)

mycursor = mydb.cursor()

# Your database operations here

mycursor.close()
mydb.close()
