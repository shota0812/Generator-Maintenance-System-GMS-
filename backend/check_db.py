import sqlite3

conn = sqlite3.connect("jobs.db")
cursor = conn.cursor()

tables = cursor.execute(
    "SELECT name FROM sqlite_master WHERE type='table'"
).fetchall()

for (table,) in tables:
    count = cursor.execute(
        f'SELECT COUNT(*) FROM "{table}"'
    ).fetchone()[0]

    print(f"{table}: {count}件")

conn.close()