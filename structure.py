import os

project_structure = [
    # main app structure
    "quiz_backend/app/__init__.py",
    "quiz_backend/app/main.py",
    "quiz_backend/app/config.py",
    "quiz_backend/app/database.py",
    "quiz_backend/app/dependencies.py",

    # models split by entity
    "quiz_backend/app/models/__init__.py",
    "quiz_backend/app/models/user.py",
    "quiz_backend/app/models/quiz.py",
    "quiz_backend/app/models/question.py",
    "quiz_backend/app/models/submission.py",

    # schemas split by entity
    "quiz_backend/app/schemas/__init__.py",
    "quiz_backend/app/schemas/user.py",
    "quiz_backend/app/schemas/quiz.py",
    "quiz_backend/app/schemas/question.py",
    "quiz_backend/app/schemas/submission.py",

    # utils
    "quiz_backend/app/utils/__init__.py",
    "quiz_backend/app/utils/auth.py",
    "quiz_backend/app/utils/websocket_manager.py",

    # CRUD operations
    "quiz_backend/app/crud/__init__.py",
    "quiz_backend/app/crud/user.py",
    "quiz_backend/app/crud/quiz.py",
    "quiz_backend/app/crud/submission.py",

    # routers (APIs)
    "quiz_backend/app/routers/__init__.py",
    "quiz_backend/app/routers/auth.py",
    "quiz_backend/app/routers/user.py",
    "quiz_backend/app/routers/admin.py",
    "quiz_backend/app/routers/leaderboard.py",
    "quiz_backend/app/routers/quiz.py",
    "quiz_backend/app/routers/question.py",
    "quiz_backend/app/routers/submission.py",

    # project root files
    "quiz_backend/requirements.txt",
    "quiz_backend/.env",
    "quiz_backend/README.md",
]

for path in project_structure:
    dir_name = os.path.dirname(path)
    if dir_name and not os.path.exists(dir_name):
        os.makedirs(dir_name)
    if not path.endswith("/"):
        with open(path, "w") as f:
            if path.endswith(".py"):
                f.write(f"# {os.path.basename(path)}\n")
            else:
                f.write("")
print("✅ Project structure created.")
