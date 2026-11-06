
from sqlalchemy import text
from database import engine

with engine.connect() as conn:
    queries = {
        "外注ユーザー": "SELECT COUNT(*) FROM users WHERE role = '外注'",
        "管理者以外のユーザー": "SELECT COUNT(*) FROM users WHERE role != '外注' OR role IS NULL",
        "外注ユーザーの参加申請": """
            SELECT COUNT(*) FROM applications a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = '外注'
        """,
        "外注ユーザーの割り当て": """
            SELECT COUNT(*) FROM job_assignments a
            JOIN users u ON a.user_id = u.id
            WHERE u.role = '外注'
        """,
        "外注ユーザーの個人予定": """
            SELECT COUNT(*) FROM personal_events p
            JOIN users u ON p.user_id = u.id
            WHERE u.role = '外注'
        """,
    }

    for label, query in queries.items():
        count = conn.execute(text(query)).scalar()
        print(f"{label}: {count}件")
