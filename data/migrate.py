# migrate.py
# runs all sql migration files in the correct order

import os
import psycopg2
from dotenv import load_dotenv

BASE = os.path.dirname(__file__)
ENV_PATH = os.path.join(BASE, '..', '.env.local')
load_dotenv(ENV_PATH)


TABLES = [
    'ritual_categories.sql',
    'profiles.sql',
    'rituals.sql',
    'log_statuses.sql',
    'ritual_logs.sql',
    'push_subscriptions.sql',
    'circles.sql',
    'circle_members.sql',
]

TRIGGERS = [
    'handle_new_user.sql',
]

SEEDS = [
    'seed_log_statuses.sql',
    'seed_ritual_categories.sql',
    'seed_test.sql' # only for tests 
]

VIEWS = [
    'daily_summary.sql',
    'ritual_log_history.sql',
    'ritual_progress.sql'
]

BASE = os.path.dirname(__file__)

def read(folder: str, filename: str) -> str:
    path = os.path.join(BASE, folder, filename)
    with open(path, 'r') as f:
        return f.read()

def run(cursor, folder: str, files: list[str]) -> None:
    for filename in files:
        sql = read(folder, filename)
        print(f'  running {folder}/{filename}...')
        cursor.execute(sql)

def migrate() -> None:

    db_url = os.getenv('DATABASE_URL')

    if not db_url:
        print("Error: can't find DATABASE_URL or is not defined")
        return

    try:
        conn = psycopg2.connect(os.environ['DATABASE_URL'])
        conn.autocommit = True
        cursor = conn.cursor()

        print("db_url: " + os.environ['DATABASE_URL'])

        print('running tables...')
        run(cursor, 'tables', TABLES)

        print('running triggers...')
        run(cursor, 'triggers', TRIGGERS)

        print('running seeds...')
        run(cursor, 'seeds', SEEDS)

        print('running views...')
        run(cursor, 'views', VIEWS)

        print('migration complete.')

    except Exception as e:
        print(f"Connexion or excution error: {e}")
    
    finally:
        if 'conn' in locals():
            cursor.close()
            conn.close()

if __name__ == '__main__':
    migrate()

