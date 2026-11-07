import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@pytest.mark.django_db
class TestUserModelAndManager:
    """Pruebas unitarias para UserManager y User model."""

    def test_create_user_successful(self):
        """Crear usuario estándar con email normalizado y contraseña cifrada."""
        user = User.objects.create_user(
            email="TEST@Example.Com",
            name="Laura Álvarez",
            password="StrongPassword123!"
        )
        assert user.email == "TEST@example.com"
        assert user.name == "Laura Álvarez"
        assert user.is_active is True
        assert user.is_staff is False
        assert user.check_password("StrongPassword123!") is True
        assert str(user) == "TEST@example.com"

    def test_create_user_without_email_raises_value_error(self):
        """Verifica que no se permita crear un usuario sin email."""
        with pytest.raises(ValueError, match="El email es obligatorio"):
            User.objects.create_user(
                email="",
                name="Sin Email",
                password="Password123!"
            )

    def test_create_superuser_successful(self):
        """Verifica creación de superusuario con permisos y rol admin."""
        admin = User.objects.create_superuser(
            email="admin@example.com",
            name="Admin User",
            password="AdminPassword123!"
        )
        assert admin.email == "admin@example.com"
        assert admin.is_staff is True
        assert admin.is_superuser is True


@pytest.mark.django_db
class TestAuthViews:
    """Pruebas para RegisterView, CustomLoginView y UserProfileView."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.register_url = "/api/auth/register/"
        self.login_url = "/api/auth/login/"
        self.profile_url = "/api/auth/me/"

    def test_register_user_success(self):
        """Registro exitoso devuelve código 201, datos del usuario y tokens JWT."""
        payload = {
            "name": "Carlos Gomez",
            "email": "carlos@example.com",
            "password": "SecurePassword123!"
        }
        response = self.client.post(self.register_url, payload, format="json")

        assert response.status_code == 201
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == "carlos@example.com"
        assert response.data["user"]["name"] == "Carlos Gomez"
        assert User.objects.filter(email="carlos@example.com").exists()

    def test_register_user_short_password_fails(self):
        """Rechaza contraseñas con menos de 8 caracteres según el serializador."""
        payload = {
            "name": "Corto",
            "email": "corto@example.com",
            "password": "123"
        }
        response = self.client.post(self.register_url, payload, format="json")

        assert response.status_code == 400
        assert "password" in response.data

    def test_register_duplicate_email_fails(self):
        """No permite registrar dos usuarios con el mismo correo."""
        User.objects.create_user(
            email="duplicado@example.com",
            name="Usuario Uno",
            password="Password123!"
        )

        payload = {
            "name": "Usuario Dos",
            "email": "duplicado@example.com",
            "password": "Password123!"
        }
        response = self.client.post(self.register_url, payload, format="json")

        assert response.status_code == 400
        assert "email" in response.data

    def test_login_success(self):
        """Login exitoso genera tokens y adjunta el payload con datos de usuario."""
        User.objects.create_user(
            email="loginuser@example.com",
            name="Login User",
            password="LoginPassword123!",
        )

        payload = {
            "email": "loginuser@example.com",
            "password": "LoginPassword123!"
        }
        response = self.client.post(self.login_url, payload, format="json")

        assert response.status_code == 200
        assert "access" in response.data
        assert "refresh" in response.data
        assert response.data["user"]["email"] == "loginuser@example.com"
        assert response.data["user"]["name"] == "Login User"

    def test_login_invalid_credentials_fails(self):
        """Credenciales incorrectas devuelven 401."""
        User.objects.create_user(
            email="user@example.com",
            name="User",
            password="CorrectPassword123!"
        )

        payload = {
            "email": "user@example.com",
            "password": "WrongPassword!"
        }
        response = self.client.post(self.login_url, payload, format="json")

        assert response.status_code == 401

    def test_get_user_profile_authenticated(self):
        """Un usuario autenticado puede consultar su propio perfil."""
        user = User.objects.create_user(
            email="perfil@example.com",
            name="Perfil User",
            password="Password123!"
        )
        self.client.force_authenticate(user=user)

        response = self.client.get(self.profile_url)

        assert response.status_code == 200
        assert response.data["email"] == "perfil@example.com"
        assert response.data["name"] == "Perfil User"

    def test_get_user_profile_unauthenticated_fails(self):
        """Petición anónima al perfil es rechazada con 401."""
        response = self.client.get(self.profile_url)
        assert response.status_code == 401

    def test_update_user_profile(self):
        """Un usuario puede actualizar su nombre mediante PATCH."""
        user = User.objects.create_user(
            email="update@example.com",
            name="Nombre Anterior",
            password="Password123!"
        )
        self.client.force_authenticate(user=user)

        response = self.client.patch(
            self.profile_url,
            {"name": "Nombre Actualizado"},
            format="json"
        )

        assert response.status_code == 200
        assert response.data["name"] == "Nombre Actualizado"
        user.refresh_from_db()
        assert user.name == "Nombre Actualizado"