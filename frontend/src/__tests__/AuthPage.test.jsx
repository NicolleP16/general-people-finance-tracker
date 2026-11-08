import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthPage from '../pages/AuthPage'

const { mockLogin, mockRegister, mockNavigate } = vi.hoisted(() => ({
  mockLogin: vi.fn(),
  mockRegister: vi.fn(),
  mockNavigate: vi.fn(),
}))

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin, register: mockRegister }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => mockNavigate }
})

const EMAIL = 'laura@ejemplo.com'
const PASSWORD = 'Mínimo 8 caracteres'
const NOMBRE = 'Laura Álvarez'

const llenarLogin = async (user) => {
  await user.type(screen.getByPlaceholderText(EMAIL), 'ana@mail.com')
  await user.type(screen.getByPlaceholderText(PASSWORD), '12345678')
}

const enviarLogin = async (user) => {
  await user.click(screen.getByRole('button', { name: /ingresar a mi cuenta/i }))
}

describe('AuthPage - inicio de sesión', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('muestra el formulario de login por defecto', () => {
    render(<AuthPage />)
    expect(screen.getByPlaceholderText(EMAIL)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(PASSWORD)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ingresar a mi cuenta/i })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText(NOMBRE)).not.toBeInTheDocument()
  })

  it('al pulsar "Crear cuenta" muestra el campo nombre y el botón Registrarme', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(screen.getByPlaceholderText(NOMBRE)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /registrarme/i })).toBeInTheDocument()
  })

  it('permite mostrar y ocultar la contraseña', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    const password = screen.getByPlaceholderText(PASSWORD)
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: /mostrar contraseña/i }))
    expect(password).toHaveAttribute('type', 'text')

    await user.click(screen.getByRole('button', { name: /ocultar contraseña/i }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('login exitoso llama a login con los datos y navega a /movimientos', async () => {
    mockLogin.mockResolvedValue({})
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('ana@mail.com', '12345678')
      expect(mockNavigate).toHaveBeenCalledWith('/movimientos')
    })
  })

  it('muestra el mensaje del servidor cuando el login falla', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Credenciales incorrectas' } },
    })
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    expect(await screen.findByText('Credenciales incorrectas')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('muestra error de conexión cuando no hay respuesta del servidor', async () => {
    mockLogin.mockRejectedValue(new Error('Network Error'))
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    expect(await screen.findByText('Network Error')).toBeInTheDocument()
  })

  it('en registro, un nombre en blanco muestra error y no llama a register', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await user.type(screen.getByPlaceholderText(NOMBRE), '   ')
    await user.type(screen.getByPlaceholderText(EMAIL), 'ana@mail.com')
    await user.type(screen.getByPlaceholderText(PASSWORD), '12345678')
    await user.click(screen.getByRole('button', { name: /registrarme/i }))

    expect(await screen.findByText('Por favor ingresa tu nombre completo')).toBeInTheDocument()
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('registro exitoso llama a register y navega a /movimientos', async () => {
    mockRegister.mockResolvedValue({})
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))

    await user.type(screen.getByPlaceholderText(NOMBRE), 'Ana Pérez')
    await user.type(screen.getByPlaceholderText(EMAIL), 'ana@mail.com')
    await user.type(screen.getByPlaceholderText(PASSWORD), '12345678')
    await user.click(screen.getByRole('button', { name: /registrarme/i }))

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith('Ana Pérez', 'ana@mail.com', '12345678')
      expect(mockNavigate).toHaveBeenCalledWith('/movimientos')
    })
  })
})

describe('AuthPage - mapeo de errores del backend', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mapea el error de email', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { email: ['Ya existe una cuenta con este correo'] } },
    })
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    expect(
      await screen.findByText('Email: Ya existe una cuenta con este correo')
    ).toBeInTheDocument()
  })

  it('mapea el error de contraseña', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { password: ['Debe tener al menos 8 caracteres'] } },
    })
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    expect(
      await screen.findByText('Contraseña: Debe tener al menos 8 caracteres')
    ).toBeInTheDocument()
  })

  it('usa el mensaje genérico si el backend no trae campos conocidos', async () => {
    mockLogin.mockRejectedValue({ response: { data: {} } })
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    expect(
      await screen.findByText('Credenciales inválidas o datos incorrectos')
    ).toBeInTheDocument()
  })

  it('usa el mensaje por defecto si el error no trae message', async () => {
    mockLogin.mockRejectedValue({})
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    expect(
      await screen.findByText('Error de conexión con el servidor')
    ).toBeInTheDocument()
  })
})

describe('AuthPage - interacción del formulario', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('limpia el error al volver a escribir', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Falló' } },
    })
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)
    expect(await screen.findByText('Falló')).toBeInTheDocument()

    await user.type(screen.getByPlaceholderText(EMAIL), 'x')
    expect(screen.queryByText('Falló')).not.toBeInTheDocument()
  })

  it('limpia el error al cambiar entre login y registro', async () => {
    mockLogin.mockRejectedValue({
      response: { data: { detail: 'Falló' } },
    })
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)
    expect(await screen.findByText('Falló')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(screen.queryByText('Falló')).not.toBeInTheDocument()
  })

  it('muestra el spinner y deshabilita el botón mientras carga', async () => {
    let resolver = () => {}
    mockLogin.mockReturnValue(
      new Promise((resolve) => {
        resolver = resolve
      })
    )
    const user = userEvent.setup()
    render(<AuthPage />)

    await llenarLogin(user)
    await enviarLogin(user)

    const boton = document.querySelector('button[type="submit"]')
    expect(boton).toBeDisabled()

    resolver({})
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/movimientos')
    })
  })

  it('permite volver a la pestaña de inicio de sesión desde registro', async () => {
    const user = userEvent.setup()
    render(<AuthPage />)
    await user.click(screen.getByRole('button', { name: /crear cuenta/i }))
    expect(screen.getByRole('button', { name: /registrarme/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
    expect(screen.getByRole('button', { name: /ingresar a mi cuenta/i })).toBeInTheDocument()
  })
  
})
