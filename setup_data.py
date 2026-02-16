import os
import django
from django.core.management import call_command

def run():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    django.setup()
    print("Calling seed_data management command...")
    call_command('seed_data')

if __name__ == '__main__':
    run()
