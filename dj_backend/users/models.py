from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    """Custom user manager."""
    
    def create_user(self, username, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, username, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(username, email, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Custom user model."""
    
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    
    # Custom fields
    roles = models.JSONField(default=list, help_text="List of user roles")
    languages = models.JSONField(default=list, help_text="List of languages user can review")
    payout_balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    reviews_done = models.IntegerField(default=0)
    
    objects = UserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'users'
        verbose_name = 'user'
        verbose_name_plural = 'users'
    
    def __str__(self):
        return self.username
    
    def has_role(self, role):
        """Check if user has a specific role."""
        return role in (self.roles or [])
    
    def add_role(self, role):
        """Add a role to user."""
        if not self.roles:
            self.roles = []
        if role not in self.roles:
            self.roles.append(role)
            self.save(update_fields=['roles'])
    
    def remove_role(self, role):
        """Remove a role from user."""
        if self.roles and role in self.roles:
            self.roles.remove(role)
            self.save(update_fields=['roles'])
