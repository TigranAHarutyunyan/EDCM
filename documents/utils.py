from django.contrib.auth.models import User

def create_user_with_profile(username, password, email='', role='Employee', full_name='', position='', department=None):
    """
    Utility function to create a new user and aligned profile,
    ensuring admin flags match the business role.
    """
    is_staff = False
    is_superuser = False
    
    if role == 'Admin':
        is_staff = True
        is_superuser = True
    elif role == 'Department Chef':
        is_staff = True
        is_superuser = False

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        is_staff=is_staff,
        is_superuser=is_superuser
    )
    
    # Profile is created by signal, update it
    if hasattr(user, 'profile'):
        profile = user.profile
        profile.full_name = full_name
        profile.position = position
        profile.role = role
        profile.department = department
        profile.save()
            
    return user
