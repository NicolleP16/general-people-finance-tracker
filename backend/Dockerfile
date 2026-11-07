# Imagen base ligera de Python 3.12
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema requeridas para PostgreSQL/red
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt /app/
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copiar el código del backend
COPY . /app/

# Exponer el puerto de Django
EXPOSE 8000

# Comando para iniciar el servidor escuchando en todas las interfaces de red del contenedor
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]